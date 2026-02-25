"use client"

import Image from "next/image";

export default function SearchBar({
    searchValue,
    onChange,
    onClear,
    onSubmit,
    onBack,
}) {
    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            onSubmit?.();
        }
    };

    return (
        <div
            className={`bg-white px-4 py-3 mb-5 rounded-[12px] border ${searchValue ? "border-[#303133]" : "border-transparent"
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
                <div className="flex-1">
                    <div className="relative">
                        <input
                            value={searchValue}
                            onChange={(e) => onChange?.(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search"
                            className="w-full text-base outline-none border-none bg-transparent placeholder:text-gray-400 pr-6"
                        />

                        {searchValue && onClear && (
                            <button
                                type="button"
                                onClick={onClear}
                                className="absolute right-0 top-1/2 -translate-y-1/2 w-[12px] h-[12px]"
                                aria-label="Clear search"
                            >
                                <Image
                                    src="/svg/cross.svg"
                                    alt="Clear search"
                                    fill
                                    unoptimized
                                />
                            </button>
                        )}

                        <span className="pointer-events-none absolute left-0 right-0 bottom-0 h-[2px] rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}