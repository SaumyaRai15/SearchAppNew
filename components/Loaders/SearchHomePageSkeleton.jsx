export const RecentSearchesSkeleton = () => (
  <>
    <div className="h-[16px] w-[100px] bg-gray-200 rounded mb-3 animate-pulse" />
    <div className="flex flex-wrap gap-2">
      {[88, 72, 120, 96].map((w) => (
        <div key={w} className="h-[32px] bg-gray-200 rounded-[4px] animate-pulse" style={{ width: w }} />
      ))}
    </div>
  </>
);

export const RecentProductsSkeleton = () => (
  <>
    <div className="h-[16px] w-[110px] bg-gray-200 rounded mb-3 animate-pulse" />
    <div className="flex gap-4 h-[249px]">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-[112px] flex-shrink-0 flex flex-col gap-2">
          <div className="w-[112px] h-[149px] bg-gray-200 rounded-2xl animate-pulse" />
          <div className="h-[14px] bg-gray-200 rounded animate-pulse w-full" />
          <div className="h-[12px] bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-[16px] bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      ))}
    </div>
  </>
);
