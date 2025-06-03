"use client";

const OrderLoadingSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg bg-white p-4 shadow-md sm:p-6"
        >
          <div className="mb-3 flex flex-col items-start justify-between sm:flex-row sm:items-center">
            <div className="mb-2 space-y-1 sm:mb-0">
              <div className="h-5 w-32 rounded bg-gray-300"></div>
              <div className="h-4 w-40 rounded bg-gray-200"></div>
            </div>
            <div className="h-6 w-24 rounded bg-gray-300"></div>
          </div>
          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="h-10 w-full rounded bg-gray-200"></div>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="h-8 w-28 rounded bg-gray-300"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderLoadingSkeleton;
