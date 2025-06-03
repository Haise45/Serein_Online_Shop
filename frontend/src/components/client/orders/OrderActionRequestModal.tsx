"use client";

import { useUploadImages } from "@/lib/react-query/uploadQueries";
import { OrderRequestPayload } from "@/types/order";
import {
  Dialog,
  Transition,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
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
import { FiCamera, FiLoader, FiX } from "react-icons/fi";

interface OrderActionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  actionType: "cancellation" | "refund";
  onSubmitRequest: (
    orderId: string,
    payload: OrderRequestPayload,
  ) => Promise<unknown>; // Hàm mutation
  isSubmittingRequest: boolean;
}

const MAX_IMAGES = 20;
const MAX_FILE_SIZE_MB = 10;

export default function OrderActionRequestModal({
  isOpen,
  onClose,
  orderId,
  actionType,
  onSubmitRequest,
  isSubmittingRequest,
}: OrderActionRequestModalProps) {
  const [reason, setReason] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]); // Mảng các đối tượng File
  const [imagePreviews, setImagePreviews] = useState<string[]>([]); // Mảng các URL preview (tạo bằng URL.createObjectURL)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImagesMutation = useUploadImages(); // Hook để upload ảnh qua backend

  const modalTitleText =
    actionType === "cancellation"
      ? "Yêu cầu hủy đơn hàng"
      : "Yêu cầu trả hàng/hoàn tiền";
  const reasonLabel =
    actionType === "cancellation"
      ? "Lý do hủy đơn"
      : "Lý do trả hàng/hoàn tiền";
  const submitButtonText =
    actionType === "cancellation" ? "Gửi yêu cầu hủy" : "Gửi yêu cầu trả hàng";

  const isProcessing = isSubmittingRequest || uploadImagesMutation.isPending; // Trạng thái loading chung

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const currentTotalFiles = imageFiles.length;
      const filesToAdd: File[] = [];
      const previewsToAdd: string[] = [];

      for (const file of files) {
        if (filesToAdd.length + currentTotalFiles >= MAX_IMAGES) {
          toast.error(`Bạn chỉ có thể tải lên tối đa ${MAX_IMAGES} hình ảnh.`);
          break; // Dừng nếu đã đủ số lượng tối đa
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

  const removeImage = (indexToRemove: number) => {
    // Thu hồi Object URL trước khi xóa khỏi state
    URL.revokeObjectURL(imagePreviews[indexToRemove]);
    const newFiles = imageFiles.filter((_, index) => index !== indexToRemove);
    const newPreviews = imagePreviews.filter(
      (_, index) => index !== indexToRemove,
    );
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do.");
      return;
    }
    if (isProcessing) return;

    let uploadedImageUrls: string[] = [];
    try {
      if (imageFiles.length > 0) {
        const uploadData = await uploadImagesMutation.mutateAsync({
          files: imageFiles,
          area: "order_requests",
        });
        uploadedImageUrls = uploadData.imageUrls; // Lấy mảng URL từ response
      }

      const payload: OrderRequestPayload = {
        reason: reason.trim(),
        imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
      };

      await onSubmitRequest(orderId, payload); // Gọi hàm submit chính (từ UserOrdersClient)
    } catch (error) {
      console.error(`Lỗi trong quá trình gửi yêu cầu ${actionType}:`, error);
    }
  };

  // Reset form state khi modal đóng hoặc mở (dựa trên isOpen)
  useEffect(() => {
    if (!isOpen) {
      setReason("");
      // Thu hồi tất cả Object URL hiện tại trước khi clear
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setImageFiles([]);
      setImagePreviews([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Cleanup object URLs khi component unmount
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
        {/* Backdrop Transition */}
        <Transition
          as={Fragment}
          show={isOpen}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Panel Transition */}
            <Transition
              as={Fragment}
              show={isOpen}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="flex items-center justify-between text-lg leading-6 font-semibold text-gray-900"
                >
                  {modalTitleText}
                  <button
                    onClick={() => !isProcessing && onClose()}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                    disabled={isProcessing}
                    title="Đóng cửa sổ"
                  >
                    <FiX />
                  </button>
                </DialogTitle>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor={`reason-${actionType}`}
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      {reasonLabel} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id={`reason-${actionType}`}
                      name="reason"
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="input-field w-full resize-none"
                      placeholder="Mô tả chi tiết lý do của bạn..."
                      required
                      disabled={isProcessing}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Hình ảnh thực tế (Tối đa {MAX_IMAGES} ảnh)
                    </label>
                    <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6 transition-colors hover:border-indigo-500">
                      <div className="space-y-1 text-center">
                        <FiCamera className="mx-auto h-10 w-10 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label
                            htmlFor={`file-upload-${actionType}`}
                            className={classNames(
                              "relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:outline-none hover:text-indigo-500",
                              {
                                "cursor-not-allowed opacity-50":
                                  isProcessing ||
                                  imageFiles.length >= MAX_IMAGES,
                              },
                            )}
                          >
                            <span>Tải ảnh lên</span>
                            <input
                              id={`file-upload-${actionType}`}
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              multiple
                              accept="image/*"
                              onChange={handleImageChange}
                              ref={fileInputRef}
                              disabled={
                                isProcessing || imageFiles.length >= MAX_IMAGES
                              }
                            />
                          </label>
                          <p className="pl-1">hoặc kéo thả</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, WEBP (Tối đa {MAX_FILE_SIZE_MB}MB/ảnh)
                        </p>
                      </div>
                    </div>
                    {imagePreviews.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                        {imagePreviews.map((previewUrl, index) => (
                          <div
                            key={`${previewUrl}-${index}`} // Tạo key duy nhất hơn
                            className="group relative aspect-square"
                          >
                            <Image
                              src={previewUrl}
                              alt={`Preview ${index + 1}`}
                              fill
                              sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                              className="rounded-md object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              disabled={isProcessing}
                              className="absolute top-0.5 right-0.5 z-10 rounded-full bg-red-600 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-700 focus:opacity-100 disabled:cursor-not-allowed disabled:bg-gray-300"
                              aria-label="Xóa ảnh"
                            >
                              <FiX className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {imageFiles.length < MAX_IMAGES && (
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
                    )}
                  </div>

                  <div className="mt-6 flex flex-shrink-0 justify-end space-x-3 border-t border-gray-200 px-4 pt-4 sm:px-0">
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
              </DialogPanel>
            </Transition>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
