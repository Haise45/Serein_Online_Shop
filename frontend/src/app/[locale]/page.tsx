"use client";
import FeatureBar from "@/components/client/layout/FeatureBar";
import FooterClient from "@/components/client/layout/FooterClient";
import HeroBanner from "@/components/client/layout/HeroBanner";
import NavbarClient from "@/components/client/layout/NavbarClient";
import ProductList from "@/components/client/product/ProductList";
import { useGetAttributes } from "@/lib/react-query/attributeQueries";
import { useGetProducts } from "@/lib/react-query/productQueries";
import { Link } from "@/i18n/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useSettings } from "../SettingsContext";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const { settings } = useSettings();

  // Lấy giá trị từ settings hoặc dùng giá trị mặc định nếu settings chưa được tải
  const maxNewest = settings?.landingPage?.maxNewestProducts || 8;
  const maxFeatured = settings?.landingPage?.maxFeaturedProducts || 8;

  // Fetch sản phẩm mới nhất bằng React Query
  const {
    data: newProductsData,
    isLoading: isLoadingNew,
    isError: isErrorNew,
    error: errorNewObject, // Đây là đối tượng Error từ React Query
  } = useGetProducts(
    { limit: maxNewest, sortBy: "createdAt", sortOrder: "desc" },
    // { enabled: true } // Mặc định là true, không cần thiết trừ khi muốn disable ban đầu
  );

  // Fetch sản phẩm bán chạy bằng React Query
  const {
    data: popularProductsData,
    isLoading: isLoadingPopular,
    isError: isErrorPopular,
    error: errorPopularObject,
  } = useGetProducts({
    limit: maxFeatured,
    sortBy: "totalSold",
    sortOrder: "desc",
  });

  // Fetch tất cả thuộc tính
  const { data: attributes, isLoading: isLoadingAttributes } =
    useGetAttributes();

  // Xử lý hiển thị toast lỗi bằng useEffect
  useEffect(() => {
    if (isErrorNew && errorNewObject) {
      toast.error(errorNewObject.message || t("errorNewToast"));
    }
  }, [isErrorNew, errorNewObject, t]);

  useEffect(() => {
    if (isErrorPopular && errorPopularObject) {
      toast.error(errorPopularObject.message || t("errorPopularToast"));
    }
  }, [isErrorPopular, errorPopularObject, t]);

  // Lấy danh sách sản phẩm từ data của React Query
  const newProducts = newProductsData?.products || [];
  const popularProducts = popularProductsData?.products || [];

  return (
    <>
      <NavbarClient />
      <HeroBanner />
      <FeatureBar />
      <main className="bg-gray-100">
        <section className="container mx-auto min-h-screen flex-grow px-4 py-8 sm:px-6 lg:px-8">
          <ProductList
            title={t("newestProductsTitle")}
            products={newProducts}
            loading={isLoadingNew || isLoadingAttributes}
            attributes={attributes || []}
            error={
              isErrorNew ? errorNewObject?.message || t("errorNewToast") : null
            }
          />

          <ProductList
            title={t("popularProductsTitle")}
            products={popularProducts}
            loading={isLoadingPopular || isLoadingAttributes}
            attributes={attributes || []}
            error={
              isErrorPopular
                ? errorPopularObject?.message || t("errorPopularToast")
                : null
            }
          />

          <div className="py-12 text-center">
            <Link
              href="/products"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-lg font-bold text-white shadow-md transition duration-300 hover:bg-indigo-700 hover:shadow-lg"
            >
              {t("viewAllButton")}
            </Link>
          </div>
        </section>
      </main>
      <FooterClient />
    </>
  );
}
