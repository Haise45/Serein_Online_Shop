import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import React from "react";
import { FiLoader } from "react-icons/fi";
import { useTranslations } from "next-intl";

interface SearchSuggestionListProps {
  suggestions: Product[];
  isLoading: boolean;
  searchTerm: string;
  onSuggestionClick?: () => void; // Callback để đóng suggestion box nếu cần
  onViewAllClick?: () => void; // Callback cho nút "Xem tất cả"
}

const SearchSuggestionList: React.FC<SearchSuggestionListProps> = ({
  suggestions,
  isLoading,
  searchTerm,
  onSuggestionClick,
  onViewAllClick,
}) => {
  const t = useTranslations("SearchSuggestion");

  if (!searchTerm) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        <FiLoader className="mr-2 inline animate-spin" /> {t("loading")}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        {t("noResults", { searchTerm })}
      </div>
    );
  }

  if (suggestions.length > 0) {
    return (
      <ul className="divide-y divide-gray-100">
        {suggestions.map((product) => (
          <li key={product._id} className="rounded-md hover:bg-gray-100">
            <Link
              href={`/products/${product.slug}`}
              onClick={onSuggestionClick}
              className="flex items-center p-3 text-sm"
            >
              <Image
                src={product.images?.[0] || "/placeholder-image.jpg"}
                alt={product.name}
                width={40}
                height={40}
                quality={100}
                className="mr-3 h-10 w-10 flex-shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800">
                  {product.name}
                </p>
                <p className="text-xs font-semibold text-indigo-600">
                  {formatCurrency(product.displayPrice)}
                  {product.isOnSale && product.price > product.displayPrice && (
                    <span className="ml-2 text-[11px] text-gray-400 line-through">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                </p>
              </div>
            </Link>
          </li>
        ))}
        {searchTerm && (
          <li className="p-3 text-center">
            <button
              onClick={onViewAllClick}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              {t("viewAll", { searchTerm })}
            </button>
          </li>
        )}
      </ul>
    );
  }

  return null;
};

export default SearchSuggestionList;
