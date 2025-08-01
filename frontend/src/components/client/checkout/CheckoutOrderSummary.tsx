"use client";

import { formatCurrency, getVariantDisplayNameClient } from "@/lib/utils";
import { ExchangeRates, VariantOptionValue } from "@/types";
import { CartItem as CartItemType } from "@/types/cart";
import { Coupon } from "@/types/coupon";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { FiInfo, FiLoader, FiShoppingCart, FiTag } from "react-icons/fi";

interface CheckoutOrderSummaryProps {
  items: CartItemType[]; // Chỉ các items được chọn để checkout
  subtotal: number; // Subtotal của các items được chọn
  discount: number; // Discount đã tính cho các items được chọn
  appliedCouponFull?: Coupon | null; // Thông tin coupon đầy đủ nếu có
  shippingFee: number; // Mặc định là 0
  finalTotal: number; // Final total của các items được chọn sau khi áp dụng discount và shipping
  isPlacingOrder: boolean; // Trạng thái khi đang gọi API tạo đơn hàng
  onPlaceOrderTriggerFromSummary: () => void; // Hàm để trigger submit form ở CheckoutForm
  attributeMap: Map<string, { label: string; values: Map<string, string> }>;
  stockErrorObject: { name: string; stock: number } | null;
  paymentMethod: string;
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
}

export default function CheckoutOrderSummary({
  items,
  subtotal,
  discount,
  appliedCouponFull,
  shippingFee,
  finalTotal,
  isPlacingOrder,
  onPlaceOrderTriggerFromSummary,
  attributeMap,
  stockErrorObject,
  paymentMethod,
  displayCurrency,
  rates,
}: CheckoutOrderSummaryProps) {
  const tSummary = useTranslations("CheckoutOrderSummary");
  const tCheckoutPage = useTranslations("CheckoutPage");

  const numberOfItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const currencyOptions = { currency: displayCurrency, rates };
  const isButtonDisabled =
    isPlacingOrder || items.length === 0 || !!stockErrorObject;

  return (
    <aside
      className={classNames(
        "sticky top-20 rounded-lg bg-white p-6 shadow-lg ring-1 ring-gray-200/50",
        "scrollbar-thin max-h-[calc(100vh-5rem)] overflow-y-auto lg:col-span-5 xl:col-span-4",
      )}
    >
      <h2
        id="summary-heading"
        className="mb-4 border-b border-gray-200 pb-4 text-xl font-semibold text-gray-900"
      >
        {tSummary("title")}
      </h2>

      {items.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <FiShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p>{tSummary("noItemSelected")}</p>
          <Link
            href="/cart"
            className="mt-2 inline-block font-medium text-indigo-600 hover:text-indigo-500"
          >
            {tSummary("backToCartLink")}
          </Link>
        </div>
      ) : (
        <>
          <ul
            role="list"
            className="scrollbar-thin max-h-80 divide-y divide-gray-200 overflow-y-auto pr-1"
          >
            {items.map((item) => {
              const variantDisplayName = item.variantInfo
                ? getVariantDisplayNameClient(
                    item.variantInfo.options as VariantOptionValue[],
                    attributeMap,
                  )
                : null;

              return (
                <li key={item._id} className="flex py-4">
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
                        <h3 className="pr-2">
                          <Link
                            href={`/products/${item.slug}${item.variantInfo?._id ? `?variant=${item.variantInfo._id}` : ""}`}
                            className="line-clamp-2 hover:text-indigo-600"
                          >
                            {item.name}
                          </Link>
                        </h3>
                        <p className="ml-4 whitespace-nowrap">
                          {formatCurrency(
                            item.price * item.quantity,
                            currencyOptions,
                          )}
                        </p>
                      </div>
                      {variantDisplayName && (
                        <p className="mt-1 text-xs text-gray-500">
                          {variantDisplayName}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-gray-500">
                        {tSummary("productQuantity", {
                          quantity: item.quantity,
                          price: formatCurrency(item.price, currencyOptions),
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 space-y-3 border-t border-gray-200 pt-6">
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">
                  {tSummary("subtotalLabel", { count: numberOfItems })}
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatCurrency(subtotal, currencyOptions)}
                </dd>
              </div>

              {appliedCouponFull && discount > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center text-sm text-green-600">
                    <FiTag className="mr-1.5 h-4 w-4" />
                    <span>{tSummary("discountLabel", { code: appliedCouponFull.code })}</span>
                  </dt>
                  <dd className="text-sm font-medium text-green-600">
                    -{formatCurrency(discount, currencyOptions)}
                  </dd>
                </div>
              )}

              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">{tSummary("shippingFeeLabel")}</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {shippingFee > 0
                    ? formatCurrency(shippingFee, currencyOptions)
                    : tSummary("shippingFeeFree")}
                </dd>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-base font-semibold text-gray-900">
                  {tSummary("totalLabel")}
                </dt>
                <dd className="text-base font-semibold text-gray-900">
                  {formatCurrency(finalTotal + shippingFee, currencyOptions)}
                </dd>
              </div>
            </dl>

            {appliedCouponFull && discount === 0 && (
              <div className="flex items-center rounded-md bg-yellow-50 p-2 text-xs text-yellow-600">
                <FiInfo className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>
                  {tSummary("couponNotApplicable", { code: appliedCouponFull.code })}
                </span>
              </div>
            )}
          </div>

          {stockErrorObject && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {tCheckoutPage("stockErrorToast", {
                name: stockErrorObject.name,
                stock: stockErrorObject.stock,
              })}{" "}
              {tSummary("stockError")}
            </div>
          )}

          {paymentMethod !== "PAYPAL" && (
            <div className="mt-8">
              <button
                type="button" // Để không submit form cha nếu có
                onClick={onPlaceOrderTriggerFromSummary}
                disabled={isButtonDisabled}
                className={classNames(
                  "flex w-full items-center justify-center rounded-md border border-transparent px-6 py-3 text-base font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none",
                  items.length === 0
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
                  { "cursor-wait opacity-70": isPlacingOrder },
                )}
              >
                {isPlacingOrder && (
                  <FiLoader className="mr-3 -ml-1 h-5 w-5 animate-spin text-white" />
                )}
                {isPlacingOrder
                  ? tSummary("processingButton")
                  : tSummary("placeOrderButton", { count: numberOfItems })}
              </button>
            </div>
          )}
          <div className="mt-4 text-center">
            <Link
              href="/cart"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {tSummary("continueShoppingLink")}
              <span aria-hidden="true">{tSummary("continueShoppingArrow")}</span>
            </Link>
          </div>
        </>
      )}
    </aside>
  );
}
