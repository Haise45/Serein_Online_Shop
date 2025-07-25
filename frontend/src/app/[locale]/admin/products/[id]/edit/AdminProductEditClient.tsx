"use client";

// --- Import các component con (Tái sử dụng hoàn toàn) ---
import ProductAttributesCard from "@/components/admin/products/ProductAttributesCard";
import ProductImageCard from "@/components/admin/products/ProductImageCard";
import ProductInfoCard from "@/components/admin/products/ProductInfoCard";
import ProductOrganizationCard from "@/components/admin/products/ProductOrganizationCard";
import ProductPricingCard from "@/components/admin/products/ProductPricingCard";

// --- Import các hằng số ---
import { useGetAdminAttributes } from "@/lib/react-query/attributeQueries";

// --- Import các hooks và utilities ---
import { useGetAllCategories } from "@/lib/react-query/categoryQueries";
import {
  useGetAdminProductDetails,
  useUpdateAdminProduct,
} from "@/lib/react-query/productQueries";
import { useUploadImages } from "@/lib/react-query/uploadQueries";
import {
  buildCategoryTree,
  flattenTreeForSelect,
  getLocalizedName,
} from "@/lib/utils";
import { useTranslations } from "next-intl";

// --- Import các types ---
import {
  ProductAttributeCreation,
  ProductUpdateData,
  VariantCreationData,
  VariantOptionValueCreation,
} from "@/services/productService";
import { Variant, I18nField } from "@/types";

