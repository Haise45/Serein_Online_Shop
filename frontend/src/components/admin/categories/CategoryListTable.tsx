import { getLocalizedName } from "@/lib/utils";
import { useLocale } from "next-intl";
import { Category } from "@/types";
import { cilPen, cilTrash } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { CButton } from "@coreui/react";
import Image from "next/image";
import React from "react";
import { useTranslations } from "next-intl";

interface CategoryListTableProps {
  categories: Category[]; // Nhận một mảng danh mục phẳng
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

const CategoryListTable: React.FC<CategoryListTableProps> = ({
  categories,
  onEdit,
  onDelete,
}) => {
  const t = useTranslations("AdminCategories.list");
  const locale = useLocale() as "vi" | "en";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-700">
        <thead className="bg-gray-100/70 text-xs text-gray-800 uppercase">
          <tr>
            <th scope="col" className="w-2/5 px-4 py-3">
              {t("colCategoryName")}
            </th>
            <th scope="col" className="w-1/5 px-4 py-3">
              {t("colParentCategory")}
            </th>
            <th scope="col" className="px-4 py-3 text-center">
              {t("colProducts")}
            </th>
            <th scope="col" className="px-4 py-3 text-center">
              {t("colStatus")}
            </th>
            <th scope="col" className="px-4 py-3 text-center">
              {t("colActions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.length > 0 ? (
            categories.map((category: Category) => (
              <tr key={category._id} className="border-b hover:bg-gray-50">
                {/* Cột Tên Danh mục */}
                <td className="px-4 py-2">
                  <div className="flex items-center">
                    <Image
                      src={
                        category.image ||
                        "https://res.cloudinary.com/dh7mq8bgc/image/upload/v1749800656/placeholder_w92s12.jpg"
                      }
                      alt={getLocalizedName(category.name, locale)}
                      width={48}
                      height={48}
                      className="mr-4 h-12 w-12 flex-shrink-0 rounded-lg border object-cover"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">
                        {getLocalizedName(category.name, locale)}
                      </span>
                      <span className="text-xs text-gray-500">
                        /{category.slug}
                      </span>
                    </div>
                  </div>
                </td>
                {/* Cột Danh mục cha */}
                <td className="px-4 py-2">
                  {/* Kiểm tra nếu parent là object và có name thì hiển thị, nếu không thì hiển thị gạch ngang */}
                  {typeof category.parent === "object" && category.parent?.name
                    ? getLocalizedName(category.parent.name, locale)
                    : t("noParent")}
                </td>
                {/* Cột số lượng sản phẩm */}
                <td className="px-4 py-2 text-center">
                  {category.productCount ?? 0}
                </td>
                {/* Cột Trạng thái */}
                <td className="px-4 py-2 text-center">
                  {category.isActive ? (
                    <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                      {t("statusActive")}
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-800">
                      {t("statusHidden")}
                    </span>
                  )}
                </td>
                {/* Cột Hành động */}
                <td className="px-4 py-2">
                  <div className="flex justify-center gap-1">
                    <CButton
                      color="info"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(category)}
                      title={t("editTitle")}
                    >
                      <CIcon icon={cilPen} size="sm" />
                    </CButton>
                    <CButton
                      color="danger"
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(category)}
                      title={t("deleteTitle")}
                    >
                      <CIcon icon={cilTrash} size="sm" />
                    </CButton>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="py-10 text-center text-gray-500">
                {t("noResults")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryListTable;
