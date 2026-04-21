import Image from "next/image";
import { RecentSearchesSkeleton, RecentProductsSkeleton } from "../../Loaders/SearchHomePageSkeleton";
import Link from "next/link";

function recentSearchChipLabel(item) {
  if (typeof item === "string") return item;
  return item?.label ?? "";
}

export default function SearchHomePage({ recentSearches, recentProducts, onRecentSearchClick }) {
  return (
    <>
      {/* Recent Searches */}
      {recentSearches === null ? (
        <RecentSearchesSkeleton />
      ) : recentSearches.length > 0 ? (
        <>
          <p className="mb-3 text-[12px] leading-4 tracking-[0.23px]">Recent searches</p>

          <div className="flex flex-wrap gap-2">
            {recentSearches.map((item, index) => (
              <button
                key={`${recentSearchChipLabel(item)}-${index}`}
                type="button"
                onClick={() => onRecentSearchClick?.(item)}
                className="bg-white px-[8px] text-[#4B4D52] py-2 rounded-[4px] leading-4 text-[14px] tracking-[0.23px]"
              >
                {recentSearchChipLabel(item)}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {/* Recently Viewed */}
      {recentProducts === null ? (
        <div className="mt-8">
          <RecentProductsSkeleton />
        </div>
      ) : recentProducts.length > 0 ? (
        <>
          <h4 className="mt-8 mb-3 leading-4 text-[12px] tracking-[0.23px]">Recently viewed</h4>

          <div className="flex gap-4 overflow-x-auto h-[249px]">
            {recentProducts.map((product) => (
              <Link
                key={product.id}
                href={`https://nathabit.in/products/${product.url}`}
                target="_blank"
                rel="noreferrer"
                prefetch={false}
                className="w-[112px] h-[249px] flex-shrink-0"
              >
                <div className="relative w-[112px] h-[149px] mb-2">
                  <Image
                    src={product.featured_image}
                    alt={product.short_code || product.title}
                    fill
                    // sizes="112px"
                    className="rounded-[8px]"
                    unoptimized
                    loading="eager"
                  />
                </div>

                <div className="text-[14px] leading-[20px] mb-1 line-clamp-2">{product.short_code || product.title}</div>

                <div className="text-[12px] leading-[16px] text-[#7B818C] mb-1 truncate">{product.subtitle}</div>

                <div className="gap-x-[2px]">
                  <span className="text-[16px] leading-[20px]">
                    <span className="text-[12px]">₹</span>
                    {product.price}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="line-through leading-[10px] text-[#9DA6B2] text-[12px] ml-[3px]">
                      <span className="text-[10px]">₹</span>
                      {product.compare_at_price}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