// --- Import các component từ CoreUI ---
import { cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { CButton, CCol, CRow, CSpinner } from "@coreui/react";

// --- Import các hooks từ React và Next.js ---
import { AppDispatch } from "@/store";
import {
  clearBreadcrumbDynamicData,
  setBreadcrumbDynamicData,
} from "@/store/slices/breadcrumbAdminSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useLocale } from "next-intl";

// --- Type Definitions ---
// Định nghĩa kiểu cho hàm xử lý thay đổi biến thể, cần export để component con dùng
export type VariantChangeHandler = <K extends keyof VariantFormState>(
  index: number,
  field: K,
  value: VariantFormState[K],
) => void;

// Interface cho state của một biến thể trong form, dùng string cho các input số
export type VariantFormState = Omit<
  Variant,
  | "_id"
  | "price"
  | "stockQuantity"
  | "salePrice"
  | "displayPrice"
  | "isOnSale"
  | "optionValues"
> & {
  price: string;
  stockQuantity: string;
  salePrice: string;
  optionValues: { attribute: string; value: string }[];
};

interface ColorImageMap {
  [colorValueId: string]: string[];
}

// --- Props cho Component Chính ---
interface AdminProductEditClientProps {
  productId: string;
}

export default function AdminProductEditClient({
  productId,
}: AdminProductEditClientProps) {
  const t = useTranslations("AdminProductForm");
  const tValidation = useTranslations("AdminProductForm.validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale() as "vi" | "en";

  // --- States cho Form ---
  const [i18nData, setI18nData] = useState({
    name: { vi: "", en: "" },
    description: { vi: "", en: "" },
  });
  const [price, setPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [saleStartDate, setSaleStartDate] = useState("");
  const [saleEndDate, setSaleEndDate] = useState("");
  const [selectedAttributes, setSelectedAttributes] = useState<
    ProductAttributeCreation[]
  >([]);
  const [variants, setVariants] = useState<VariantFormState[]>([]);
  const [colorImages, setColorImages] = useState<ColorImageMap>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- useRef để lưu trữ dữ liệu gốc của biến thể, tránh mất dữ liệu khi re-render ---
  const originalVariantsRef = useRef<VariantFormState[]>([]);

  const backLink = `/admin/products?${searchParams.toString()}`;

  // --- React Query Hooks ---
  const {
    data: product,
    isLoading: isLoadingProduct,
    isError,
    error: productError,
  } = useGetAdminProductDetails(productId);
  const { data: categoriesPaginatedData, isLoading: isLoadingCategories } =
    useGetAllCategories({ limit: 9999, isActive: true });
  const { data: availableAttributes } = useGetAdminAttributes();
  const uploadImagesMutation = useUploadImages();
  const updateProductMutation = useUpdateAdminProduct();

  // --- useEffect để điền dữ liệu từ API vào form (chạy một lần) ---
  useEffect(() => {
    // Chỉ chạy khi có dữ liệu sản phẩm và chưa được khởi tạo
    if (product && !isInitialized && availableAttributes) {
      setI18nData({
        name: product.name,
        description: product.description || { vi: "", en: "" },
      });
      setPrice(product.price);
      setSalePrice(product.salePrice || 0);

      const formatDateForInput = (dateStr: string | Date | null | undefined) =>
        dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";
      setSaleStartDate(formatDateForInput(product.salePriceEffectiveDate));
      setSaleEndDate(formatDateForInput(product.salePriceExpiryDate));

      setSku(product.sku || "");
      setCategory(
        typeof product.category === "string"
          ? product.category
          : product.category._id,
      );
      setImages(product.images || []);
      setIsPublished(product.isPublished);
      setIsActive(product.isActive);

      // 1. Tìm ID của thuộc tính "Màu sắc" một cách tự động
      const colorAttribute = availableAttributes.find(
        (attr) => attr.name === "color",
      );
      const colorAttrId = colorAttribute?._id;

      // 2. Tạo ColorImageMap từ các biến thể
      const initialColorImages: ColorImageMap = {};
      if (colorAttrId) {
        product.variants.forEach((variant) => {
          const colorOption = variant.optionValues.find((opt) => {
            const attrId =
              typeof opt.attribute === "string"
                ? opt.attribute
                : opt.attribute._id;
            return attrId === colorAttrId;
          });

          if (colorOption && variant.images && variant.images.length > 0) {
            const colorValueId =
              typeof colorOption.value === "string"
                ? colorOption.value
                : colorOption.value._id;
            // Gán mảng ảnh vào state với key là ID của giá trị màu
            initialColorImages[colorValueId] = variant.images;
          }
        });
      }
      // Cập nhật state colorImages
      setColorImages(initialColorImages);

      const initialSelectedAttributes: ProductAttributeCreation[] =
        product.attributes.map((attr) => ({
          attribute:
            typeof attr.attribute === "string"
              ? attr.attribute
              : attr.attribute._id,
          values: attr.values.map((val) =>
            typeof val === "string" ? val : val._id,
          ),
        }));
      setSelectedAttributes(initialSelectedAttributes);

      const formVariants: VariantFormState[] = product.variants.map((v) => ({
        sku: v.sku,
        price: String(v.price),
        stockQuantity: String(v.stockQuantity),
        salePrice: v.salePrice ? String(v.salePrice) : "",
        salePriceEffectiveDate: formatDateForInput(v.salePriceEffectiveDate),
        salePriceExpiryDate: formatDateForInput(v.salePriceExpiryDate),
        images: v.images || [],
        optionValues: v.optionValues.map((opt) => ({
          attribute:
            typeof opt.attribute === "string"
              ? opt.attribute
              : opt.attribute._id,
          value: typeof opt.value === "string" ? opt.value : opt.value._id,
        })),
      }));

      // Điền vào state và LƯU vào ref để làm "nguồn chân lý"
      setVariants(formVariants);
      originalVariantsRef.current = formVariants;

      setIsInitialized(true); // Đánh dấu là đã điền dữ liệu xong
    }
  }, [product, isInitialized, availableAttributes]);

  useEffect(() => {
    if (i18nData.name) {
      dispatch(
        setBreadcrumbDynamicData({
          productName: getLocalizedName(i18nData.name, locale),
        }),
      );
    }

    return () => {
      dispatch(clearBreadcrumbDynamicData());
    };
  }, [i18nData.name, dispatch, locale]);

  // --- Dữ liệu được tính toán (Memoized) ---
  const categoriesForSelect = useMemo(() => {
    if (!categoriesPaginatedData) return [];
    // Lấy mảng categories từ object trả về
    const allCategories = categoriesPaginatedData.categories || [];
    const tree = buildCategoryTree(allCategories);
    return flattenTreeForSelect(tree);
  }, [categoriesPaginatedData]);

  // --- useEffect để tạo/cập nhật danh sách biến thể khi thuộc tính thay đổi ---
  useEffect(() => {
    // Chặn không cho chạy trước khi dữ liệu gốc được điền
    if (!isInitialized || !availableAttributes) return;

    const activeAttrs = selectedAttributes.filter(
      (attr) => attr.values.length > 0,
    );
    if (activeAttrs.length === 0) {
      setVariants([]);
      return;
    }

    const combinations = activeAttrs.reduce<VariantOptionValueCreation[][]>(
      (acc, attr) => {
        if (acc.length === 0) {
          return attr.values.map((valId) => [
            { attribute: attr.attribute, value: valId },
          ]);
        }
        return acc.flatMap((combo) =>
          attr.values.map((valId) => [
            ...combo,
            { attribute: attr.attribute, value: valId },
          ]),
        );
      },
      [],
    );

    const colorAttrId = availableAttributes.find(
      (attr) => attr.name === "color",
    )?._id;

    const newVariants = combinations.map((combo): VariantFormState => {
      const existingVariant = originalVariantsRef.current.find((v) => {
        if (v.optionValues.length !== combo.length) return false;
        return combo.every((c) =>
          v.optionValues.some(
            (vo) => vo.attribute === c.attribute && vo.value === c.value,
          ),
        );
      });

      const colorValueOpt = colorAttrId
        ? combo.find((opt) => opt.attribute === colorAttrId)
        : undefined;
      const imagesForVariant =
        colorValueOpt && colorImages[colorValueOpt.value]
          ? colorImages[colorValueOpt.value]
          : [];

      return {
        optionValues: combo,
        sku: existingVariant?.sku || "",
        price: existingVariant?.price ?? String(price),
        stockQuantity: existingVariant?.stockQuantity ?? "0",
        images: imagesForVariant,
        salePrice:
          existingVariant?.salePrice ??
          (salePrice > 0 ? String(salePrice) : ""),
        salePriceEffectiveDate: existingVariant?.salePriceEffectiveDate || "",
        salePriceExpiryDate: existingVariant?.salePriceExpiryDate || "",
      };
    });

    setVariants(newVariants);
  }, [
    selectedAttributes,
    price,
    salePrice,
    colorImages,
    isInitialized,
    availableAttributes,
  ]);

  // --- Handlers ---
  const handleI18nFieldChange = (
    field: "name" | "description",
    locale: "vi" | "en",
    value: string,
  ) => {
    setI18nData((prev) => ({
      ...prev,
      [field]: { ...prev[field], [locale]: value },
    }));
  };

  // Khi admin check/uncheck một thuộc tính (VD: "Màu sắc")
  const handleAttributeToggle = (attributeId: string) => {
    setSelectedAttributes((prev) => {
      const isAlreadySelected = prev.some(
        (attr) => attr.attribute === attributeId,
      );
      if (isAlreadySelected) {
        return prev.filter((attr) => attr.attribute !== attributeId);
      } else {
        return [...prev, { attribute: attributeId, values: [] }];
      }
    });
  };

  // Khi admin chọn/bỏ chọn một giá trị (VD: "Đỏ", "Size S")
  const handleValueToggle = (attributeId: string, valueId: string) => {
    setSelectedAttributes((prev) => {
      return prev.map((attr) => {
        if (attr.attribute === attributeId) {
          const newValues = [...attr.values];
          const valueIndex = newValues.indexOf(valueId);
          if (valueIndex > -1) {
            newValues.splice(valueIndex, 1);
          } else {
            newValues.push(valueId);
          }
          return { ...attr, values: newValues };
        }
        return attr;
      });
    });
  };

  const handleVariantChange: VariantChangeHandler = (index, field, value) => {
    setVariants((prev) => {
      const updatedVariants = [...prev];
      updatedVariants[index] = { ...updatedVariants[index], [field]: value };
      return updatedVariants;
    });
  };

  const removeVariant = (indexToRemove: number) => {
    setVariants((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeVietnameseTones = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
  };
  
  const generateAllVariantSKUs = () => {
    // 1. Kiểm tra điều kiện đầu vào
    const baseSku =
      sku || i18nData.name.vi.substring(0, 6).toUpperCase().replace(/\s/g, "");
    if (!baseSku) {
      toast.error(t("toasts.baseSkuRequired"));
      return;
    }
    if (!availableAttributes) {
      toast.error(t("toasts.attributesNotReady"));
      return;
    }

    // 2. Tạo một bộ đệm tra cứu (lookup map) để tăng tốc
    const attributeLookupMap = new Map<
      string,
      { values: Map<string, I18nField> }
    >();
    if (availableAttributes) {
      availableAttributes.forEach((attr) => {
        const valueMap = new Map<string, I18nField>();
        attr.values.forEach((val) => {
          valueMap.set(val._id, val.value);
        });
        attributeLookupMap.set(attr._id, { values: valueMap });
      });
    }

    // 3. Tạo mã SKU cho từng biến thể
    const updatedVariants = variants.map((v) => {
      const optionPart = v.optionValues
        .map((opt) => {
          const valueObject = attributeLookupMap
            .get(opt.attribute)
            ?.values.get(opt.value);

          // Luôn lấy value Tiếng Việt
          let valueName = valueObject?.vi || "??";
          valueName = removeVietnameseTones(valueName.trim()); // Bỏ dấu

          const words = valueName.split(/\s+/); // Tách từ

          if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase(); // "Nau" => "NA"
          }

          return words
            .map((w) => w[0])
            .join("")
            .toUpperCase(); // "Xanh La" => "XL"
        })
        .join("-");

      return { ...v, sku: `${baseSku}-${optionPart}` };
    });

    // 4. Cập nhật state
    setVariants(updatedVariants);
    toast.success(t("toasts.bulkSkuSuccess"));
  };

  const generateSKU = () => {
    const namePart = i18nData.name.vi.substring(0, 3).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    setSku(`${namePart}-${randomPart}`);
  };

  const handleImageUpload = (files: File[], colorValueId?: string) => {
    if (files.length === 0) return;
    setIsUploading(true);
    const toastId = toast.loading(t("toasts.uploading"));

    uploadImagesMutation.mutate(
      { files, area: "products" },
      {
        onSuccess: (data) => {
          toast.success(t("toasts.uploadSuccess"), { id: toastId });
          if (colorValueId) {
            // Dùng colorValueId làm key
            setColorImages((prev) => ({
              ...prev,
              [colorValueId]: [
                ...(prev[colorValueId] || []),
                ...data.imageUrls,
              ],
            }));
          } else {
            setImages((prev) => [...prev, ...data.imageUrls]);
          }
        },
        onError: () => toast.error(t("toasts.uploadError"), { id: toastId }),
        onSettled: () => setIsUploading(false),
      },
    );
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeColorImage = (color: string, indexToRemove: number) => {
    setColorImages((prev) => ({
      ...prev,
      [color]: prev[color].filter((_, index) => index !== indexToRemove),
    }));
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!i18nData.name.vi.trim())
      newErrors.name_vi = tValidation("nameRequired", { locale: "Tiếng Việt" });
    if (!i18nData.name.en.trim())
      newErrors.name_en = tValidation("nameRequired", { locale: "English" });

    if (!category) newErrors.category = tValidation("categoryRequired");

    if (isNaN(price) || price < 0)
      newErrors.price = tValidation("priceInvalid");

    if (images.length === 0) newErrors.images = tValidation("imagesRequired");

    variants.forEach((v, i) => {
      if (!v.sku.trim())
        newErrors[`variant_sku_${i}`] = tValidation("variantSkuRequired");
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    i18nData.name.vi,
    i18nData.name.en,
    category,
    price,
    images.length,
    variants,
    tValidation,
  ]);

  // --- Form Submission ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(t("toasts.validationError"));
      return;
    }

    const finalVariants: VariantCreationData[] = variants.map((v) => ({
      sku: v.sku,
      price: Number(v.price),
      stockQuantity: Number(v.stockQuantity) || 0,
      optionValues: v.optionValues,
      images: v.images || [],
      salePrice: v.salePrice ? Number(v.salePrice) : null,
      salePriceEffectiveDate: v.salePriceEffectiveDate || null,
      salePriceExpiryDate: v.salePriceExpiryDate || null,
    }));

    const productData: ProductUpdateData = {
      name: i18nData.name,
      description: i18nData.description,
      price,
      salePrice: salePrice > 0 ? salePrice : null,
      salePriceEffectiveDate: saleStartDate || null,
      salePriceExpiryDate: saleEndDate || null,
      sku: sku || null,
      category,
      images,
      isPublished,
      isActive,
      attributes: selectedAttributes,
      variants: finalVariants,
    };

    updateProductMutation.mutate({ productId, productData });
  };

  // --- Xử lý trạng thái Loading và Error ---
  if (isLoadingProduct) {
    return (
      <div className="p-5 text-center">
        <CSpinner /> Đang tải dữ liệu sản phẩm...
      </div>
    );
  }
  if (isError) {
    return (
      <div className="text-danger bg-danger-light rounded border p-5 text-center">
        <CIcon icon={cilWarning} size="xl" className="mb-3" />
        <h4 className="mb-2">Lỗi không thể tải sản phẩm</h4>
        <p>{productError?.message || "Đã có lỗi xảy ra."}</p>
      </div>
    );
  }

  // --- JSX Render ---
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <CButton
          color="secondary"
          variant="outline"
          onClick={() => router.push(backLink)}
        >
          {t("backToList")}
        </CButton>
      </div>

      <CRow>
        <CCol xs={12} lg={8}>
          <ProductInfoCard
            name={i18nData.name}
            description={i18nData.description}
            onFieldChange={handleI18nFieldChange}
            errors={errors}
          />
          <ProductImageCard
            images={images}
            isUploading={isUploading}
            onImageUpload={(files) => handleImageUpload(files)}
            onRemoveImage={removeImage}
            error={errors.images}
          />
          <ProductAttributesCard
            selectedAttributes={selectedAttributes}
            variants={variants}
            colorImages={colorImages}
            errors={errors}
            onAttributeToggle={handleAttributeToggle}
            onValueToggle={handleValueToggle}
            onColorImageUpload={(files, valueId) =>
              handleImageUpload(files, valueId)
            }
            onRemoveColorImage={removeColorImage}
            onGenerateAllVariantSKUs={generateAllVariantSKUs}
            onRemoveVariant={removeVariant}
            onVariantChange={handleVariantChange}
          />
        </CCol>
        <CCol xs={12} lg={4}>
          <ProductPricingCard
            priceVND={price}
            setPriceVND={setPrice}
            salePriceVND={salePrice}
            setSalePriceVND={setSalePrice}
            saleStartDate={saleStartDate}
            setSaleStartDate={setSaleStartDate}
            saleEndDate={saleEndDate}
            setSaleEndDate={setSaleEndDate}
            sku={sku}
            setSku={setSku}
            onGenerateSKU={generateSKU}
            error={errors.price}
          />
          <ProductOrganizationCard
            category={category}
            setCategory={setCategory}
            isPublished={isPublished}
            setIsPublished={setIsPublished}
            isActive={isActive}
            setIsActive={setIsActive}
            categoriesForSelect={categoriesForSelect}
            isLoadingCategories={isLoadingCategories}
            error={errors.category}
          />

          <div className="d-grid gap-2">
            <CButton
              type="submit"
              color="primary"
              disabled={updateProductMutation.isPending || isUploading}
            >
              {updateProductMutation.isPending && (
                <CSpinner size="sm" className="me-2" />
              )}
              {t("updateProduct")}
            </CButton>
          </div>
        </CCol>
      </CRow>
    </form>
  );
}
