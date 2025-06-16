"use client";

import {
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/lib/react-query/cartQueries";
import { useGetProductDetails } from "@/lib/react-query/productQueries";
import { formatCurrency, getVariantDisplayNameClient } from "@/lib/utils";
import {
  Attribute,
  AttributeValue,
  CartItem as CartItemType,
  ProductAttribute,
  VariantOptionValue,
} from "@/types";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiCheck,
  FiChevronDown,
  FiLoader,
  FiMinus,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

// Định nghĩa props cho component
interface CartItemRowProps {
  item: CartItemType;
  isSelected: boolean;
  onSelectItem: (itemId: string, isSelected: boolean) => void;
  // Nhận vào bộ đệm tra cứu để dịch ID sang tên một cách hiệu quả
  attributeMap: Map<string, { label: string; values: Map<string, string> }>;
}

export default function CartItemRow({
  item,
  isSelected,
  onSelectItem,
  attributeMap,
}: CartItemRowProps) {
  // --- Hooks ---
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();

  const productIdOrSlug =
    typeof item.productId === "string" ? item.productId : item.productId._id;
  const {
    data: productDetails,
    isLoading: isLoadingProduct,
    isError,
    error: productErrorData,
    refetch: refetchProduct,
  } = useGetProductDetails(productIdOrSlug);

  // --- State ---
  const [quantity, setQuantity] = useState(item.quantity);
  // State lưu trữ các lựa chọn hiện tại của người dùng, dạng { [attributeId]: valueId }
  const [selectedOptions, setSelectedOptions] = useState<{
    [attributeId: string]: string;
  }>({});

  // Khởi tạo state từ props của item khi component được render hoặc item thay đổi
  useEffect(() => {
    const initialOptions: { [attributeId: string]: string } = {};
    if (item.variantInfo?.options) {
      item.variantInfo.options.forEach((opt: VariantOptionValue) => {
        const attrId =
          typeof opt.attribute === "string" ? opt.attribute : opt.attribute._id;
        const valueId =
          typeof opt.value === "string" ? opt.value : opt.value._id;
        if (attrId && valueId) {
          // Đảm bảo cả hai đều hợp lệ
          initialOptions[attrId] = valueId;
        }
      });
    }
    setSelectedOptions(initialOptions);
    setQuantity(item.quantity);
  }, [item]); // Phụ thuộc vào `item` để luôn cập nhật khi giỏ hàng thay đổi từ server

  // --- Logic kiểm tra lỗi tồn kho ---
  const isOutOfStock = item.availableStock === 0;
  const hasStockError = !isOutOfStock && item.quantity > item.availableStock;

  // --- Handlers ---
  const handleQuantityChange = (newQuantity: number) => {
    if (updateCartItemMutation.isPending) return;
    if (newQuantity >= 1 && newQuantity <= item.availableStock) {
      updateCartItemMutation.mutate({
        itemId: item._id,
        payload: { quantity: newQuantity },
      });
    } else if (newQuantity > item.availableStock) {
      toast.error(`Chỉ còn ${item.availableStock} sản phẩm tồn kho.`);
      // Vẫn cập nhật số lượng về mức tối đa có thể
      updateCartItemMutation.mutate({
        itemId: item._id,
        payload: { quantity: item.availableStock },
      });
    }
  };

  const handleRemoveItem = () => {
    removeCartItemMutation.mutate(item._id);
  };

  const handleOptionChange = useCallback(
    (attributeId: string, newValueId: string) => {
      if (updateCartItemMutation.isPending || !productDetails) return;

      // 1. Tạo ra tổ hợp lựa chọn mới mà người dùng đang muốn
      const newAttemptedOptions = {
        ...selectedOptions,
        [attributeId]: newValueId,
      };

      // 2. Tìm một biến thể trong danh sách của sản phẩm khớp với tổ hợp mới này
      const newVariant = productDetails.variants.find((variant) => {
        // Biến thể mới phải có cùng số lượng lựa chọn
        if (
          variant.optionValues.length !==
          Object.keys(newAttemptedOptions).length
        ) {
          return false;
        }
        // Tất cả các lựa chọn trong biến thể phải khớp với lựa chọn mới
        return variant.optionValues.every((ov) => {
          const ovAttrId =
            typeof ov.attribute === "string" ? ov.attribute : ov.attribute._id;
          const ovValueId =
            typeof ov.value === "string" ? ov.value : ov.value._id;
          return newAttemptedOptions[ovAttrId] === ovValueId;
        });
      });

      if (newVariant) {
        // 3. Nếu tìm thấy một biến thể hợp lệ...
        if (newVariant._id !== item.variantInfo?._id) {
          // ...và nó khác với biến thể hiện tại -> gọi API để cập nhật
          updateCartItemMutation.mutate(
            { itemId: item._id, payload: { newVariantId: newVariant._id } },
            { onError: () => setSelectedOptions(selectedOptions) }, // Rollback nếu lỗi
          );
        }
        // Nếu chọn lại chính nó thì không làm gì cả
      } else {
        // 4. Nếu không tìm thấy biến thể nào khớp -> đây là tổ hợp không tồn tại
        toast.error("Phiên bản này không có sẵn hoặc đã hết hàng.");
        // Không cập nhật `selectedOptions` để UI giữ nguyên lựa chọn cũ hợp lệ
      }
    },
    [productDetails, selectedOptions, item, updateCartItemMutation],
  );

  // --- Render Logic ---

  // Trạng thái Loading
  if (isLoadingProduct) {
    return (
      <li className="flex animate-pulse flex-col px-4 py-6 sm:flex-row sm:px-6">
        <div className="flex flex-shrink-0">
          <div className="mr-4 h-5 w-5 rounded-md bg-gray-300"></div>
          <div className="h-32 w-32 rounded-md bg-gray-300 sm:h-40 sm:w-40"></div>
        </div>
        <div className="mt-4 ml-4 flex-1 sm:mt-0">
          <div className="h-6 w-3/4 rounded bg-gray-300"></div>
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-300"></div>
          <div className="mt-4 h-10 w-28 rounded bg-gray-300"></div>
        </div>
      </li>
    );
  }

  // Trạng thái Error
  if (isError || !productDetails) {
    return (
      <li className="flex items-center bg-red-50 px-4 py-6 text-sm sm:px-6">
        <FiAlertCircle className="mr-3 h-6 w-6 flex-shrink-0 text-red-500" />
        <div className="flex-grow">
          <p className="font-medium text-red-700">
            Lỗi tải thông tin cho sản phẩm &quot;{item.name}&quot;
          </p>
          <p className="text-xs text-gray-600">
            {productErrorData?.message || "Sản phẩm có thể đã bị xóa hoặc ẩn."}
          </p>
        </div>
        <button
          onClick={() => refetchProduct()}
          className="ml-4 text-xs whitespace-nowrap text-indigo-600 hover:underline"
        >
          Thử lại
        </button>
      </li>
    );
  }

  // Trạng thái bình thường
  return (
    <li
      className={classNames("flex flex-col px-4 py-6 sm:flex-row sm:px-6", {
        "bg-indigo-50/50": isSelected && !hasStockError && !isOutOfStock,
        "bg-red-50": hasStockError || isOutOfStock,
      })}
    >
      <div className="flex flex-shrink-0 flex-row justify-between">
        <div className="order-2 flex-shrink-0 self-start pr-4 sm:pr-6 md:order-1 md:self-center">
          <input
            id={`cart-item-${item._id}`}
            type="checkbox"
            className="h-5 w-5 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500"
            checked={isSelected}
            onChange={(e) => onSelectItem(item._id, e.target.checked)}
            aria-label={`Chọn sản phẩm ${item.name}`}
          />
        </div>
        <div className="order-1 mb-4 flex-shrink-0 sm:mr-6 sm:mb-0 md:order-2">
          <Image
            src={item.image || "/placeholder-image.jpg"}
            alt={item.name}
            width={160}
            height={160}
            quality={100}
            className="h-32 w-32 rounded-md border border-gray-200 object-cover object-top sm:h-50 sm:w-45"
          />
        </div>
      </div>

      <div className="relative flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="pr-8 text-base font-medium text-gray-800 hover:text-indigo-600 sm:text-lg">
              <Link
                href={`/products/${productDetails.slug}${item.variantInfo?._id ? `?variant=${item.variantInfo._id}` : ""}`}
              >
                {item.name}
              </Link>
            </h3>
            <p className="ml-4 text-base font-medium whitespace-nowrap text-gray-900 sm:text-lg">
              {formatCurrency(item.price * quantity)}
            </p>
          </div>

          {item.variantInfo && (
            <p className="mt-1 text-sm text-gray-500">
              {getVariantDisplayNameClient(
                item.variantInfo.options,
                attributeMap,
              )}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Đơn giá: {formatCurrency(item.price)}
          </p>

          {(hasStockError || isOutOfStock) && (
            <div className="mt-3 rounded-md bg-red-100 p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle
                    className="h-5 w-5 text-red-500"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {isOutOfStock
                      ? "Sản phẩm đã hết hàng"
                      : "Sản phẩm không đủ"}
                  </h3>
                  {!isOutOfStock && hasStockError && (
                    <div className="mt-1 text-xs text-red-700">
                      <p>
                        Bạn đang chọn {item.quantity} sản phẩm, nhưng hiện chỉ
                        còn {item.availableStock} sản phẩm. Vui lòng cập nhật số
                        lượng hoặc chọn sản phẩm khác. Xin cảm ơn
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {productDetails.attributes?.length > 0 && (
            <div
              className={classNames(
                "mt-4 grid max-w-md grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2",
                {
                  "pointer-events-none opacity-50":
                    updateCartItemMutation.isPending,
                },
              )}
            >
              {(productDetails.attributes as ProductAttribute[]).map(
                (attrWrapper) => {
                  const attribute = attrWrapper.attribute as Attribute;
                  if (!attribute) return null;
                  const currentSelectedValueId =
                    selectedOptions[attribute._id] || "";

                  return (
                    <div key={attribute._id}>
                      <Listbox
                        value={currentSelectedValueId}
                        onChange={(newValueId) =>
                          handleOptionChange(attribute._id, newValueId)
                        }
                      >
                        <label className="mb-0.5 block text-xs font-medium text-gray-700">
                          {attribute.label}:
                        </label>
                        <div className="relative">
                          <ListboxButton className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-1.5 pr-10 pl-3 text-left text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                            <span className="block truncate">
                              {attributeMap
                                .get(attribute._id)
                                ?.values.get(currentSelectedValueId) ||
                                `Chọn ${attribute.label}`}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <FiChevronDown
                                className="h-4 w-4 text-gray-400"
                                aria-hidden="true"
                              />
                            </span>
                          </ListboxButton>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <ListboxOptions className="ring-opacity-5 absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black focus:outline-none sm:text-sm">
                              {(attrWrapper.values as AttributeValue[]).map(
                                (option) => (
                                  <ListboxOption
                                    key={option._id}
                                    value={option._id}
                                    className={({ focus }) =>
                                      classNames(
                                        focus
                                          ? "bg-indigo-100 text-indigo-700"
                                          : "text-gray-900",
                                        "relative cursor-default py-2 pr-4 pl-8 select-none",
                                      )
                                    }
                                  >
                                    {({ selected }) => (
                                      <>
                                        <span
                                          className={classNames(
                                            selected
                                              ? "font-semibold"
                                              : "font-normal",
                                            "block truncate",
                                          )}
                                        >
                                          {option.value}
                                        </span>
                                        {selected ? (
                                          <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-indigo-600">
                                            <FiCheck
                                              className="h-5 w-5"
                                              aria-hidden="true"
                                            />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </ListboxOption>
                                ),
                              )}
                            </ListboxOptions>
                          </Transition>
                        </div>
                      </Listbox>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between pt-2 sm:pt-0">
          {isOutOfStock ? (
            <div className="flex-grow">
              <p className="text-sm font-semibold text-red-700">Đã hết hàng</p>
            </div>
          ) : (
            <div
              className={classNames(
                "inline-flex items-center overflow-hidden rounded-lg border bg-gray-100 shadow-sm",
                hasStockError
                  ? "border-red-500 ring-2 ring-red-500"
                  : "border-gray-300",
              )}
            >
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1 || updateCartItemMutation.isPending}
                aria-label="Giảm số lượng"
                className="flex items-center justify-center px-3 py-2 transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiMinus className="h-5 w-5 text-gray-600" />
              </button>
              <input
                type="text"
                readOnly
                value={quantity}
                aria-label={`Số lượng của ${item.name}`}
                className={classNames(
                  "w-12 border-x border-x-gray-400 text-center text-base font-medium select-none focus:outline-none",
                  hasStockError ? "text-red-500" : "text-gray-600",
                )}
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={
                  quantity >= item.availableStock ||
                  updateCartItemMutation.isPending
                }
                aria-label="Tăng số lượng"
                className="flex items-center justify-center px-3 py-2 transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiPlus className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleRemoveItem}
            disabled={removeCartItemMutation.isPending}
            className="ml-4 inline-flex items-center p-2 text-sm font-medium text-gray-500 hover:text-red-600 disabled:opacity-50"
          >
            {removeCartItemMutation.isPending &&
            removeCartItemMutation.variables === item._id ? (
              <FiLoader className="h-5 w-5 animate-spin" />
            ) : (
              <FiTrash2 className="h-5 w-5" />
            )}
            <span className="ml-2 hidden sm:inline">Xóa</span>
          </button>
        </div>
      </div>
    </li>
  );
}
