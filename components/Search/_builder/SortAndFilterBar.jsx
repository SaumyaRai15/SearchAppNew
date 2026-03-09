import Image from "next/image";

const SortAndFilterBar = ({ sortBy, setIsSortOpen, setIsFilterOpen, activeFilterCount, sortOptions }) => {
  const selectedSortLabel = sortOptions.find((opt) => opt.id === sortBy)?.label ?? "Sort";

  return (
    <div
      className="
        fixed inset-x-0 bottom-0
        z-30
        flex justify-center
        px-4
        pb-[calc(env(safe-area-inset-bottom)+16px)]
        pointer-events-none
      
      "
    >
      <div className="pointer-events-auto flex w-full max-h-[44px] max-w-[280px] items-center rounded-[32px] bg-transparent shadow-[0_12px_32px_rgba(0,0,0,0.16)] backdrop-blur-[10px] backdrop-saturate-150">
        {/* SORT */}
        <button
          type="button"
          onClick={() => setIsSortOpen(true)}
          className={`flex h-[44px] flex-1 items-center justify-center gap-2 rounded-s-[32px] text-sm font-medium transition-colors ${
            sortBy ? "bg-[#FCF1ED]/70 text-[#C4512B]" : "text-[#292E2C]"
          }`}
        >
          <span className="text-[14px] font-bold">{sortBy ? selectedSortLabel : "Sort"}</span>

          <span className="relative w-4 h-4">
            {sortBy ? (
              <Image src="/svg/sort-active.svg" alt="Sort" fill sizes="16px" unoptimized />
            ) : (
              <Image src="/svg/sort.svg" alt="Sort" fill sizes="16px" unoptimized />
            )}
          </span>
        </button>

        {/* <div className="h-full w-px bg-[#C4512B]" /> */}

        {/* FILTER */}
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={`flex h-[44px] flex-1 items-center justify-center gap-2 rounded-e-[32px] text-sm font-medium transition-colors ${
            activeFilterCount > 0 ? "bg-[#FCF1ED]/70 text-[#C4512B]" : "text-[#292E2C]"
          }`}
        >
          <span className="text-[14px] font-bold">Filters</span>

          {activeFilterCount > 0 ? (
            <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#C4512B] text-[10px] font-black text-white">
              {activeFilterCount}
            </div>
          ) : (
            <span className="relative w-4 h-4">
              <Image src="/svg/filter.svg" alt="Filters" fill sizes="16px" unoptimized />
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default SortAndFilterBar;
