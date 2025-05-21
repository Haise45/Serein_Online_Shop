"use client";
import { useState, useEffect } from 'react';
import { ProductFilters } from "@/app/(main)/(client)/products/ProductsPageClient";
import FilterDisclosure from './FilterDisclosure';
import { PREDEFINED_PRICE_RANGES, PriceRangeOption } from '@/constants/filters';
import classNames from 'classnames';

interface PriceFilterProps {
  currentFilters: ProductFilters;
  onFilterChange: (newFilters: ProductFilters) => void;
}

export default function PriceFilter({ currentFilters, onFilterChange }: PriceFilterProps) {
  const [minPrice, setMinPrice] = useState<string>(currentFilters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState<string>(currentFilters.maxPrice?.toString() || '');

  useEffect(() => {
    setMinPrice(currentFilters.minPrice?.toString() || '');
    setMaxPrice(currentFilters.maxPrice?.toString() || '');
  }, [currentFilters.minPrice, currentFilters.maxPrice]);

  const handleApplyPriceRange = () => {
    const newMin = minPrice ? parseInt(minPrice, 10) : undefined;
    const newMax = maxPrice ? parseInt(maxPrice, 10) : undefined;
    onFilterChange({ ...currentFilters, minPrice: newMin, maxPrice: newMax });
  };

  const handleSelectPredefinedRange = (range: PriceRangeOption) => {
    setMinPrice(range.min?.toString() || '');
    setMaxPrice(range.max?.toString() || '');
    // Tự động áp dụng khi chọn khoảng giá cố định
    onFilterChange({ ...currentFilters, minPrice: range.min, maxPrice: range.max });
  };

  return (
    <FilterDisclosure title="Giá" defaultOpen={true}>
      <div className="space-y-4">
        {/* Tùy chọn giá cố định */}
        <div className="space-y-2">
          {PREDEFINED_PRICE_RANGES.map((range, index) => (
            <button
              key={index}
              onClick={() => handleSelectPredefinedRange(range)}
              className={classNames(
                "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                currentFilters.minPrice === range.min && currentFilters.maxPrice === range.max
                  ? "bg-indigo-100 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
        {/* Input khoảng giá tùy chỉnh */}
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <label htmlFor="min-price" className="sr-only">Giá từ</label>
            <input
              type="number"
              id="min-price"
              name="min-price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Từ"
              className="input-field-sm w-full" // input-field-sm là class cho input nhỏ hơn
              min="0"
            />
          </div>
          <span className="text-gray-400">–</span>
          <div className="flex-1">
            <label htmlFor="max-price" className="sr-only">Giá đến</label>
            <input
              type="number"
              id="max-price"
              name="max-price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Đến"
              className="input-field-sm w-full"
              min="0"
            />
          </div>
        </div>
        <button
            onClick={handleApplyPriceRange}
            className="w-full rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
            Áp dụng khoảng giá
        </button>
      </div>
    </FilterDisclosure>
  );
}