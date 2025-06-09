import ProductDetailSkeleton from "@/components/client/product/ProductDetailSkeleton";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { getProductByIdOrSlug } from "@/services/productService";
import { BreadcrumbItem } from "@/types";
import type { Metadata, ResolvingMetadata } from "next";
import { Suspense } from "react";
import ProductDetailsClient from "./ProductDetailsClient";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generate metadata động
export async function generateMetadata(
  { params }: ProductPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductByIdOrSlug(slug); // Fetch sản phẩm ở server

  if (!product) {
    return {
      title: "Không tìm thấy sản phẩm | Serein Shop",
    };
  }

  // Lấy ảnh đầu tiên cho Open Graph (nếu có)
  const imageUrl = product.images?.[0] || (await parent).openGraph?.images?.[0];

  return {
    title: `${product.name} | Serein Shop`,
    description:
      product.description?.substring(0, 160) ||
      `Mua ${product.name} tại Serein Shop.`, // Lấy mô tả ngắn
    openGraph: {
      title: product.name,
      description:
        product.description?.substring(0, 160) ||
        `Mua ${product.name} tại Serein Shop.`,
      images: imageUrl ? [imageUrl] : [],
      type: "website", // Changed from 'product' to 'website'
      // Alternative: you can also use 'article' if it fits better
      // type: 'article',

      // For product-specific metadata, you can add custom properties
      siteName: "Serein Shop",
      locale: "vi_VN",
    },
    // You can add additional metadata for products using other fields
    keywords: product.name, // Add product name as keywords
    // For structured data (JSON-LD), you might want to add it separately
    other: {
      // Custom meta tags for product
      "product:price:amount": product.price?.toString(),
      "product:price:currency": "VND",
      // Add other product-specific meta tags as needed
    },
  };
}

export default async function ProductDetailPageContainer({
  params,
}: ProductPageProps) {
  const { slug } = await params; // Await params before accessing slug

  // Breadcrumbs có thể cần fetch category nếu muốn hiển thị tên category
  // Tạm thời để đơn giản
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Trang Chủ", href: "/" },
    { label: "Sản Phẩm", href: "/products" },
    // Sẽ cập nhật tên sản phẩm ở client sau khi fetch
    { label: "Chi tiết sản phẩm", isCurrent: true },
  ];

  return (
    <div className="mx-auto px-0 lg:px-10">
      <div className="mb-4 sm:mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailsClient slug={slug} />
      </Suspense>
    </div>
  );
}
