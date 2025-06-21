"use client";

import RatingStars from "@/components/shared/RatingStars";
import { timeAgo } from "@/lib/utils";
import { Product, Review } from "@/types";
import {
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
import Image from "next/image";
import Link from "next/link";

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
  return (
    <CTable hover responsive className="align-middle text-sm">
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell style={{ minWidth: "200px" }}>
            Người đánh giá
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">Xếp hạng</CTableHeaderCell>
          <CTableHeaderCell style={{ minWidth: "250px" }}>
            Bình luận
          </CTableHeaderCell>
          <CTableHeaderCell style={{ minWidth: "200px" }}>
            Sản phẩm
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            Trạng thái
          </CTableHeaderCell>
          <CTableHeaderCell
            className="text-center"
            style={{ minWidth: "120px" }}
          >
            Hành động
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
                      {timeAgo(review.createdAt)}
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
                    <em className="text-gray-400">Không có bình luận</em>
                  )}
                </p>
                {review.adminReply && (
                  <div className="mt-2 rounded-md border border-gray-200 bg-gray-100 p-2">
                    <p className="text-xs font-semibold text-gray-600">
                      Phản hồi của shop:
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
                  <Link
                    href={`/admin/products/${product._id}/edit`}
                    target="_blank"
                    className="text-decoration-none flex items-center gap-2"
                  >
                    <Image
                      src={productImage}
                      alt={product.name}
                      width={40}
                      height={40}
                      quality={100}
                      className="rounded border object-cover object-top"
                      style={{ aspectRatio: "1/1" }}
                    />
                    <span className="min-w-0 truncate font-medium text-gray-800 hover:text-indigo-600">
                      {product.name}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <CIcon icon={cilWarning} className="me-2 text-orange-400" />
                    <span className="text-xs">Sản phẩm đã bị xóa</span>
                  </div>
                )}
              </CTableDataCell>

              {/* Trạng thái */}
              <CTableDataCell className="text-center">
                {review.isApproved ? (
                  <CTooltip content="Đã duyệt">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <CIcon icon={cilCheck} />
                    </span>
                  </CTooltip>
                ) : (
                  <CTooltip content="Chờ duyệt">
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
                    <CTooltip content="Ẩn đánh giá">
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
                    <CTooltip content="Duyệt đánh giá">
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
                      review.adminReply ? "Sửa phản hồi" : "Thêm phản hồi"
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
                  <CTooltip content="Xóa vĩnh viễn">
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
