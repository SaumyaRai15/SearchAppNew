import Image from "next/image";

const SortAndFilterBar = ({ sortBy, setIsSortOpen, setIsFilterOpen, activeFilterCount, sortOptions }) => {
    const selectedSortLabel = sortOptions.find((opt) => opt.id === sortBy)?.label ?? "Sort";

    return (
        <div
            className="
        fixed bottom-0 inset-x-0
        z-30
        bg-white/10 backdrop-blur-[10px]
        border-t border-gray-200
        shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
        flex items-center
      "
        >
            {/* SORT */}
            <button
                type="button"
                onClick={() => setIsSortOpen(true)}
                className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium border-r border-gray-200 ${sortBy ? "text-[#C4512B]" : "text-[#292E2C]"
                    }`}
            >
                <span className="text-[14px]">{sortBy ? selectedSortLabel : "Sort"}</span>

                <span className="relative w-4 h-4">
                    {sortBy ? (
                        <Image src="/svg/sort-active.svg" alt="Sort" fill sizes="16px" unoptimized />
                    ) : (
                        <Image src="/svg/sort.svg" alt="Sort" fill sizes="16px" unoptimized />
                    )}
                </span>
            </button>

            {/* FILTER */}
            <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium ${activeFilterCount > 0 ? "text-[#C4512B]" : "text-[#292E2C]"
                    }`}
            >
                <span className="text-[14px]">Filters</span>

                {activeFilterCount > 0 ? (
                    <div className="text-white text-[10px] w-[18px] h-[18px] flex items-center justify-center font-semibold bg-[#C4512B] rounded-full">
                        {activeFilterCount}
                    </div>
                ) : (
                    <span className="relative w-4 h-4">
                        <Image src="/svg/filter.svg" alt="Filters" fill sizes="16px" unoptimized />
                    </span>
                )}
            </button>
        </div>
    );
};

export default SortAndFilterBar;
