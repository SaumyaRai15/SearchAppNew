import { useMemo, useState } from "react";
import Image from "next/image";
import { products } from "../../../constants/products";

const SORT_OPTIONS = [
    { id: "POPULARITY", label: "Popularity" },
    { id: "RATING_DESC", label: "Ratings - High to low" },
    { id: "PRICE_LOW_HIGH", label: "Price - Low to High" },
    { id: "PRICE_HIGH_LOW", label: "Price - High to low" },
];

const CATEGORY_OPTIONS = ["Face", "Body", "Hands", "Feet"];

const getCategoryFromProduct = (product) => {
    const text = `${product.title ?? ""} ${product.subtitle ?? ""}`.toLowerCase();

    if (text.includes("face")) return "Face";
    if (text.includes("hand")) return "Hands";
    if (text.includes("feet") || text.includes("foot")) return "Feet";

    return "Body";
};

const highlightMatch = (text, query) => {
    if (!text || !query) return <span>{text}</span>;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return <span>{text}</span>;

    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);

    return (
        <span>
            {before}
            <span className="font-semibold">{match}</span>
            {after}
        </span>
    );
};

const getDiscountPercent = (mrp, sp) => {
    if (!mrp || !sp || sp >= mrp) return null;
    return Math.round(((mrp - sp) / mrp) * 100);
};

