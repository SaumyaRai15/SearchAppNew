"use client";

import Image from "next/image";
import LoaderIcon from "../../Loaders/LoaderIcon";

export default function SearchBar({ searchValue, onChange, onClear, onSubmit, onBack, isResultsOpen, isLoading }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit?.();
    }
  };
  const clearIconSrc = isResultsOpen ? "/svg/cross-circle-gray.svg" : "/svg/cross.svg";
  const clearIconSizeClass = isResultsOpen ? "w-[20.5px] h-[20.5px]" : "w-[12px] h-[12px]";

  return (
    <div
      className={`bg-white px-4 py-3 mb-5 rounded-[12px] border ${
        searchValue && !isResultsOpen ? "border-[#303133]" : "border-[#F5F7FA]"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="relative w-6 h-6 text-black leading-none"
          aria-label="Go back"
          disabled={!onBack}
        >
          <Image src="/svg/chevron-left.svg" alt="Go back" fill unoptimized />
        </button>
        <div className="flex-1 min-w-0">
          <div className="relative">
            <input
              value={searchValue}
              onChange={(e) => onChange?.(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="w-[250px] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[16px] leading-[24px] outline-none border-none bg-transparent placeholder:text-gray-400 pr-6"
            />

            {searchValue && (
              <>
                {isLoading ? (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <LoaderIcon
                      width={isResultsOpen ? 20.5 : 12}
                      height={isResultsOpen ? 20.5 : 12}
                      stroke="#6B7280"
                      color="#6B7280"
                    />
                  </div>
                ) : (
                  onClear && (
                    <button
                      type="button"
                      onClick={onClear}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 ${clearIconSizeClass}`}
                      aria-label="Clear search"
                    >
                      <Image key={clearIconSrc} src={clearIconSrc} alt="Clear search" fill unoptimized />
                    </button>
                  )
                )}
              </>
            )}

            <span className="pointer-events-none absolute left-0 right-0 bottom-0 h-[2px] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
