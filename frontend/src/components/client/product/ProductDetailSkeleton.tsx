export default function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
      {/* Image gallery skeleton */}
      <div className="flex flex-col-reverse">
        {/* Image selector skeleton */}
        <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-gray-200 text-sm font-medium text-gray-900 uppercase hover:bg-gray-300"
              ></div>
            ))}
          </div>
        </div>
        {/* Main image skeleton */}
        <div className="aspect-[3/4] w-full rounded-lg bg-gray-200"></div>
      </div>

      {/* Product info skeleton */}
      <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
        <div className="h-8 w-3/4 rounded bg-gray-300"></div>
        <div className="mt-3 h-5 w-1/4 rounded bg-gray-200"></div>
        <div className="mt-6 h-10 w-1/2 rounded bg-gray-300"></div>

        <div className="mt-6 space-y-4">
          <div className="h-5 w-20 rounded bg-gray-200"></div>
          <div className="flex space-x-3">
            {[...Array(3)].map((_, idx) => (
              <div
                key={idx}
                className="h-10 w-10 rounded-full bg-gray-200"
              ></div>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="h-5 w-16 rounded bg-gray-200"></div>
          <div className="flex space-x-3">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="h-10 w-16 rounded-md bg-gray-200"></div>
            ))}
          </div>
        </div>

        <div className="mt-8 h-12 w-full rounded-md bg-gray-300"></div>
        <div className="mt-4 h-10 w-1/3 rounded-md bg-gray-300"></div>
      </div>
    </div>
  );
}
