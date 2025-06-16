"use client";

// --- Import các component con (Tái sử dụng hoàn toàn) ---
import ProductAttributesCard from "@/components/admin/products/ProductAttributesCard";
import ProductImageCard from "@/components/admin/products/ProductImageCard";
import ProductInfoCard from "@/components/admin/products/ProductInfoCard";
import ProductOrganizationCard from "@/components/admin/products/ProductOrganizationCard";
import ProductPricingCard from "@/components/admin/products/ProductPricingCard";

// --- Import các hằng số ---
import { useGetAttributes } from "@/lib/react-query/attributeQueries";

// --- Import các hooks và utilities ---
import { useGetAllCategories } from "@/lib/react-query/categoryQueries";
import {
  useGetAdminProductDetails,
  useUpdateAdminProduct,
} from "@/lib/react-query/productQueries";
import { useUploadImages } from "@/lib/react-query/uploadQueries";
import { buildCategoryTree, flattenTreeForSelect } from "@/lib/utils";

// --- Import các types ---
import {
  ProductAttributeCreation,
  ProductUpdateData,
  VariantCreationData,
  VariantOptionValueCreation,
} from "@/services/productService";
import { Variant } from "@/types";

// --- Import các component từ CoreUI ---
import { cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { CButton, CCol, CRow, CSpinner } from "@coreui/react";

// --- Import các hooks từ React và Next.js ---
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

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
  const router = useRouter();

  // --- States cho Form ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [salePrice, setSalePrice] = useState("");
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

  // --- React Query Hooks ---
  const {
    data: product,
    isLoading: isLoadingProduct,
    isError,
    error: productError,
  } = useGetAdminProductDetails(productId);
  const { data: categoriesPaginatedData, isLoading: isLoadingCategories } =
    useGetAllCategories({ limit: 9999, isActive: true });
  const { data: availableAttributes } = useGetAttributes();
  const uploadImagesMutation = useUploadImages();
  const updateProductMutation = useUpdateAdminProduct();

  // --- useEffect để điền dữ liệu từ API vào form (chạy một lần) ---
  useEffect(() => {
    // Chỉ chạy khi có dữ liệu sản phẩm và chưa được khởi tạo
    if (product && !isInitialized && availableAttributes) {
      setName(product.name);
      setDescription(product.description || "");
      setPrice(String(product.price));
      setSalePrice(product.salePrice ? String(product.salePrice) : "");

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
      const key = combo.map((opt) => opt.value).join("-"); // Tạo key duy nhất từ các value ID
      const existingVariant = variants.find(
        (v) => v.optionValues.map((opt) => opt.value).join("-") === key,
      );

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
        price: existingVariant?.price ?? price,
        stockQuantity: existingVariant?.stockQuantity ?? "0",
        images: imagesForVariant,
        salePrice: existingVariant?.salePrice ?? "",
      };
    });

    setVariants(newVariants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedAttributes,
    price,
    colorImages,
    isInitialized,
    availableAttributes,
  ]);

  // --- Handlers ---
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

  const generateAllVariantSKUs = () => {
    // 1. Kiểm tra điều kiện đầu vào
    const baseSku =
      sku || name.substring(0, 6).toUpperCase().replace(/\s/g, "");
    if (!baseSku) {
      toast.error(
        "Vui lòng nhập Tên sản phẩm hoặc SKU chính để tạo SKU hàng loạt.",
      );
      return;
    }
    if (!availableAttributes) {
      toast.error("Dữ liệu thuộc tính chưa sẵn sàng, vui lòng thử lại.");
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

    // 3. Lặp qua các biến thể và tạo SKU mới
    const updatedVariants = variants.map((v) => {
      const optionPart = v.optionValues
        .map((opt) => {
          // Lấy ra tên giá trị từ ID
          const valueName = attributeLookupMap
            .get(opt.attribute)
            ?.values.get(opt.value);
          if (!valueName) return "??"; // Fallback nếu không tìm thấy

          // Tạo mã viết tắt (ví dụ: "Xanh Lá" -> "XL", "S" -> "S")
          // Logic này có thể tùy chỉnh theo ý bạn
          const parts = valueName.split(" ");
          if (parts.length > 1) {
            return parts.map((p) => p.charAt(0)).join(""); // "Xanh Lá" -> "XL"
          }
          return valueName; // "S" -> "S"
        })
        .join("-") // Nối các phần lại bằng dấu gạch ngang
        .toUpperCase();

      return { ...v, sku: `${baseSku}-${optionPart}` };
    });

    // 4. Cập nhật state
    setVariants(updatedVariants);
    toast.success("Đã tạo SKU hàng loạt cho các biến thể!");
  };

  const generateSKU = () => {
    const namePart = name.substring(0, 3).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    setSku(`${namePart}-${randomPart}`);
  };

  const handleImageUpload = (files: File[], colorValueId?: string) => {
    if (files.length === 0) return;
    setIsUploading(true);
    const toastId = toast.loading(`Đang tải ảnh lên...`);

    uploadImagesMutation.mutate(
      { files, area: "products" },
      {
        onSuccess: (data) => {
          toast.success("Tải ảnh lên thành công!", { id: toastId });
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
        onError: () => toast.error("Tải ảnh thất bại.", { id: toastId }),
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
    if (!name.trim()) newErrors.name = "Tên sản phẩm là bắt buộc.";
    if (!category) newErrors.category = "Vui lòng chọn danh mục.";
    if (!price.trim() || isNaN(Number(price)) || Number(price) < 0)
      newErrors.price = "Giá sản phẩm không hợp lệ.";
    if (images.length === 0)
      newErrors.images = "Cần ít nhất một ảnh chính cho sản phẩm.";
    variants.forEach((v, i) => {
      if (!v.sku.trim())
        newErrors[`variant_sku_${i}`] = "SKU biến thể là bắt buộc.";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, category, price, images, variants]);

  // --- Form Submission ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại các trường thông tin bắt buộc.");
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
      name,
      description,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : null,
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
          onClick={() => router.push("/admin/products")}
        >
          ← Quay lại danh sách
        </CButton>
      </div>

      <CRow>
        <CCol xs={12} lg={8}>
          <ProductInfoCard
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            error={errors.name}
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
            price={price}
            setPrice={setPrice}
            salePrice={salePrice}
            setSalePrice={setSalePrice}
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

          <div className="d-grid sticky-top gap-2" style={{ top: "80px" }}>
            <CButton
              type="submit"
              color="primary"
              disabled={updateProductMutation.isPending || isUploading}
            >
              {updateProductMutation.isPending && (
                <CSpinner size="sm" className="me-2" />
              )}
              Cập nhật sản phẩm
            </CButton>
          </div>
        </CCol>
      </CRow>
    </form>
  );
}
