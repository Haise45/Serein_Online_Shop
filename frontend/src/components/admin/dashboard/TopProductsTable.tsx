"use client";

import { TopSellingProduct } from "@/types";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from "@coreui/react";
import Image from "next/image";
import Link from "next/link";
import RatingStars from "@/components/shared/RatingStars";

interface TopProductsTableProps {
  data: TopSellingProduct[] | undefined;
  isLoading: boolean;
}

const TopProductsTable: React.FC<TopProductsTableProps> = ({
  data,
  isLoading,
}) => {
  return (
    <CCard className="shadow-sm">
      <CCardHeader>Top 10 sản phẩm bán chạy</CCardHeader>
      <CCardBody className="p-0">
        {isLoading ? (
          <div className="p-10 text-center">
            <CSpinner />
          </div>
        ) : (
          <CTable hover responsive className="mb-0 align-middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Sản phẩm</CTableHeaderCell>
                <CTableHeaderCell className="text-center">
                  Đã bán
                </CTableHeaderCell>
                <CTableHeaderCell className="text-center">
                  Đánh giá
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {data?.map((product) => (
                <CTableRow key={product.productId}>
                  <CTableDataCell>
                    <Link
                      href={`/admin/products/${product.productId}/edit`}
                      className="flex items-center gap-3 text-decoration-none"
                    >
                      <Image
                        src={product.image || "/placeholder-image.jpg"}
                        alt={product.name}
                        width={40}
                        height={40}
                        quality={100}
                        className="aspect-square rounded object-cover object-top"
                      />
                      <span className="text-decoration-none font-medium text-gray-800 hover:text-indigo-600">
                        {product.name}
                      </span>
                    </Link>
                  </CTableDataCell>
                  <CTableDataCell className="fw-semibold text-center">
                    {product.totalSold}
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    <RatingStars rating={product.averageRating} size="sm" />
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  );
};

export default TopProductsTable;