export default function SearchResults({ query = "", onBack, onClose }) {
    const [sortBy, setSortBy] = useState("POPULARITY");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [quantities, setQuantities] = useState({});

    const trimmedQuery = query.trim().toLowerCase();

    const toggleCategory = (category) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const applySort = (list) => {
        const sorted = [...list];

        switch (sortBy) {
            case "RATING_DESC":
                sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
                break;
            case "PRICE_LOW_HIGH":
                sorted.sort((a, b) => (a.sp ?? a.mrp ?? 0) - (b.sp ?? b.mrp ?? 0));
                break;
            case "PRICE_HIGH_LOW":
                sorted.sort((a, b) => (b.sp ?? b.mrp ?? 0) - (a.sp ?? a.mrp ?? 0));
                break;
            case "POPULARITY":
            default:
                sorted.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
                break;
        }

        return sorted;
    };

    const filteredProducts = useMemo(() => {
        let list = products;

        if (trimmedQuery) {
            list = list.filter((product) => {
                const title = product.title?.toLowerCase() ?? "";
                const subtitle = product.subtitle?.toLowerCase() ?? "";
                return (
                    title.includes(trimmedQuery) || subtitle.includes(trimmedQuery)
                );
            });
        }

        if (selectedCategories.length > 0) {
            list = list.filter((product) =>
                selectedCategories.includes(getCategoryFromProduct(product))
            );
        }

        return applySort(list);
    }, [trimmedQuery, selectedCategories, sortBy]);

    const handleIncrease = (id) => {
        setQuantities((prev) => ({
            ...prev,
            [id]: (prev[id] ?? 0) + 1,
        }));
    };

    const handleDecrease = (id) => {
        setQuantities((prev) => {
            const current = prev[id] ?? 0;
            if (current <= 1) {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            }
            return {
                ...prev,
                [id]: current - 1,
            };
        });
    };

    const hasSortFilter = sortBy !== "POPULARITY";
    const activeFiltersCount = selectedCategories.length + (hasSortFilter ? 1 : 0);

    return (
        <div className="relative min-h-screen bg-white pb-24">

            {/* Applied filters chips */}
            {activeFiltersCount > 0 && (
                <div className="px-4 pt-3 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        {hasSortFilter && (
                            <button
                                type="button"
                                onClick={() => setSortBy("POPULARITY")}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-xs text-orange-700 border border-orange-200"
                            >
                                <span className="flex items-center gap-1">
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 16 16"
                                        aria-hidden="true"
                                        className="text-orange-700"
                                    >
                                        <path
                                            d="M6 3L4 5M4 5L2 3M4 5V2M10 11L12 9M12 9L14 11M12 9V14"
                                            stroke="currentColor"
                                            strokeWidth="1.2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <span>
                                        {
                                            SORT_OPTIONS.find(
                                                (option) => option.id === sortBy
                                            )?.label
                                        }
                                    </span>
                                </span>
                                <span className="text-[10px]">×</span>
                            </button>
                        )}
                        {selectedCategories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                onClick={() => toggleCategory(category)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-xs text-orange-700 border border-orange-200"
                            >
                                <span>{category}</span>
                                <span className="text-[10px]">×</span>
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCategories([]);
                            setSortBy("POPULARITY");
                        }}
                        className="text-xs text-orange-600 font-medium"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* Results list */}
            <div className="mt-2 space-y-3">
                {filteredProducts.map((product) => {
                    const quantity = quantities[product.id] ?? 0;
                    const discountPercent = getDiscountPercent(
                        product.mrp,
                        product.sp
                    );
                    const starValue = Math.round(product.rating ?? 4.5);

                    return (
                        <div
                            key={product.id}
                            className="flex gap-3 bg-white py-3 border-b border-gray-100"
                        >
                            <div className="w-[86px] h-[120px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <Image
                                    src={product.featuredImage}
                                    alt={product.title}
                                    width={86}
                                    height={120}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 flex flex-col min-w-0">
                                <div className="flex justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-[11px] text-gray-500 mb-0.5 line-clamp-1">
                                            {product.subtitle}
                                        </div>
                                        <div className="text-sm text-gray-900 font-semibold leading-5 line-clamp-2">
                                            {highlightMatch(product.title, trimmedQuery)}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        {quantity === 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => handleIncrease(product.id)}
                                                className="px-4 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-xs font-semibold text-orange-600"
                                            >
                                                ADD
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-xs font-semibold text-orange-600">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDecrease(product.id)}
                                                    className="w-5 h-5 rounded-full border border-orange-300 flex items-center justify-center"
                                                >
                                                    <span className="text-sm leading-none">−</span>
                                                </button>
                                                <span>{quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleIncrease(product.id)}
                                                    className="w-5 h-5 rounded-full border border-orange-300 flex items-center justify-center"
                                                >
                                                    <span className="text-sm leading-none">+</span>
                                                </button>
                                            </div>
                                        )}
                                        <span className="text-[11px] text-orange-500">
                                            2 Options
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md border border-gray-200 text-[11px] text-gray-700">
                                        30g
                                    </span>
                                    <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
                                        <div className="flex items-center gap-0.5 text-[11px]">
                                            {Array.from({ length: 5 }).map((_, index) => (
                                                <span
                                                    // eslint-disable-next-line react/no-array-index-key
                                                    key={index}
                                                    className={
                                                        index < starValue
                                                            ? "text-yellow-400"
                                                            : "text-gray-300"
                                                    }
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        {product.reviewCount && (
                                            <span className="text-[11px] text-gray-600 ml-1">
                                                ({product.reviewCount})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-base font-semibold text-gray-900">
                                        ₹{product.sp ?? product.mrp}
                                    </span>
                                    {product.mrp && product.sp && product.sp < product.mrp && (
                                        <>
                                            <span className="text-xs text-gray-400 line-through">
                                                ₹{product.mrp}
                                            </span>
                                            {discountPercent && (
                                                <span className="text-xs font-semibold text-red-500">
                                                    -{discountPercent}%
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredProducts.length === 0 && (
                    <div className="py-16 text-center text-sm text-gray-500">
                        No products found for this search.
                    </div>
                )}
            </div>

            {/* Bottom bar */}
            <div className="fixed bottom-0 inset-x-0 z-30">
                <div className="mx-4 mb-4 rounded-[28px] bg-white/95 backdrop-blur shadow-[0_4px_16px_rgba(15,23,42,0.16)] px-5 py-2 flex items-center text-sm">
                    <button
                        type="button"
                        onClick={() => setIsSortOpen(true)}
                        className="flex flex-1 items-center justify-center gap-1.5 text-gray-900 font-semibold"
                    >
                        <span>Sort</span>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            aria-hidden="true"
                            className="text-gray-700"
                        >
                            <path
                                d="M6 4L4 6L2 4"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M4 2V6"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M12 14L14 12L16 14"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M14 16V12"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    <div className="h-6 w-px mx-4 bg-gray-200" />

                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(true)}
                        className="flex flex-1 items-center justify-center gap-1.5 text-gray-900 font-semibold"
                    >
                        <span>Filters</span>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            aria-hidden="true"
                            className="text-gray-700"
                        >
                            <path
                                d="M4 5H15"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M3 9H14"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M5 13H16"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                            />
                            <circle
                                cx="7"
                                cy="5"
                                r="1.3"
                                fill="white"
                                stroke="currentColor"
                                strokeWidth="1"
                            />
                            <circle
                                cx="11"
                                cy="9"
                                r="1.3"
                                fill="white"
                                stroke="currentColor"
                                strokeWidth="1"
                            />
                            <circle
                                cx="9"
                                cy="13"
                                r="1.3"
                                fill="white"
                                stroke="currentColor"
                                strokeWidth="1"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Sort sheet */}
            {isSortOpen && (
                <div className="fixed inset-0 z-40 flex items-end justify-center">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setIsSortOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white rounded-t-3xl px-5 pt-3 pb-6">
                        <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-base font-semibold">Sort by</div>
                            <button
                                type="button"
                                onClick={() => setIsSortOpen(false)}
                                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center"
                            >
                                <span className="text-lg leading-none">×</span>
                            </button>
                        </div>

                        <div className="space-y-2 text-sm">
                            {SORT_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        setSortBy(option.id);
                                        setIsSortOpen(false);
                                    }}
                                    className={`w-full text-left py-2 ${sortBy === option.id
                                        ? "text-orange-600 font-semibold"
                                        : "text-gray-800"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filter sheet */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-40 flex items-end justify-center">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setIsFilterOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white rounded-t-3xl pt-3 pb-6 flex flex-col">
                        <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-3" />

                        <div className="px-5 mb-4 flex items-center justify-between">
                            <div className="text-base font-semibold">Filters</div>
                            {activeFiltersCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategories([]);
                                        setSortBy("POPULARITY");
                                    }}
                                    className="text-xs text-orange-600 font-medium"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        <div className="flex flex-1 min-h-[220px] border-t border-b border-gray-100">
                            <div className="w-28 border-r border-gray-100 text-sm">
                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-3 bg-orange-50 text-orange-700 font-semibold border-r-2 border-orange-500"
                                >
                                    Category
                                    {selectedCategories.length > 0 && (
                                        <span className="ml-1 text-[11px] rounded-full bg-orange-100 text-orange-700 px-1">
                                            {selectedCategories.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-3 text-gray-400"
                                >
                                    Issues
                                </button>
                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-3 text-gray-400"
                                >
                                    Ingredients
                                </button>
                            </div>

                            <div className="flex-1 px-4 py-3 text-sm space-y-2">
                                {CATEGORY_OPTIONS.map((category) => (
                                    <label
                                        key={category}
                                        className="flex items-center justify-between py-1.5"
                                    >
                                        <span className="text-gray-800">{category}</span>
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category)}
                                            onChange={() => toggleCategory(category)}
                                            className="w-4 h-4 rounded border-gray-300 text-orange-600"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="px-5 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsFilterOpen(false)}
                                className="w-full py-3 rounded-full bg-black text-white text-sm font-semibold"
                            >
                                Apply filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
