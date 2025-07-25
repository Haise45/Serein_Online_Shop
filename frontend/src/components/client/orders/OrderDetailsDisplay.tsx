"use client";

import ProductReviewModal from "@/components/client/review/ProductReviewModal";
import {
  useCreateReview,
  useDeleteReview,
  useGetUserReviewForProduct,
  useUpdateReview,
} from "@/lib/react-query/reviewQueries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RootState } from "@/store";
import { Order, OrderItem } from "@/types/order_model";
import { Product } from "@/types/product";
import {
  CreateReviewPayload,
  Review,
  UpdateReviewPayload,
} from "@/types/review";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FiBox,
  FiCalendar,
  FiCreditCard,
  FiEdit2,
  FiFileText,
  FiHash,
  FiHome,
  FiLoader,
  FiPhone,
  FiStar,
  FiTag,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import OrderStatusStepper from "./OrderStatusStepper";
import toast from "react-hot-toast"; // Đảm bảo đã import toast
import { FiAlertCircle } from "react-icons/fi";
import { useSettings } from "@/app/SettingsContext";
import { useTranslations } from "next-intl";

interface OrderDetailsDisplayProps {
  order: Order;
  title?: string; // Ví dụ: "Chi tiết đơn hàng" hoặc "Cảm ơn bạn đã đặt hàng!"
}

