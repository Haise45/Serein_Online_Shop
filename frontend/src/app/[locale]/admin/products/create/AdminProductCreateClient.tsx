"use client";

// --- Import các component con ---
import ProductAttributesCard from "@/components/admin/products/ProductAttributesCard";
import ProductImageCard from "@/components/admin/products/ProductImageCard";
import ProductInfoCard from "@/components/admin/products/ProductInfoCard";
import ProductOrganizationCard from "@/components/admin/products/ProductOrganizationCard";
import ProductPricingCard from "@/components/admin/products/ProductPricingCard";
import { useGetAttributes } from "@/lib/react-query/attributeQueries";

// --- Import các hooks và utilities ---
import { useGetAllCategories } from "@/lib/react-query/categoryQueries";
import { useCreateAdminProduct } from "@/lib/react-query/productQueries";
import { useUploadImages } from "@/lib/react-query/uploadQueries";
import { buildCategoryTree, flattenTreeForSelect } from "@/lib/utils";
import { useTranslations } from "next-intl";

// --- Import các types ---
import {
  ProductAttributeCreation,
  ProductCreationData,
  VariantOptionValueCreation,
} from "@/services/productService";
import { Variant } from "@/types";

// --- Import các component từ CoreUI ---
import { CButton, CCol, CRow, CSpinner } from "@coreui/react";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

// --- Type Definitions ---

// === ĐỊNH NGHĨA TYPE CHO HANDLER ===
// Interface cho state của một biến thể trong form (cần export để component con dùng)
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
  optionValues: VariantOptionValueCreation[];
};

export type VariantChangeHandler = <K extends keyof VariantFormState>(
  index: number,
  field: K,
  value: VariantFormState[K],
) => void;

// Interface để quản lý ảnh theo màu
interface ColorImageMap {
  [colorValueId: string]: string[];
}

// --- Component Chính ---
export default function AdminProductCreateClient() {
  const t = useTranslations("AdminProductForm");
  const tValidation = useTranslations("AdminProductForm.validation");
  const router = useRouter();

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

  // State cho các trường Sale của sản phẩm chính
  const [saleStartDate, setSaleStartDate] = useState("");
  const [saleEndDate, setSaleEndDate] = useState("");

  // States cho Thuộc tính & Biến thể
  const [selectedAttributes, setSelectedAttributes] = useState<
    ProductAttributeCreation[]
  >([]);
  const [variants, setVariants] = useState<VariantFormState[]>([]);
  const [colorImages, setColorImages] = useState<ColorImageMap>({});

  // State cho Validation & Loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  // --- React Query Hooks ---
  const { data: categoriesPaginatedData, isLoading: isLoadingCategories } =
    useGetAllCategories({ limit: 9999, isActive: true });
  const { data: availableAttributes } = useGetAttributes();
  const uploadImagesMutation = useUploadImages();
  const createProductMutation = useCreateAdminProduct();

  // --- Dữ liệu được tính toán (Memoized) ---
  const categoriesForSelect = useMemo(() => {
    const allCats = categoriesPaginatedData?.categories || [];
    if (!allCats.length) return [];
    return flattenTreeForSelect(buildCategoryTree(allCats));
  }, [categoriesPaginatedData]);

  // --- Handlers cho thuộc tính và giá trị ---

  // --- HÀM ĐỂ XỬ LÝ THAY ĐỔI ĐA NGÔN NGỮ ---
  const handleI18nFieldChange = (
    field: "name" | "description",
    locale: "vi" | "en",
    value: string,
  ) => {
    setI18nData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [locale]: value,
      },
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

  // --- useEffect để tự động tạo biến thể ---
  useEffect(() => {
    // Không cần chạy nếu chưa có dữ liệu thuộc tính
    if (!availableAttributes) return;

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

    // Tìm ID của thuộc tính "Màu sắc" một cách động
    const colorAttrId = availableAttributes.find(
      (attr) => attr.name === "color",
    )?._id;

    const newVariants = combinations.map((combo): VariantFormState => {
      const key = combo.map((opt) => opt.value).join("-"); // Tạo key duy nhất từ các value ID
      const existingVariant = variants.find(
        (v) => v.optionValues.map((opt) => opt.value).join("-") === key,
      );

      // Tìm giá trị màu của tổ hợp hiện tại
      const colorValueOpt = colorAttrId
        ? combo.find((opt) => opt.attribute === colorAttrId)
        : undefined;

      // Lấy ảnh từ state colorImages dựa trên ID của giá trị màu
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
      };
    });

    setVariants(newVariants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAttributes, price, salePrice, colorImages, availableAttributes]);

  // --- Handlers ---
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
      { values: Map<string, string> }
    >();
    availableAttributes.forEach((attr) => {
      const valueMap = new Map<string, string>();
      attr.values.forEach((val) => {
        valueMap.set(val._id, val.value);
      });
      attributeLookupMap.set(attr._id, { values: valueMap });
    });

    // Hàm loại bỏ dấu
    const removeVietnameseTones = (str: string) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");

    // 3. Lặp qua các biến thể và tạo SKU mới
    const updatedVariants = variants.map((v) => {
      const optionPart = v.optionValues
        .map((opt) => {
          // Lấy ra tên giá trị từ ID
          const valueName = attributeLookupMap
            .get(opt.attribute)
            ?.values.get(opt.value);
          if (!valueName) return "??"; // Fallback nếu không tìm thấy

          const normalized = removeVietnameseTones(valueName.trim());

          // Tạo mã viết tắt (ví dụ: "Xanh Lá" -> "XL", "S" -> "S")
          // Logic này có thể tùy chỉnh theo ý bạn
          const parts = normalized.split(" ");
          if (parts.length > 1) {
            return parts.map((p) => p.charAt(0)).join(""); // "Xanh Lá" -> "XL"
          }
          return normalized; // "S" -> "S"
        })
        .join("-") // Nối các phần lại bằng dấu gạch ngang
        .toUpperCase();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(t("toasts.validationError"));
      return;
    }

    const productData: ProductCreationData = {
      name: i18nData.name,
      description: i18nData.description,
      price,
      category,
      images,
      isPublished,
      isActive,
      sku: sku || null,
      salePrice: salePrice > 0 ? salePrice : null,
      salePriceEffectiveDate: saleStartDate || null,
      salePriceExpiryDate: saleEndDate || null,
      stockQuantity: 0,
      attributes: selectedAttributes,
      variants: variants.map((v) => ({
        ...v,
        price: Number(v.price),
        stockQuantity: Number(v.stockQuantity) || 0,
        salePrice: v.salePrice ? Number(v.salePrice) : null,
      })),
    };

    createProductMutation.mutate(productData, {
      onSuccess: (createdProduct) => {
        router.push(`/admin/products/${createdProduct._id}/edit`);
      },
    });
  };

  // --- JSX Render ---
  return (
    <form onSubmit={handleSubmit}>
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
              disabled={createProductMutation.isPending || isUploading}
            >
              {createProductMutation.isPending && (
                <CSpinner size="sm" className="me-2" />
              )}
              {t("saveProduct")}
            </CButton>
          </div>
        </CCol>
      </CRow>
    </form>
  );
}
