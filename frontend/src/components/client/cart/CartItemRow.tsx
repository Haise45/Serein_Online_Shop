"use client";

import {
  useGetCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/lib/react-query/cartQueries";
import { useGetProductDetails } from "@/lib/react-query/productQueries";
import { formatCurrency } from "@/lib/utils";
import { CartItem as CartItemType } from "@/types/cart";
import { ProductAttribute } from "@/types/product";
import { Listbox, Transition } from "@headlessui/react";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
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

interface CartItemRowProps {
  item: CartItemType;
  isSelected: boolean;
  onSelectItem: (itemId: string, isSelected: boolean) => void;
}

export default function CartItemRow({
  item,
  isSelected,
  onSelectItem,
}: CartItemRowProps) {
  const queryClient = useQueryClient();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const { data: currentCart } = useGetCart(); // Lấy giỏ hàng hiện tại từ cache
  const [quantity, setQuantity] = useState(item.quantity);
  // selectedOptions sẽ lưu trữ giá trị (value) của option được chọn cho mỗi thuộc tính
  const [selectedOptions, setSelectedOptions] = useState<{
    [attributeName: string]: string;
  }>({});
  const [isUpdating, setIsUpdating] = useState(false); // Chung cho cả quantity và variant change

  const productIdOrSlug =
    typeof item.productId === "string" ? item.productId : item.productId._id;

  const {
    data: productDetails,
    isLoading: isLoadingProduct,
    isError: productFetchError,
    error: productErrorData,
    refetch: refetchProduct,
  } = useGetProductDetails(productIdOrSlug, { enabled: !!productIdOrSlug });

  // Khởi tạo selectedOptions và quantity khi item prop thay đổi
  useEffect(() => {
    const initialOptions: { [attributeName: string]: string } = {};
    if (item.variantInfo?.options) {
      item.variantInfo.options.forEach((opt) => {
        initialOptions[opt.attributeName] = opt.value;
      });
    } else if (
      productDetails?.attributes?.length &&
      productDetails.variants?.length === 1 &&
      !item.variantInfo
    ) {
      const singleVariant = productDetails.variants[0];
      if (singleVariant?.optionValues) {
        singleVariant.optionValues.forEach((ov) => {
          initialOptions[ov.attributeName] = ov.value;
        });
      }
    }
    setSelectedOptions(initialOptions);
    setQuantity(item.quantity); // Cập nhật quantity từ item prop
  }, [item.variantInfo, item.quantity, productDetails]);

  const handleQuantityChange = (newQuantity: number) => {
    if (isUpdating) return;
    if (newQuantity >= 1 && newQuantity <= item.availableStock) {
      setIsUpdating(true);
      updateCartItemMutation.mutate(
        {
          itemId: item._id,
          payload: { quantity: newQuantity }, // Chỉ gửi quantity
        },
        {
          onSuccess: (updatedCart) => {
            queryClient.setQueryData(["cart"], updatedCart); // Cập nhật cache ngay
          },
          onError: (error: Error) => {
            const axiosError = error as AxiosError<{ message: string }>;
            const message =
              axiosError.response?.data?.message || "Lỗi cập nhật số lượng.";
            toast.error(message);
          },
          onSettled: () => {
            setIsUpdating(false);
          },
        },
      );
    } else if (newQuantity > item.availableStock) {
      toast.error(`Chỉ còn ${item.availableStock} sản phẩm tồn kho.`);
    }
  };

  const handleRemoveItem = () => {
    if (isUpdating) return;
    // Không cần setIsUpdating ở đây vì item sẽ bị xóa khỏi UI
    removeCartItemMutation.mutate(item._id);
  };

  const handleOptionChange = async (
    attributeName: string,
    newValue: string,
  ) => {
    if (isUpdating || !productDetails || !currentCart) return;

    const newSelectedOptionsAttempt = {
      ...selectedOptions,
      [attributeName]: newValue,
    };

    // Cập nhật UI tạm thời cho selectedOptions
    setSelectedOptions(newSelectedOptionsAttempt);

    const allAttributesSelected = productDetails.attributes?.every(
      (attr) => newSelectedOptionsAttempt[attr.name] !== undefined,
    );

    if (
      allAttributesSelected &&
      productDetails.variants &&
      productDetails.attributes
    ) {
      const newVariant = productDetails.variants.find(
        (variant) =>
          variant.optionValues.length === productDetails.attributes.length &&
          variant.optionValues.every(
            (ov) => newSelectedOptionsAttempt[ov.attributeName] === ov.value,
          ),
      );

      if (newVariant && newVariant._id !== item.variantInfo?._id) {
        // ---- BẮT ĐẦU LOGIC KIỂM TRA VÀ GỘP ----
        const existingItemToMergeWith = currentCart.items.find(
          (cartItem) =>
            cartItem._id !== item._id && // Phải là một item khác
            (typeof cartItem.productId === "string"
              ? cartItem.productId
              : cartItem.productId._id.toString()) === productIdOrSlug &&
            cartItem.variantInfo?._id === newVariant._id,
        );
        setIsUpdating(true);
        if (existingItemToMergeWith) {
          // Trường hợp: Tìm thấy item khác trong giỏ hàng giống hệt variant mới -> Gộp
          try {
            // 1. Cập nhật số lượng của item đã tồn tại
            await updateCartItemMutation.mutateAsync({
              itemId: existingItemToMergeWith._id,
              payload: {
                quantity: existingItemToMergeWith.quantity + quantity, // Cộng dồn số lượng
              },
            });
            // 2. Xóa item hiện tại (item vừa được người dùng thay đổi variant)
            await removeCartItemMutation.mutateAsync(item._id);

            toast.success("Sản phẩm đã được gộp và cập nhật số lượng.");
            queryClient.invalidateQueries({ queryKey: ["cart"] });
          } catch (error: unknown) {
            const axiosError = error as AxiosError<{ message: string }>;
            toast.error(
              axiosError?.response?.data?.message || "Lỗi khi gộp sản phẩm.",
            );
            // Rollback selectedOptions nếu gộp lỗi
            const oldOptions: { [attributeName: string]: string } = {};
            item.variantInfo?.options.forEach((opt) => {
              oldOptions[opt.attributeName] = opt.value;
            });
            setSelectedOptions(oldOptions);
          } finally {
            setIsUpdating(false);
          }
        } else {
          // Trường hợp: Không tìm thấy item nào để gộp -> Chỉ cập nhật variant cho item hiện tại
          updateCartItemMutation.mutate(
            {
              itemId: item._id,
              payload: {
                newVariantId: newVariant._id,
                quantity: quantity, // Gửi số lượng hiện tại
              },
            },
            {
              onSuccess: (updatedCart) => {
                queryClient.setQueryData(["cart"], updatedCart);
              },
              onError: (error: Error) => {
                const axiosError = error as AxiosError<{ message: string }>;
                toast.error(
                  axiosError?.response?.data?.message ||
                    "Lỗi khi cập nhật phiên bản.",
                );

                // Rollback selectedOptions về giá trị cũ của item hiện tại
                const oldOptions: { [attributeName: string]: string } = {};
                item.variantInfo?.options.forEach((opt) => {
                  oldOptions[opt.attributeName] = opt.value;
                });
                setSelectedOptions(oldOptions);
              },
              onSettled: () => {
                setIsUpdating(false);
              },
            },
          );
        }
        // ---- KẾT THÚC LOGIC KIỂM TRA VÀ GỘP ----
      } else if (newVariant && newVariant._id === item.variantInfo?._id) {
        // Người dùng chọn lại chính variant đó, không làm gì hoặc chỉ cập nhật selectedOptions
        setSelectedOptions(newSelectedOptionsAttempt);
      } else if (!newVariant) {
        // Đã chọn đủ options nhưng không tìm thấy variant -> không hợp lệ
        toast.error(`Phiên bản với lựa chọn này không tồn tại.`);
        // Rollback selectedOptions về giá trị cũ của item hiện tại
        const oldOptions: { [attributeName: string]: string } = {};
        item.variantInfo?.options.forEach((opt) => {
          oldOptions[opt.attributeName] = opt.value;
        });
        setSelectedOptions(oldOptions);
      }
    }
    // Nếu chưa chọn đủ attributes, selectedOptions đã được cập nhật ở trên, chờ người dùng chọn tiếp
  };

  const getAttributeOptions = (attributeName: string): string[] => {
    if (!productDetails?.attributes || !productDetails.variants) return [];
    const attribute = productDetails.attributes.find(
      (attr) => attr.name === attributeName,
    );
    if (!attribute) return [];

    const possibleValues = new Set<string>();
    productDetails.variants.forEach((variant) => {
      let matchesOtherSelected = true;
      for (const attrKey in selectedOptions) {
        if (attrKey !== attributeName && selectedOptions[attrKey]) {
          const variantOptionForAttrKey = variant.optionValues.find(
            (ov) => ov.attributeName === attrKey,
          );
          if (
            !variantOptionForAttrKey ||
            variantOptionForAttrKey.value !== selectedOptions[attrKey]
          ) {
            matchesOtherSelected = false;
            break;
          }
        }
      }
      if (matchesOtherSelected) {
        const optionForCurrentAttr = variant.optionValues.find(
          (ov) => ov.attributeName === attributeName,
        );
        if (optionForCurrentAttr) {
          possibleValues.add(optionForCurrentAttr.value);
        }
      }
    });
    return Array.from(possibleValues).sort();
  };

  const imageUrl = item.image || "/placeholder-image.jpg";
  const currentItemStock = item.availableStock;

  if (isLoadingProduct) {
    return (
      <li className="flex animate-pulse flex-col px-4 py-6 sm:flex-row sm:px-6">
        <div className="h-32 w-32 flex-shrink-0 rounded-md bg-gray-300 sm:mr-6 sm:h-40 sm:w-40"></div>
        <div className="mt-4 flex-1 sm:mt-0">
          <div className="h-6 w-3/4 rounded bg-gray-300"></div>
          <div className="mt-2 h-4 w-1/2 rounded bg-gray-300"></div>
          <div className="mt-1 h-4 w-1/3 rounded bg-gray-300"></div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="h-10 rounded bg-gray-300"></div>
            <div className="h-10 rounded bg-gray-300"></div>
          </div>
          <div className="mt-4 flex justify-between">
            <div className="h-10 w-28 rounded bg-gray-300"></div>
            <div className="h-10 w-20 rounded bg-gray-300"></div>
          </div>
        </div>
      </li>
    );
  }

  if (productFetchError || !productDetails) {
    // Xử lý cả trường hợp productDetails là null
    return (
      <li className="flex items-center px-4 py-6 text-sm sm:px-6">
        <FiAlertCircle className="mr-2 h-5 w-5 flex-shrink-0 text-red-500" />
        <div className="flex-grow">
          <p className="font-medium text-red-600">
            Lỗi tải thông tin cho sản phẩm &quot;{item.name}&quot;
          </p>
          <p className="text-xs text-gray-500">
            {productErrorData?.message || "Không tìm thấy chi tiết sản phẩm."}
          </p>
        </div>
        {productFetchError && (
          <button
            onClick={() => refetchProduct()}
            className="ml-4 text-xs whitespace-nowrap text-indigo-600 hover:underline"
          >
            Thử lại
          </button>
        )}
      </li>
    );
  }
  // Từ đây, productDetails chắc chắn là một object Product

  return (
    <li
      className={classNames("flex flex-col px-4 py-6 sm:flex-row sm:px-6", {
        "bg-indigo-50/50": isSelected,
      })}
    >
      <div className="flex flex-shrink-0 flex-row justify-between">
        {/* Checkbox để chọn item */}
        <div className="order-2 flex-shrink-0 self-start pr-4 sm:pr-6 md:order-1 md:self-center">
          <input
            id={`cart-item-${item._id}`}
            type="checkbox"
            className="h-5 w-5 rounded-md border-gray-300 text-indigo-600"
            checked={isSelected}
            onChange={(e) => onSelectItem(item._id, e.target.checked)}
            aria-label={`Chọn sản phẩm ${item.name}`}
          />
        </div>

        <div className="order-1 mb-4 flex-shrink-0 sm:mr-6 sm:mb-0 md:order-2">
          <Image
            src={imageUrl}
            alt={item.name}
            width={160}
            height={160}
            className="h-32 w-32 rounded-md border border-gray-200 object-cover object-center sm:h-40 sm:w-40"
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

          {Object.keys(selectedOptions).length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {productDetails.attributes
                ?.map((attr) =>
                  selectedOptions[attr.name]
                    ? `${attr.name}: ${selectedOptions[attr.name]}`
                    : null,
                )
                .filter(Boolean)
                .join(" / ")}
            </p>
          )}

          <p className="mt-1 text-sm text-gray-500">
            Đơn giá: {formatCurrency(item.price)}
          </p>

          {productDetails.attributes &&
            productDetails.attributes.length > 0 && (
              <div
                className={classNames(
                  "mt-4 grid max-w-md grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2",
                  { "opacity-50": isUpdating },
                )}
              >
                {productDetails.attributes.map((attr: ProductAttribute) => {
                  // Thêm type cho attr
                  const currentAttributeOptions = getAttributeOptions(
                    attr.name,
                  );
                  const currentSelectedValue = selectedOptions[attr.name] || "";

                  return (
                    <div key={attr.name}>
                      <Listbox
                        value={currentSelectedValue}
                        onChange={(newValue) =>
                          handleOptionChange(attr.name, newValue)
                        }
                        disabled={isUpdating} // Chỉ disabled khi đang đổi variant
                      >
                        {({ open }) => (
                          <div>
                            <Listbox.Label className="mb-0.5 block text-xs font-medium text-gray-700">
                              {attr.name}:
                            </Listbox.Label>
                            <div className="relative">
                              <Listbox.Button
                                className={classNames(
                                  "relative w-full cursor-default rounded-md border border-gray-300 bg-white py-1.5 pr-10 pl-3 text-left text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none",
                                  {
                                    "cursor-wait bg-gray-100": isUpdating,
                                  }, // Dùng cursor-wait
                                )}
                              >
                                <span className="block truncate">
                                  {currentSelectedValue || `Chọn ${attr.name}`}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                  <FiChevronDown
                                    className={`h-4 w-4 transform text-gray-400 transition-transform duration-150 ${open ? "-rotate-180" : "rotate-0"}`}
                                    aria-hidden="true"
                                  />
                                </span>
                              </Listbox.Button>
                              <Transition
                                show={open}
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="ring-opacity-5 absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black focus:outline-none sm:text-sm">
                                  {currentAttributeOptions.length > 0 ? (
                                    currentAttributeOptions.map(
                                      (optionValue) => (
                                        <Listbox.Option
                                          key={optionValue}
                                          className={({ active }) =>
                                            classNames(
                                              active
                                                ? "bg-indigo-100 text-indigo-700"
                                                : "text-gray-900",
                                              "relative cursor-default py-2 pr-4 pl-8 select-none",
                                            )
                                          }
                                          value={optionValue} // value của Listbox.Option là string
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
                                                {optionValue}
                                              </span>
                                              {selected ? (
                                                <span
                                                  className={classNames(
                                                    "text-indigo-600",
                                                    "absolute inset-y-0 left-0 flex items-center pl-1.5",
                                                  )}
                                                >
                                                  <FiCheck
                                                    className="h-5 w-5"
                                                    aria-hidden="true"
                                                  />
                                                </span>
                                              ) : null}
                                            </>
                                          )}
                                        </Listbox.Option>
                                      ),
                                    )
                                  ) : (
                                    <div className="relative cursor-default px-4 py-2 text-xs text-gray-500 select-none">
                                      Không có lựa chọn.
                                    </div>
                                  )}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </div>
                        )}
                      </Listbox>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        <div className="mt-4 flex items-center justify-between pt-2 sm:pt-0">
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300 shadow-sm">
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={
                quantity <= 1 || updateCartItemMutation.isPending || isUpdating
              }
              aria-label="Giảm số lượng"
              className="flex items-center justify-center bg-white px-3 py-2 transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiMinus className="h-5 w-5 text-gray-600" />
            </button>

            <input
              type="text"
              readOnly
              value={quantity}
              aria-label={`Số lượng của ${item.name}`}
              className="w-12 border-x border-gray-200 bg-white text-center text-base font-medium text-gray-800 select-none focus:outline-none"
            />

            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={
                quantity >= currentItemStock ||
                updateCartItemMutation.isPending ||
                isUpdating
              }
              aria-label="Tăng số lượng"
              className="flex items-center justify-center bg-white px-3 py-2 transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiPlus className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleRemoveItem}
            disabled={removeCartItemMutation.isPending || isUpdating}
            className="ml-4 inline-flex items-center p-2 text-sm font-medium text-gray-500 hover:text-red-600 disabled:opacity-50"
          >
            {(removeCartItemMutation.isPending &&
              removeCartItemMutation.variables === item._id) ||
            isUpdating ? (
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
