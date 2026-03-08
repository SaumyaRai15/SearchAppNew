export const SearchSuggestionSkeleton = () => (
  <div className="mt-2 bg-white">
    {/* Suggestion rows */}
    {[140, 100, 160, 120, 90].map((w) => (
      <div key={w} className="w-full py-3 flex items-center gap-3 border-b border-gray-100">
        <div className="w-[14px] h-[14px] rounded bg-gray-200 animate-pulse flex-shrink-0" />
        <div className="h-[14px] bg-gray-200 rounded animate-pulse" style={{ width: w }} />
      </div>
    ))}

    {/* Product rows */}
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="py-3 flex items-center gap-3 border-b border-gray-100 last:border-b-0">
        <div className="w-[32px] h-[49px] rounded-[4px] bg-gray-200 animate-pulse flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-[10px] bg-gray-200 rounded animate-pulse w-1/2" />
          <div className="h-[13px] bg-gray-200 rounded animate-pulse w-full" />
          {/* <div className="h-[13px] bg-gray-200 rounded animate-pulse w-3/4" /> */}
        </div>
      </div>
    ))}
  </div>
);
