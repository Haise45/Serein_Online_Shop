"use client";
import FeatureBar from "@/components/client/layout/FeatureBar";
import FooterClient from "@/components/client/layout/FooterClient";
import HeroBanner from "@/components/client/layout/HeroBanner";
import NavbarClient from "@/components/client/layout/NavbarClient";
import ProductList from "@/components/client/product/ProductList";
import { useGetProducts } from "@/lib/react-query/productQueries";
import Link from "next/link";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function HomePage() {
  // Fetch sản phẩm mới nhất bằng React Query
  const {
    data: newProductsData,
    isLoading: isLoadingNew,
    isError: isErrorNew,
    error: errorNewObject, // Đây là đối tượng Error từ React Query
  } = useGetProducts(
    { limit: 10, sortBy: "createdAt", sortOrder: "desc" },
    // { enabled: true } // Mặc định là true, không cần thiết trừ khi muốn disable ban đầu
  );

  // Fetch sản phẩm bán chạy bằng React Query
  const {
    data: popularProductsData,
    isLoading: isLoadingPopular,
    isError: isErrorPopular,
    error: errorPopularObject,
  } = useGetProducts({ limit: 10, sortBy: "totalSold", sortOrder: "desc" });

  // Xử lý hiển thị toast lỗi bằng useEffect
  useEffect(() => {
    if (isErrorNew && errorNewObject) {
      toast.error(errorNewObject.message || "Lỗi tải sản phẩm mới.");
      console.error("Lỗi fetch sản phẩm mới (React Query):", errorNewObject);
    }
  }, [isErrorNew, errorNewObject]);

  useEffect(() => {
    if (isErrorPopular && errorPopularObject) {
      toast.error(errorPopularObject.message || "Lỗi tải sản phẩm phổ biến.");
      console.error(
        "Lỗi fetch sản phẩm phổ biến (React Query):",
        errorPopularObject,
      );
    }
  }, [isErrorPopular, errorPopularObject]);

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
            title="Sản Phẩm Mới Nhất"
            products={newProducts}
            loading={isLoadingNew}
            error={
              isErrorNew
                ? errorNewObject?.message || "Lỗi tải sản phẩm mới."
                : null
            }
          />

          <ProductList
            title="Sản Phẩm Bán Chạy"
            products={popularProducts}
            loading={isLoadingPopular}
            error={
              isErrorPopular
                ? errorPopularObject?.message || "Lỗi tải sản phẩm phổ biến."
                : null
            }
          />

          <div className="py-12 text-center">
            <Link
              href="/products"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-lg font-bold text-white shadow-md transition duration-300 hover:bg-indigo-700 hover:shadow-lg"
            >
              Xem Tất Cả Sản Phẩm
            </Link>
          </div>
        </section>
      </main>
      <FooterClient />
    </>
  );
}
