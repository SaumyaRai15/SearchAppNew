"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import LoaderIcon from "../../Loaders/LoaderIcon";

export default function SearchBar({ searchValue, onChange, onClear, onSubmit, onBack, isResultsOpen, isLoading }) {
  const suggestions = ["Face Wash", "Shampoo", "Lip Care", "Baby Oils", "Moisturiser"];

  const [index, setIndex] = useState(0);
  const [transition, setTransition] = useState(true);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit?.();
    }
  };

  useEffect(() => {
    if (searchValue) return;

    const interval = setInterval(() => {
      setIndex((i) => i + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [searchValue]);

  useEffect(() => {
    if (index === suggestions.length) {
      setTimeout(() => {
        setTransition(false);
        setIndex(0);

        requestAnimationFrame(() => {
          setTransition(true);
        });
      }, 500);
    }
  }, [index]);

  const clearIconSrc = isResultsOpen ? "/svg/cross-circle-gray.svg" : "/svg/cross.svg";

  const clearIconSizeClass = isResultsOpen ? "w-[20.5px] h-[20.5px]" : "w-[12px] h-[12px]";

  return (
    <div
      className={`bg-white px-4 py-3 mb-5 rounded-[12px] border ${
        searchValue && !isResultsOpen ? "border-[#303133]" : "border-[#F5F7FA]"
      }`}
    >
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="relative w-6 h-6" aria-label="Go back">
          <Image src="/svg/chevron-left.svg" alt="Go back" fill unoptimized />
        </button>

        <div className="flex-1 min-w-0">
          <div className="relative">
            <input
              value={searchValue}
              onChange={(e) => onChange?.(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder=""
              className="w-[250px] text-[16px] leading-[24px] outline-none border-none bg-transparent pr-6"
            />

            {!searchValue && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 text-gray-400">
                <span>Search for</span>

                <div className="relative h-[24px] overflow-hidden">
                  <div
                    className={`${transition ? "transition-transform duration-500 ease-in-out" : ""}`}
                    style={{
                      transform: `translateY(-${index * 24}px)`,
                    }}
                  >
                    {[...suggestions, suggestions[0]].map((item, i) => (
                      <div key={i} className="h-[24px] text-gray-400">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {searchValue && (
              <>
                {isLoading ? (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <LoaderIcon width={isResultsOpen ? 20.5 : 12} height={isResultsOpen ? 20.5 : 12} />
                  </div>
                ) : (
                  onClear && (
                    <button
                      type="button"
                      onClick={onClear}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 ${clearIconSizeClass}`}
                    >
                      <Image src={clearIconSrc} alt="Clear search" fill unoptimized />
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
