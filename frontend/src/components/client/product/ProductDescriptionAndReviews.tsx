"use client";

import RatingStars from "@/components/shared/RatingStars";
import { useGetProductReviews } from "@/lib/react-query/reviewQueries";
import { sanitizeHtmlContent } from "@/lib/utils";
import { Product } from "@/types/product";
import { GetProductReviewsParams, Review } from "@/types/review";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import classNames from "classnames";
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  FiChevronDown,
  FiFileText,
  FiLoader,
  FiMessageCircle,
} from "react-icons/fi";
import ReviewFilters from "./ReviewFilters";
import ReviewItem from "./ReviewItem";
import "@/app/globals.css";
import { useTranslations } from "next-intl";

interface ProductDescriptionAndReviewsProps {
  product: Product; // Truyền thông tin sản phẩm vào
}

// Định nghĩa kiểu cho ref handle để cha có thể sử dụng (type-safe)
export interface ProductReviewsRef {
  focusReviewsTab: () => void;
}

const REVIEWS_PER_PAGE = 5; // Số lượng review tải mỗi lần "Xem thêm"

const ProductDescriptionAndReviews = forwardRef<
  ProductReviewsRef,
  ProductDescriptionAndReviewsProps
>(({ product }, ref) => {
  const t = useTranslations("ProductDetailsPage");
  const [selectedTab, setSelectedTab] = useState(0); // 0: Mô tả, 1: Đánh giá
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Tạo một ref cho thẻ div gốc của component để cuộn tới
  const componentRootRef = useRef<HTMLDivElement>(null);

  // --- Logic cho Tab Đánh giá ---
  const [reviewFilters, setReviewFilters] = useState<GetProductReviewsParams>({
    page: 1,
    limit: REVIEWS_PER_PAGE,
  });

  // Sử dụng useGetProductReviews để lấy danh sách review
  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    isFetching: isFetchingReviews, // Để biết khi nào đang fetch thêm
    isError: isErrorReviews,
  } = useGetProductReviews(product._id, reviewFilters, {
    placeholderData: (previousData) => previousData,
  });

  // Gom tất cả các review đã tải vào một mảng
  const [allLoadedReviews, setAllLoadedReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (reviewsData?.reviews) {
      if (reviewFilters.page === 1) {
        // Nếu là trang đầu tiên (sau khi đổi filter hoặc load lần đầu)
        setAllLoadedReviews(reviewsData.reviews);
      } else {
        // Nếu là trang tiếp theo (nhấn "Xem thêm")
        // Chỉ thêm những review chưa có trong allLoadedReviews để tránh trùng lặp
        setAllLoadedReviews((prevReviews) => {
          const newReviews = reviewsData.reviews.filter(
            (nr) => !prevReviews.some((pr) => pr._id === nr._id),
          );
          return [...prevReviews, ...newReviews];
        });
      }
    }
  }, [reviewsData, reviewFilters.page]);

  const handleFilterChange = useCallback(
    (newFilters: GetProductReviewsParams) => {
      // Khi filter thay đổi, luôn reset về page 1
      setReviewFilters({ ...newFilters, page: 1, limit: REVIEWS_PER_PAGE });
      // allLoadedReviews sẽ được reset trong useEffect ở trên
    },
    [],
  );

  const handleLoadMoreReviews = () => {
    if (reviewsData && reviewsData.currentPage < reviewsData.totalPages) {
      setReviewFilters((prevFilters) => ({
        ...prevFilters,
        page: (prevFilters.page || 1) + 1,
      }));
    }
  };

  const tabs = [
    { name: t("description.title"), icon: FiFileText },
    {
      name: t("reviews.title", { count: product.numReviews || 0 }),
      icon: FiMessageCircle,
    },
  ];

  const descriptionContainerRef = useRef<HTMLDivElement>(null);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] =
    useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (descriptionContainerRef.current) {
        // Client-side check
        setIsDescriptionOverflowing(
          descriptionContainerRef.current.scrollHeight >
            descriptionContainerRef.current.clientHeight,
        );
      }
    };
    // Check sau khi mount và khi nội dung description thay đổi
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [product.description]);

  // Sử dụng useImperativeHandle để "lộ" ra hàm cho cha gọi
  useImperativeHandle(ref, () => ({
    focusReviewsTab: () => {
      // 1. Chuyển sang tab Đánh giá
      setSelectedTab(1); // Index của tab Đánh giá là 1

      // 2. Cuộn mượt mà tới component
      if (componentRootRef.current) {
        componentRootRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start", // Căn lề trên cùng của component với trên cùng của viewport
        });
      }
    },
  }));

  return (
    <div
      ref={componentRootRef}
      id="reviews-section"
      className="mt-12 rounded-xl bg-white p-4 shadow-2xl sm:p-6 md:p-8 lg:mt-16"
    >
      <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab}>
        <TabList className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  "-mb-px flex items-center border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap focus:outline-none",
                  selected
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                )
              }
            >
              {({ selected }) => (
                <>
                  <tab.icon
                    className={classNames(
                      "mr-2 h-5 w-5",
                      selected
                        ? "text-indigo-500"
                        : "text-gray-400 group-hover:text-gray-500",
                    )}
                    aria-hidden="true"
                  />
                  {tab.name}
                </>
              )}
            </Tab>
          ))}
        </TabList>
        <TabPanels as={Fragment}>
          {/* Panel Mô tả sản phẩm */}
          <TabPanel className="py-8">
            <h2 className="sr-only">{t("description.title")}</h2>
            <div className="relative">
              <div
                ref={descriptionContainerRef}
                className={classNames(
                  "prose prose-sm sm:prose-base relative max-w-none overflow-hidden text-gray-700",
                  !showFullDescription ? "max-h-[400px]" : "",
                )}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtmlContent(
                    product.description ||
                      `<p>${t("description.noDescription")}</p>`,
                  ),
                }}
              />
              {(isDescriptionOverflowing ||
                (!isDescriptionOverflowing && showFullDescription)) && (
                <div
                  className={classNames(
                    "pt-4 text-center",
                    !showFullDescription && isDescriptionOverflowing
                      ? "absolute right-0 bottom-0 left-0 bg-gradient-to-t from-white via-white/80 to-transparent pt-12 pb-6"
                      : "",
                  )}
                >
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none"
                  >
                    {showFullDescription
                      ? t("description.collapse")
                      : t("description.readMore")}
                    <FiChevronDown
                      className={classNames(
                        "ml-2 h-4 w-4 transition-transform",
                        showFullDescription ? "rotate-180" : "",
                      )}
                    />
                  </button>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Panel Đánh giá người dùng */}
          <TabPanel className="py-8">
            <h2 className="sr-only">
              {t("reviews.title", { count: product.numReviews })}
            </h2>
            {product.numReviews > 0 && (
              <div className="mb-6 flex flex-col items-center gap-y-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {product.averageRating?.toFixed(1) || "0.0"}
                    <span className="text-base font-normal text-gray-500">
                      /5
                    </span>
                  </p>
                  <div className="ml-3">
                    <RatingStars
                      rating={product.averageRating || 0}
                      size="lg"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {t("reviews.basedOn", { count: product.numReviews })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <ReviewFilters
              currentFilters={reviewFilters}
              onFilterChange={handleFilterChange}
            />
            {isLoadingReviews && reviewFilters.page === 1 && (
              <div className="py-10 text-center">
                <FiLoader className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
                <p className="mt-2 text-sm text-gray-500">
                  {t("reviews.loading")}
                </p>
              </div>
            )}
            {isErrorReviews && (
              <div className="py-10 text-center text-red-500">
                {t("reviews.loadingError")}
              </div>
            )}

            {!isLoadingReviews && allLoadedReviews.length === 0 && (
              <div className="py-10 text-center text-gray-500">
                {t("reviews.noReviews")}
                {Object.values(reviewFilters).some(
                  (val) =>
                    val !== undefined && val !== REVIEWS_PER_PAGE && val !== 1,
                ) && <span> {t("reviews.noReviewsWithFilter")} </span>}
                .
              </div>
            )}

            {allLoadedReviews.length > 0 && (
              <div>
                {allLoadedReviews.map((review) => (
                  <ReviewItem key={review._id} review={review} />
                ))}
              </div>
            )}

            {/* Nút Xem thêm đánh giá */}
            {reviewsData &&
              reviewsData.currentPage < reviewsData.totalPages && (
                <div className="mt-8 text-center">
                  <button
                    onClick={handleLoadMoreReviews}
                    disabled={isFetchingReviews}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none disabled:opacity-70"
                  >
                    {isFetchingReviews ? (
                      <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FiChevronDown className="mr-2 h-4 w-4" />
                    )}
                    {t("reviews.loadMore")}
                  </button>
                </div>
              )}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
});

ProductDescriptionAndReviews.displayName = "ProductDescriptionAndReviews";

export default ProductDescriptionAndReviews;
