"use client";

import RatingStars from "@/components/shared/RatingStars";
import RelativeTime from "@/components/shared/RelativeTime";
import { getLocalizedName } from "@/lib/utils";
import { Product, Review } from "@/types";
import {
  cilCamera,
  cilCheck,
  cilCommentBubble,
  cilThumbDown,
  cilThumbUp,
  cilTrash,
  cilWarning,
} from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CAvatar,
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTooltip,
} from "@coreui/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

interface ReviewTableProps {
  reviews: Review[];
  onApprove: (reviewId: string) => void;
  onReject: (reviewId: string) => void;
  onDelete: (reviewId: string, author: string) => void;
  onReply: (review: Review) => void;
}

const ReviewTable: React.FC<ReviewTableProps> = ({
  reviews,
  onApprove,
  onReject,
  onDelete,
  onReply,
}) => {
  // Sử dụng locale để định dạng ngày tháng
  const locale = useLocale() as "vi" | "en";
  const t = useTranslations("AdminReviews.table");

  return (
    <CTable hover responsive className="align-middle text-sm">
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell style={{ minWidth: "200px" }}>
            {t("colReviewer")}
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            {t("colRating")}
          </CTableHeaderCell>
          <CTableHeaderCell style={{ minWidth: "250px" }}>
            {t("colComment")}
          </CTableHeaderCell>
          <CTableHeaderCell style={{ minWidth: "200px" }}>
            {t("colProduct")}
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            {t("colStatus")}
          </CTableHeaderCell>
          <CTableHeaderCell
            className="text-center"
            style={{ minWidth: "120px" }}
          >
            {t("colActions")}
          </CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {reviews.map((review) => {
          const product =
            review.product && typeof review.product === "object"
              ? (review.product as Product)
              : null;
          const productImage =
            product?.images && product.images.length > 0
              ? product.images[0]
              : "/placeholder-image.jpg";
          const userImages = review.userImages || [];

          return (
            <CTableRow key={review._id}>
              {/* Người đánh giá */}
              <CTableDataCell>
                <div className="flex items-center">
                  <CAvatar
                    color="secondary"
                    textColor="white"
                    size="md"
                    className="me-3 flex-shrink-0"
                  >
                    {review.user.name.charAt(0).toUpperCase()}
                  </CAvatar>
                  <div className="min-w-0">
                    <div
                      className="truncate font-medium"
                      title={review.user.name}
                    >
                      {review.user.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      <div
                        title={new Date(review.createdAt).toLocaleString(
                          locale,
                        )}
                      >
                        <RelativeTime date={review.createdAt} />
                      </div>
                    </div>
                  </div>
                </div>
              </CTableDataCell>

              {/* Xếp hạng */}
              <CTableDataCell className="text-center">
                <RatingStars rating={review.rating} size="sm" />
              </CTableDataCell>

              {/* Bình luận */}
              <CTableDataCell>
                <p className="line-clamp-3 text-gray-800">
                  {review.comment || (
                    <em className="text-gray-400">{t("noComment")}</em>
                  )}
                </p>

                {userImages.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {userImages.map((imgUrl, index) => (
                      <Link
                        key={index}
                        href={imgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-12 w-12 overflow-hidden rounded-md border border-gray-200 transition-transform hover:scale-105"
                      >
                        <Image
                          src={imgUrl}
                          alt={`User image ${index + 1} for review`}
                          fill
                          sizes="48px"
                          className="object-cover"
                          quality={80}
                        />
                      </Link>
                    ))}
                  </div>
                ) : (
                  // Optional: Hiển thị thông báo nếu không có ảnh
                  <div className="mt-2 flex items-center text-xs text-gray-400">
                    <CIcon icon={cilCamera} className="me-1.5" />
                    <span>{t("noUserImages")}</span>
                  </div>
                )}

                {review.adminReply && (
                  <div className="mt-2 rounded-md border border-gray-200 bg-gray-100 p-2">
                    <p className="text-xs font-semibold text-gray-600">
                      {t("shopReply")}
                    </p>
                    <p className="line-clamp-2 text-xs text-gray-700">
                      &quot;{review.adminReply.comment}&quot;
                    </p>
                  </div>
                )}
              </CTableDataCell>

              {/* Sản phẩm */}
              <CTableDataCell>
                {product ? (
                  product.isActive ? (
                    <Link
                      href={`/admin/products/${product._id}/edit`}
                      target="_blank"
                      className="text-decoration-none flex items-center gap-2"
                    >
                      <Image
                        src={productImage}
                        alt={getLocalizedName(product.name, locale)}
                        width={40}
                        height={40}
                        quality={100}
                        className="rounded border object-cover object-top"
                        style={{ aspectRatio: "1/1" }}
                      />
                      <span className="min-w-0 truncate font-medium text-gray-800 hover:text-indigo-600">
                        {getLocalizedName(product.name, locale)}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <CIcon
                        icon={cilWarning}
                        className="me-2 text-yellow-500"
                      />
                      <span className="text-xs line-through">
                        {getLocalizedName(product.name, locale)} (
                        {t("inactive")})
                      </span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center text-gray-400">
                    <CIcon icon={cilWarning} className="me-2 text-orange-400" />
                    <span className="text-xs">{t("deletedProduct")}</span>
                  </div>
                )}
              </CTableDataCell>

              {/* Trạng thái */}
              <CTableDataCell className="text-center">
                {review.isApproved ? (
                  <CTooltip content={t("tooltipApproved")}>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <CIcon icon={cilCheck} />
                    </span>
                  </CTooltip>
                ) : (
                  <CTooltip content={t("tooltipPending")}>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
                      <CIcon icon={cilWarning} />
                    </span>
                  </CTooltip>
                )}
              </CTableDataCell>

              {/* Hành động */}
              <CTableDataCell className="text-center">
                <div className="flex justify-center gap-1">
                  {review.isApproved ? (
                    <CTooltip content={t("actionHide")}>
                      <CButton
                        color="warning"
                        variant="outline"
                        size="sm"
                        className="p-2"
                        onClick={() => onReject(review._id)}
                      >
                        <CIcon icon={cilThumbDown} />
                      </CButton>
                    </CTooltip>
                  ) : (
                    <CTooltip content={t("actionApprove")}>
                      <CButton
                        color="success"
                        variant="outline"
                        size="sm"
                        className="p-2"
                        onClick={() => onApprove(review._id)}
                      >
                        <CIcon icon={cilThumbUp} />
                      </CButton>
                    </CTooltip>
                  )}
                  <CTooltip
                    content={
                      review.adminReply
                        ? t("actionEditReply")
                        : t("actionAddReply")
                    }
                  >
                    <CButton
                      color="info"
                      variant="outline"
                      size="sm"
                      className="p-2"
                      onClick={() => onReply(review)}
                    >
                      <CIcon icon={cilCommentBubble} />
                    </CButton>
                  </CTooltip>
                  <CTooltip content={t("actionDelete")}>
                    <CButton
                      color="danger"
                      variant="outline"
                      size="sm"
                      className="p-2"
                      onClick={() => onDelete(review._id, review.user.name)}
                    >
                      <CIcon icon={cilTrash} />
                    </CButton>
                  </CTooltip>
                </div>
              </CTableDataCell>
            </CTableRow>
          );
        })}
      </CTableBody>
    </CTable>
  );
};

export default ReviewTable;