// Component con cho mỗi item trong đơn hàng, bao gồm cả action review
const OrderItemRow: React.FC<{
  item: OrderItem;
  orderId: string;
  canDisplayReviewActions: boolean;
}> = ({ item, orderId, canDisplayReviewActions }) => {
  const { user: loggedInUser } = useSelector((state: RootState) => state.auth);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const t = useTranslations("OrderItemRow");

  // *** LẤY THÔNG TIN TIỀN TỆ TRONG COMPONENT CON ***
  const { displayCurrency, rates } = useSettings();
  const currencyOptions = { currency: displayCurrency, rates };

  const createReviewMutation = useCreateReview();
  const updateReviewMutation = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();

  // Lấy thông tin sản phẩm gốc một cách an toàn
  const productFromItem =
    item.product && typeof item.product === "object"
      ? (item.product as Product)
      : null;
  const actualProductId =
    typeof item.product === "string"
      ? item.product
      : productFromItem?._id?.toString() || "";
  const productSlug = productFromItem?.slug || "#";

  // Fetch review hiện tại của user cho sản phẩm này (chỉ khi user đã đăng nhập và có productId)
  const { data: existingReview, isLoading: isLoadingExistingReview } =
    useGetUserReviewForProduct(
      actualProductId,
      {
        enabled: canDisplayReviewActions && !!loggedInUser && !!actualProductId,
      }, // Chỉ fetch nếu có thể review và có user
    );

  // Thông tin để truyền vào modal (và để tạo link)
  const productInfoForLinkAndModal = {
    _id: actualProductId,
    name: item.name, // Tên snapshot trong order item
    images: item.image ? [item.image] : productFromItem?.images || [],
    slug: productSlug,
  };

  // Tạo link sản phẩm, bao gồm cả variantId nếu có trong order item
  const productLink = item.variant?.variantId
    ? `/products/${productSlug}?variant=${item.variant.variantId.toString()}`
    : productSlug !== "#"
      ? `/products/${productSlug}`
      : "#";

  const handleSubmitOrUpdateReview = async (
    productId: string,
    payload: CreateReviewPayload | UpdateReviewPayload,
    reviewIdToUpdate?: string,
  ): Promise<{ message: string; review: Review }> => {
    if (reviewIdToUpdate) {
      const result = await updateReviewMutation.mutateAsync({
        reviewId: reviewIdToUpdate,
        payload: payload as UpdateReviewPayload,
      });
      setIsReviewModalOpen(false);
      return result;
    } else {
      const result = await createReviewMutation.mutateAsync({
        productId,
        payload: payload as CreateReviewPayload,
      });
      setIsReviewModalOpen(false);
      return result;
    }
  };

  const handleDeleteReview = () => {
    if (existingReview?._id) {
      toast(
        (toastInstance) => (
          <div className="flex flex-col items-center p-1">
            <p className="mb-3 text-sm font-medium text-gray-800">
              {t("deleteConfirmTitle")}
            </p>
            <div className="flex w-full space-x-3">
              <button
                onClick={() => {
                  deleteReviewMutation.mutate({
                    reviewId: existingReview._id!,
                    productId: actualProductId,
                  });
                  toast.dismiss(toastInstance.id); // Đóng toast xác nhận này
                }}
                className="flex-1 rounded-md bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                {t("deleteConfirmButton")}
              </button>
              <button
                onClick={() => toast.dismiss(toastInstance.id)}
                className="flex-1 rounded-md bg-white px-3.5 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
              >
                {t("cancelButton")}
              </button>
            </div>
          </div>
        ),
        {
          duration: 60000, // Toast tồn tại 60s hoặc cho đến khi người dùng tương tác
          icon: <FiAlertCircle className="h-6 w-6 text-orange-500" />, // Icon cho toast
          position: "top-center",
          // Bạn có thể tùy chỉnh style của toast nếu cần
          // style: {
          //   minWidth: '320px', // Ví dụ: đặt chiều rộng tối thiểu
          // },
        },
      );
    }
  };

  const variantDisplayName = item.variant?.options
    ?.map((opt) => `${opt.attributeName}: ${opt.value}`)
    .join(" / ");

  const isReviewProcessing =
    createReviewMutation.isPending ||
    updateReviewMutation.isPending ||
    deleteReviewMutation.isPending;

  return (
    <li className="flex flex-col py-4 sm:flex-row sm:py-6">
      <div className="mb-3 h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 sm:mr-6 sm:mb-0 sm:h-24 sm:w-24">
        <Image
          src={item.image || "/placeholder-image.jpg"}
          alt={item.name}
          width={96}
          height={96}
          quality={100}
          className="h-full w-full object-cover object-top"
        />
      </div>
      <div className="flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-sm sm:text-base">
            <h3 className="pr-2 font-medium text-gray-800">
              <Link
                href={productLink}
                className="line-clamp-2 hover:text-indigo-600"
              >
                {item.name}
              </Link>
            </h3>
            <p className="ml-4 font-medium whitespace-nowrap text-gray-900">
              {formatCurrency(item.price * item.quantity, currencyOptions)}
            </p>
          </div>
          {variantDisplayName && (
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              {variantDisplayName}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            {t("quantity", { count: item.quantity })}
          </p>
          <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
            {t("unitPrice", {
              price: formatCurrency(item.price, currencyOptions),
            })}
          </p>
        </div>

        {/* Phần Nút Đánh giá / Sửa / Xóa */}
        {canDisplayReviewActions && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            {isLoadingExistingReview ? (
              <div className="flex items-center text-xs text-gray-400">
                <FiLoader className="mr-1 inline h-4 w-4 animate-spin" />{" "}
                {t("checkingReview")}
              </div>
            ) : existingReview ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center text-xs text-green-600 italic">
                  <FiStar className="-mt-0.5 mr-1 inline h-3.5 w-3.5 fill-current text-yellow-400" />
                  {t("alreadyReviewed", { rating: existingReview.rating })}
                  {existingReview.isApproved ? null : (
                    <span className="ml-1 text-orange-500">
                      {t("pendingApproval")}
                    </span>
                  )}
                </span>
                {/* Backend quy định: chỉ sửa được khi chưa có admin reply và review đó chưa từng bị sửa */}
                {!existingReview.adminReply && !existingReview.isEdited && (
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                    disabled={isReviewProcessing}
                    aria-label={t("editReviewAriaLabel", { name: item.name })}
                  >
                    {updateReviewMutation.isPending &&
                    updateReviewMutation.variables?.reviewId ===
                      existingReview._id ? (
                      <FiLoader className="mr-1 inline h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FiEdit2 className="mr-1 h-3.5 w-3.5" />
                    )}
                    {t("editReview")}
                  </button>
                )}
                <button
                  onClick={handleDeleteReview}
                  className="flex items-center text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                  disabled={isReviewProcessing}
                  aria-label={t("deleteReviewAriaLabel", { name: item.name })}
                >
                  {deleteReviewMutation.isPending &&
                  deleteReviewMutation.variables?.reviewId ===
                    existingReview._id ? (
                    <FiLoader className="mr-1 inline h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FiTrash2 className="mr-1 h-3.5 w-3.5" />
                  )}
                  {t("deleteReview")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center rounded-md border border-indigo-600 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 shadow-sm hover:bg-indigo-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none disabled:opacity-50"
                disabled={isReviewProcessing}
                aria-label={t("writeReviewAriaLabel", { name: item.name })}
              >
                {createReviewMutation.isPending ? (
                  <FiLoader className="mr-2 -ml-0.5 h-4 w-4 animate-spin" />
                ) : (
                  <FiStar className="mr-2 -ml-0.5 h-4 w-4" />
                )}
                {t("writeReview")}
              </button>
            )}
          </div>
        )}
      </div>

      {isReviewModalOpen && actualProductId && (
        <ProductReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          product={
            productInfoForLinkAndModal as Pick<
              Product,
              "_id" | "name" | "images" | "slug"
            >
          }
          orderId={orderId}
          existingReview={existingReview}
          onSubmitReview={handleSubmitOrUpdateReview}
          isSubmitting={
            createReviewMutation.isPending || updateReviewMutation.isPending
          }
        />
      )}
    </li>
  );
};

export default function OrderDetailsDisplay({
  order,
  title,
}: OrderDetailsDisplayProps) {
  const { user: loggedInUser } = useSelector((state: RootState) => state.auth); // Lấy user ID từ Redux
  const t = useTranslations("OrderDetailsDisplay");
  const tCheckout = useTranslations("CheckoutForm");

  // *** LẤY THÔNG TIN TIỀN TỆ TRONG COMPONENT CON ***
  const { displayCurrency, rates } = useSettings();
  const currencyOptions = { currency: displayCurrency, rates };

  const itemsSubtotal = order.itemsPrice;
  const discount = order.discountAmount;
  const shipping = order.shippingPrice;
  const total = order.totalPrice;

  const canUserReviewThisOrder = order.status === "Delivered" && !!loggedInUser;

  const paymentMethodLabel =
    tCheckout(`paymentMethods.${order.paymentMethod}.name`) ||
    order.paymentMethod;

  return (
    <div>
      {title && (
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-indigo-600">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {t.rich("orderCodeMessage", {
              code: order._id.toString().slice(-6).toUpperCase(),
              bold: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>
      )}

      <OrderStatusStepper currentStatus={order.status} />

      <div className="mt-8 grid grid-cols-1 items-start gap-6 md:grid-cols-3 lg:gap-8">
        {/* Thông tin giao hàng */}
        <div className="md:col-span-1">
          <h2 className="mb-3 flex items-center border-b border-gray-300 pb-2 text-lg font-semibold text-gray-800 md:text-base lg:text-lg">
            <FiHome className="mr-2 text-indigo-600" />{" "}
            {t("shippingAddressTitle")}
          </h2>
          <div className="space-y-1 text-sm text-gray-600">
            <p className="font-medium text-gray-700">
              {order.shippingAddress.fullName}
            </p>
            <p>{order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.communeName},{" "}
              {order.shippingAddress.districtName},{" "}
              {order.shippingAddress.provinceName}
            </p>
          </div>
        </div>

        {/* Phương thức thanh toán */}
        <div className="md:col-span-1">
          <h2 className="mb-3 flex items-center border-b border-gray-300 pb-2 text-lg font-semibold text-gray-800 md:text-base lg:text-lg">
            <FiCreditCard className="mr-2 text-indigo-600" />{" "}
            {t("paymentTitle")}
          </h2>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              {t.rich("paymentMethod", {
                method: paymentMethodLabel,
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <p>
              {t("paymentStatus")}{" "}
              {order.isPaid ? (
                <span className="font-medium text-green-600">
                  {t("paidStatus", { date: formatDate(order.paidAt) })}
                </span>
              ) : (
                <span className="font-medium text-orange-500">
                  {t("unpaidStatus")}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Thông tin khác */}
        <div className="md:col-span-1">
          <h2 className="mb-3 flex items-center border-b border-gray-300 pb-2 text-lg font-semibold text-gray-800 md:text-base lg:text-lg">
            <FiFileText className="mr-2 text-indigo-600" />{" "}
            {t("orderInfoTitle")}
          </h2>
          <div className="space-y-1 text-sm text-gray-600">
            <p className="flex items-center">
              <FiHash className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
              {t("orderCodeLabel")}{" "}
              <span className="ml-1 font-medium text-gray-700">
                #{order._id.toString().slice(-6).toUpperCase()}
              </span>
            </p>
            <p className="flex items-center">
              <FiCalendar className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
              {t("orderDateLabel")}{" "}
              <span className="ml-1 font-medium text-gray-700">
                {formatDate(order.createdAt)}
              </span>
            </p>
            {order.user && typeof order.user !== "string" && (
              <>
                <p className="flex items-center">
                  <FiUser className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                  {t("customerLabel")}{" "}
                  <span className="ml-1 font-medium text-gray-700">
                    {order.user.name}
                  </span>
                </p>
                <p className="flex items-center">
                  <FiPhone className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                  {t("phoneLabel")}{" "}
                  <span className="ml-1 font-medium text-gray-700">
                    {order.user.phone || "Chưa cập nhật"}
                  </span>
                </p>
              </>
            )}
            {!order.user && order.guestOrderEmail && (
              <p className="flex items-center">
                <FiUser className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                {t("guestEmailLabel")}{" "}
                <span className="ml-1 font-medium text-gray-700">
                  {order.guestOrderEmail}
                </span>
              </p>
            )}
            {order.notes && (
              <p className="mt-2 border-t border-gray-300 pt-2 text-sm">
                {t("notesLabel", { notes: order.notes })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="mt-8 sm:mt-10">
        <h2 className="mb-4 flex items-center border-b border-gray-300 pb-2 text-lg font-semibold text-gray-800">
          <FiBox className="mr-2 text-indigo-600" /> {t("orderedProductsTitle")}
        </h2>
        <ul role="list" className="divide-y divide-gray-300">
          {order.orderItems.map((item) => (
            <OrderItemRow
              key={item._id.toString()}
              item={item}
              orderId={order._id.toString()}
              canDisplayReviewActions={canUserReviewThisOrder}
            />
          ))}
        </ul>
      </div>

      {/* Tóm tắt chi phí */}
      <div className="mt-8 sm:mt-10">
        <div className="rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:p-8">
          <h2 className="sr-only">{t("costSummaryTitle")}</h2>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">{t("subtotal")}</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatCurrency(itemsSubtotal, currencyOptions)}
              </dd>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between">
                <dt className="flex items-center text-sm text-green-600">
                  <FiTag className="mr-1.5 h-4 w-4" />
                  <span>
                    {t("discount", { code: order.appliedCouponCode ?? "" })}
                  </span>
                </dt>
                <dd className="text-sm font-medium text-green-600">
                  -{formatCurrency(discount, currencyOptions)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">{t("shippingFee")}</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shipping > 0 ? formatCurrency(shipping, currencyOptions) : t("shippingFeeFree")}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-300 pt-4">
              <dt className="text-base font-bold text-gray-900">{t("total")}</dt>
              <dd className="text-base font-bold text-gray-900">
                {formatCurrency(total, currencyOptions)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-x-3 gap-y-3">
        <Link
          href="/"
          className="rounded-md bg-indigo-600 px-6 py-3 text-center text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
        >
          {t("continueShopping")}
        </Link>
        {order.user && typeof order.user !== "string" && (
          <Link
            href="/profile/orders"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
          >
            {t("viewMyOrders")}
          </Link>
        )}
      </div>
    </div>
  );
}
