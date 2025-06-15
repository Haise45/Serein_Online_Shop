"use client";
import CustomSpinner from "@/components/shared/CustomSpinner";
import {
  useGetCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/lib/react-query/cartQueries";
import { getVariantDisplayName } from "@/lib/utils";
import { CartItem } from "@/types/cart";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import {
  FiAlertTriangle,
  FiMinus,
  FiPlus,
  FiRefreshCw,
  FiShoppingCart,
  FiTrash2,
  FiX,
} from "react-icons/fi";

const formatCurrency = (amount: number | undefined) => {
  if (typeof amount !== "number" || isNaN(amount)) return "N/A";
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

interface CartPreviewModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  attributeMap: Map<string, { label: string; values: Map<string, string> }>;
}

export default function CartPreviewModal({
  isOpen,
  setIsOpen,
  attributeMap,
}: CartPreviewModalProps) {
  const { data: cartData, isLoading, isError, error, refetch } = useGetCart();
  const removeCartItemMutation = useRemoveCartItem();
  const updateCartItemMutation = useUpdateCartItem();

  const closeModal = () => setIsOpen(false);

  const handleRemoveItem = (itemId: string) => {
    removeCartItemMutation.mutate(itemId);
  };

  const handleQuantityChange = (
    itemId: string,
    currentQuantity: number,
    change: number,
  ) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity >= 1) {
      updateCartItemMutation.mutate({
        itemId,
        payload: { quantity: newQuantity },
      });
    } else if (newQuantity < 1) {
      handleRemoveItem(itemId);
    }
  };

  const handleRetryFetchCart = () => {
    if (refetch) {
      refetch();
    }
  };

  let content;
  if (isLoading) {
    content = (
      <div className="flex min-h-[200px] items-center justify-center">
        <CustomSpinner size="lg" />
      </div>
    );
  } else if (isError && error) {
    content = (
      <div className="flex min-h-[250px] flex-col items-center justify-center px-4 py-10 text-center">
        <FiAlertTriangle className="mb-4 h-12 w-12 text-red-400" />
        <h3 className="text-base font-semibold text-gray-800">
          Lỗi tải giỏ hàng
        </h3>
        <p className="mt-1 text-sm text-red-600">
          Đã có lỗi xảy ra khi tải thông tin giỏ hàng của bạn.
        </p>
        {error.message && (
          <p className="mt-1 text-xs text-gray-500">
            Chi tiết: {error.message}
          </p>
        )}
        <button
          onClick={handleRetryFetchCart}
          disabled={isLoading}
          className="mt-6 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          <FiRefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Thử lại
        </button>
      </div>
    );
  } else if (!cartData || !cartData.items || cartData.items.length === 0) {
    content = (
      <div className="flex min-h-[300px] flex-col items-center justify-center px-4 py-10 text-center">
        <FiShoppingCart className="h-20 w-20 text-gray-300" />
        <p className="mt-6 text-base font-medium text-gray-700">
          Giỏ hàng của bạn trống
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Thêm sản phẩm vào giỏ để mua sắm nhé!
        </p>
        <button
          onClick={closeModal}
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Tiếp tục mua sắm
        </button>
      </div>
    );
  } else {
    content = (
      <>
        {/* Danh sách sản phẩm */}
        <div className="flow-root">
          <ul role="list" className="-my-4 divide-y divide-gray-200 px-1">
            {cartData.items.map((item: CartItem) => {
              const variantDisplayName = item.variantInfo
                ? getVariantDisplayName(item.variantInfo.options, attributeMap)
                : null;

              return (
                <li key={item._id} className="flex py-4 last:mb-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <Image
                      src={item.image || "/placeholder-image.jpg"}
                      alt={item.name}
                      width={80}
                      height={80}
                      quality={100}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>

                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-sm font-medium text-gray-900">
                        <h3>
                          <Link
                            href={`/products/${item.slug}`}
                            onClick={closeModal}
                            className="hover:text-indigo-600"
                          >
                            {item.name}
                          </Link>
                        </h3>
                        <p className="ml-4 whitespace-nowrap">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      {variantDisplayName && (
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {variantDisplayName}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex flex-1 items-end justify-between text-sm">
                      <div className="inline-flex items-center overflow-hidden rounded-md border border-gray-300">
                        <button
                          onClick={() =>
                            handleQuantityChange(item._id, item.quantity, -1)
                          }
                          disabled={
                            item.quantity <= 1 ||
                            (updateCartItemMutation.isPending &&
                              updateCartItemMutation.variables?.itemId ===
                                item._id)
                          }
                          aria-label={`Giảm số lượng sản phẩm ${item.name}`}
                          className="flex items-center justify-center bg-white px-2 py-1 transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-40"
                        >
                          <FiMinus className="h-4 w-4 text-gray-600" />
                        </button>

                        <input
                          type="text"
                          readOnly
                          value={item.quantity}
                          aria-label={`Số lượng hiện tại của ${item.name}`}
                          title={`Số lượng ${item.name}`}
                          className="w-10 border-x border-gray-200 bg-white text-center text-sm font-medium text-gray-800 select-none focus:outline-none"
                        />

                        <button
                          onClick={() =>
                            handleQuantityChange(item._id, item.quantity, 1)
                          }
                          disabled={
                            (updateCartItemMutation.isPending &&
                              updateCartItemMutation.variables?.itemId ===
                                item._id) ||
                            item.quantity >= item.availableStock
                          }
                          aria-label={`Tăng số lượng sản phẩm ${item.name}`}
                          className="flex items-center justify-center bg-white px-2 py-1 transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-40"
                        >
                          <FiPlus className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      <div className="flex">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item._id)}
                          disabled={
                            removeCartItemMutation.isPending &&
                            removeCartItemMutation.variables === item._id
                          }
                          className="p-1.5 font-medium text-gray-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                          title={`Xóa ${item.name} khỏi giỏ hàng`}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {/* Hiển thị tổng tiền của item này (nếu muốn) */}
                    <p className="mt-1 text-right text-xs font-medium text-indigo-600">
                      Tổng: {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Phần tổng kết và buttons */}
        <div className="border-t border-gray-200 px-1 py-6">
          <div className="flex justify-between text-sm font-medium text-gray-900">
            <p>Tạm tính ({cartData.totalQuantity} sản phẩm)</p>
            <p>{formatCurrency(cartData.subtotal)}</p>
          </div>
          {cartData.appliedCoupon && cartData.discountAmount > 0 && (
            <div className="mt-1.5 flex justify-between text-xs text-green-600">
              <p>
                Giảm giá (
                <span className="font-semibold">
                  {cartData.appliedCoupon.code}
                </span>
                )
              </p>
              <p>−{formatCurrency(cartData.discountAmount)}</p>
            </div>
          )}
          <div className="mt-3 flex justify-between text-base font-semibold text-indigo-700">
            <p>Tổng cộng</p>
            <p>{formatCurrency(cartData.finalTotal)}</p>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Phí vận chuyển sẽ được tính ở bước thanh toán.
          </p>
          <div className="mt-6 space-y-3">
            <Link
              href="/cart"
              onClick={closeModal}
              className="flex w-full items-center justify-center rounded-lg border border-indigo-600 bg-indigo-50 px-6 py-3 text-sm font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Xem chi tiết giỏ hàng
            </Link>
            <Link
              href="/checkout"
              onClick={closeModal}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Tiến hành thanh toán
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-60" onClose={closeModal}>
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full sm:pl-10">
              <TransitionChild
                enter="transform transition ease-in-out duration-300 sm:duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300 sm:duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto w-screen max-w-md">
                  {/* Nội dung Modal */}
                  <div className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-scroll">
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-5 sm:px-6">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-semibold text-white">
                            Giỏ hàng của bạn
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative rounded-md p-1 text-indigo-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                              onClick={closeModal}
                              aria-label="Đóng giỏ hàng"
                            >
                              <FiX className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        {/* Có thể thêm thông tin số lượng item ở đây */}
                        {cartData && cartData.totalQuantity > 0 && (
                          <p className="mt-1 text-sm text-indigo-200">
                            Hiện có {cartData.totalQuantity} sản phẩm.
                          </p>
                        )}
                      </div>
                      {/* Phần nội dung chính (danh sách item,...) */}
                      <div className="relative flex-1 px-4 py-5 sm:px-6">
                        {content}
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
