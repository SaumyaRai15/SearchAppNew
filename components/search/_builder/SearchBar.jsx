"use client"

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
        <div className="bg-white rounded-2xl px-4 py-3 mb-5 shadow-sm">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-xl text-black leading-none disabled:opacity-50"
                    aria-label="Go back"
                    disabled={!onBack}
                >
                    ←
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
                                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 text-lg leading-none"
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}

                        <span className="pointer-events-none absolute left-0 right-0 bottom-0 h-[2px] rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}