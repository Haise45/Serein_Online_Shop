"use client";

import { useUploadImages } from "@/lib/react-query/uploadQueries";
import { Product } from "@/types/product";
import {
  CreateReviewPayload,
  Review,
  UpdateReviewPayload,
} from "@/types/review";
import { Dialog, Transition } from "@headlessui/react";
import classNames from "classnames";
import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  Fragment,
  useEffect,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { FiCamera, FiLoader, FiStar, FiX } from "react-icons/fi";

interface ProductReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Pick<Product, "_id" | "name" | "images" | "slug">;
  orderId: string; // Chỉ cần thiết khi tạo mới review
  existingReview?: Review | null;
  onSubmitReview: (
    productId: string,
    payload: CreateReviewPayload | UpdateReviewPayload,
    reviewId?: string,
  ) => Promise<{ message: string; review: Review }>;
  isSubmitting: boolean;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 10;

export default function ProductReviewModal({
  isOpen,
  onClose,
  product,
  orderId,
  existingReview,
  onSubmitReview,
  isSubmitting,
}: ProductReviewModalProps) {
  const isEditMode = !!existingReview;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImagesMutation = useUploadImages();
  const isProcessing = isSubmitting || uploadImagesMutation.isPending;

  const modalTitle = isEditMode
    ? `Chỉnh sửa đánh giá cho ${product.name}`
    : `Đánh giá sản phẩm: ${product.name}`;
  const submitButtonText = isEditMode ? "Lưu thay đổi" : "Gửi đánh giá";

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && existingReview) {
        setRating(existingReview.rating);
        setComment(existingReview.comment || "");
        setExistingImageUrls(existingReview.userImages || []);
        setImageFiles([]);
        setImagePreviews([]);
      } else {
        setRating(0);
        setHoverRating(0);
        setComment("");
        setImageFiles([]);
        setImagePreviews([]);
        setExistingImageUrls([]);
      }
    }
  }, [isOpen, isEditMode, existingReview]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const currentTotalImages = existingImageUrls.length + imageFiles.length;
      const filesToAdd: File[] = [];
      const previewsToAdd: string[] = [];

      for (const file of files) {
        if (filesToAdd.length + currentTotalImages >= MAX_IMAGES) {
          toast.error(`Bạn chỉ có thể tải lên tối đa ${MAX_IMAGES} hình ảnh.`);
          break;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast.error(
            `Kích thước ảnh "${file.name}" quá lớn (Tối đa ${MAX_FILE_SIZE_MB}MB).`,
          );
          continue;
        }
        if (!file.type.startsWith("image/")) {
          toast.error(`Tệp "${file.name}" không phải là hình ảnh.`);
          continue;
        }
        filesToAdd.push(file);
        previewsToAdd.push(URL.createObjectURL(file));
      }
      setImageFiles((prev) => [...prev, ...filesToAdd]);
      setImagePreviews((prev) => [...prev, ...previewsToAdd]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewImage = (indexToRemove: number) => {
    URL.revokeObjectURL(imagePreviews[indexToRemove]);
    setImageFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const removeExistingImage = (urlToRemove: string) => {
    setExistingImageUrls((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá.");
      return;
    }
    if (isProcessing) return;

    let newUploadedImageUrls: string[] = [];
    try {
      if (imageFiles.length > 0) {
        const uploadData = await uploadImagesMutation.mutateAsync({
          files: imageFiles,
          area: "product_reviews",
        });
        newUploadedImageUrls = uploadData.imageUrls;
      }

      const finalImageUrls = [...existingImageUrls, ...newUploadedImageUrls];

      if (isEditMode && existingReview) {
        const payload: UpdateReviewPayload = {
          rating,
          comment: comment.trim() || undefined,
          userImages: finalImageUrls.length > 0 ? finalImageUrls : [], // Gửi mảng rỗng nếu không có ảnh
        };
        // Chỉ submit nếu có thay đổi thực sự
        const hasRatingChanged = existingReview.rating !== payload.rating;
        const hasCommentChanged =
          (existingReview.comment || "") !== (payload.comment || "");
        const hasImagesChanged =
          JSON.stringify(existingReview.userImages || []) !==
          JSON.stringify(payload.userImages || []);

        if (!hasRatingChanged && !hasCommentChanged && !hasImagesChanged) {
          toast("Không có thay đổi nào để lưu.");
          onClose();
          return;
        }
        await onSubmitReview(
          product._id.toString(),
          payload,
          existingReview._id,
        );
      } else {
        const payload: CreateReviewPayload = {
          rating,
          comment: comment.trim() || undefined,
          orderId, // Chỉ cần orderId khi tạo mới
          userImages: finalImageUrls.length > 0 ? finalImageUrls : undefined,
        };
        await onSubmitReview(product._id.toString(), payload);
      }
      onClose(); // Đóng modal sau khi submit thành công (hook đã toast và invalidate)
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá trong modal:", error);
      // Toast lỗi đã được xử lý bởi hook mutation tương ứng
    }
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => !isProcessing && onClose()}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="flex items-center justify-between text-lg leading-6 font-semibold text-gray-900"
                >
                  {modalTitle}
                  <button
                    onClick={() => !isProcessing && onClose()}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                    disabled={isProcessing}
                    aria-label="Đóng"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4 space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Đánh giá của bạn <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onMouseEnter={() =>
                            !isProcessing && setHoverRating(star)
                          }
                          onMouseLeave={() =>
                            !isProcessing && setHoverRating(0)
                          }
                          onClick={() => !isProcessing && setRating(star)}
                          className="rounded-full p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-1"
                          disabled={isProcessing}
                          aria-label={`Đánh giá ${star} sao`}
                        >
                          <FiStar
                            className={classNames(
                              "h-7 w-7 transition-colors duration-150 sm:h-8 sm:w-8",
                              (hoverRating || rating) >= star
                                ? "fill-current text-yellow-400"
                                : "text-gray-300 hover:text-yellow-300",
                            )}
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-3 text-sm font-semibold text-yellow-500">
                          {rating}/5 sao
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`review-comment-${product._id}`}
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Nội dung đánh giá{" "}
                      <span className="text-xs text-gray-500">(Tùy chọn)</span>
                    </label>
                    <textarea
                      id={`review-comment-${product._id}`}
                      name="comment"
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="input-field w-full"
                      placeholder="Chia sẻ cảm nhận chi tiết của bạn về sản phẩm này..."
                      disabled={isProcessing}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Hình ảnh thực tế (Tối đa {MAX_IMAGES} ảnh)
                    </label>
                    <div className="mt-1">
                      <div className="flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6 transition-colors duration-150 hover:border-indigo-400">
                        <div className="space-y-1 text-center">
                          <FiCamera className="mx-auto h-10 w-10 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor={`review-file-upload-${product._id}`}
                              className={classNames(
                                "relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:outline-none hover:text-indigo-500",
                                {
                                  "cursor-not-allowed opacity-50":
                                    isProcessing ||
                                    existingImageUrls.length +
                                      imageFiles.length >=
                                      MAX_IMAGES,
                                },
                              )}
                            >
                              <span>Tải ảnh lên</span>
                              <input
                                id={`review-file-upload-${product._id}`}
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                multiple
                                accept="image/png, image/jpeg, image/gif, image/webp"
                                onChange={handleImageChange}
                                ref={fileInputRef}
                                disabled={
                                  isProcessing ||
                                  existingImageUrls.length +
                                    imageFiles.length >=
                                    MAX_IMAGES
                                }
                              />
                            </label>
                            <p className="pl-1">hoặc kéo thả</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            Hỗ trợ: PNG, JPG, GIF, WEBP
                          </p>
                        </div>
                      </div>
                    </div>
                    {(existingImageUrls.length > 0 ||
                      imagePreviews.length > 0) && (
                      <div className="mt-4">
                        <p className="mb-1.5 text-xs font-medium text-gray-600">
                          Ảnh đã chọn (
                          {existingImageUrls.length + imageFiles.length}/
                          {MAX_IMAGES}):
                        </p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                          {existingImageUrls.map((url) => (
                            <div
                              key={url}
                              className="group relative aspect-square"
                            >
                              <Image
                                src={url}
                                alt="Ảnh đánh giá đã tải lên"
                                fill
                                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                                className="rounded-md border border-gray-200 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(url)}
                                disabled={isProcessing}
                                className="absolute top-1 right-1 rounded-full bg-red-600 p-0.5 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-red-700 focus:opacity-100 disabled:bg-gray-300"
                                aria-label="Xóa ảnh hiện tại"
                              >
                                <FiX className="h-3 w-3" />{" "}
                              </button>
                            </div>
                          ))}
                          {imagePreviews.map((previewUrl, index) => (
                            <div
                              key={previewUrl}
                              className="group relative aspect-square"
                            >
                              <Image
                                src={previewUrl}
                                alt={`Xem trước ảnh mới ${index + 1}`}
                                fill
                                className="rounded-md border border-gray-200 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeNewImage(index)}
                                disabled={isProcessing}
                                className="absolute top-1 right-1 rounded-full bg-red-600 p-0.5 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-red-700 focus:opacity-100 disabled:bg-gray-300"
                                aria-label="Xóa ảnh mới chọn"
                              >
                                {" "}
                                <FiX className="h-3 w-3" />{" "}
                              </button>
                            </div>
                          ))}
                          {imagePreviews.length < MAX_IMAGES && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isProcessing}
                              className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-indigo-500 hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label="Thêm ảnh"
                            >
                              <FiCamera className="h-6 w-6" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col-reverse space-y-2 space-y-reverse sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => !isProcessing && onClose()}
                      className={classNames(
                        "rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none",
                        {
                          "cursor-not-allowed opacity-70": isProcessing,
                        },
                      )}
                      disabled={isProcessing}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className={classNames(
                        "inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none",
                        "min-w-[140px]",
                        {
                          "cursor-not-allowed bg-indigo-400 hover:bg-indigo-400":
                            isProcessing,
                        },
                      )}
                      disabled={isProcessing}
                    >
                      {isProcessing && (
                        <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isProcessing ? "Đang xử lý" : submitButtonText}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
