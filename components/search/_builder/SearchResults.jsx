"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { searchProducts, fetchFacets } from "@/lib/search";

const SORT_OPTIONS = [
    { id: "PRICE_LOW_HIGH", label: "Price - Low to High" },
    { id: "PRICE_HIGH_LOW", label: "Price - High to low" },
];

const getCategoryFromProduct = (product) => {
    if (Array.isArray(product.categories) && product.categories.length > 0) {
        return product.categories[0];
    }

    return null;
};

const formatCategoryLabel = (category) => {
    if (!category) return "";

    return category
        .split(/[\/_-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
};

const formatPrice = (n) => (n != null && !Number.isNaN(n) ? `${Math.round(n)}` : null);

const getDiscountPercent = (price, compareAtPrice) => {
    if (price == null || compareAtPrice == null || compareAtPrice <= 0 || price >= compareAtPrice) return null;

    return Math.round((1 - price / compareAtPrice) * 100);
};

const StarRating = () => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
            <span key={i}>
                {i <= 4 ? (
                    <Image src="/svg/star-yellow.svg" width={11} height={11} alt="" aria-hidden />
                ) : (
                    <Image src="/svg/star-white.svg" width={12} height={12} alt="" aria-hidden />
                )}
            </span>
        ))}
    </div>
);

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

export default function SearchResults({ query }) {
    const [products, setProducts] = useState([]);
    const [sortBy, setSortBy] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedCollections, setSelectedCollections] = useState([]);
    const [priceRange, setPriceRange] = useState({ min: "", max: "" });
    const [quantities, setQuantities] = useState({});
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [facetCategories, setFacetCategories] = useState([]);
    const [facetCollections, setFacetCollections] = useState([]);

    // Support both string and suggestion object
    const searchText = typeof query === "string" ? query.trim() : query?.q?.trim() || "";

    const baseFilterBy = typeof query === "string" ? undefined : query?.filter_by || undefined;

    useEffect(() => {
        fetchFacets()
            .then(({ categories, collections }) => {
                setFacetCategories(categories);
                setFacetCollections(collections);
            })
            .catch(() => {
                setFacetCategories([]);
                setFacetCollections([]);
            });
    }, []);

    const combinedFilterBy = useMemo(() => {
        const filters = [];

        if (baseFilterBy) {
            filters.push(`(${baseFilterBy})`);
        }

        if (selectedCategories.length > 0) {
            filters.push(`categories:=[${selectedCategories.map((c) => `"${c}"`).join(",")}]`);
        }

        if (selectedCollections.length > 0) {
            filters.push(`collections:=[${selectedCollections.map((c) => `"${c}"`).join(",")}]`);
        }

        return filters.join(" && ") || undefined;
    }, [baseFilterBy, selectedCategories, selectedCollections]);

    useEffect(() => {
        if (!searchText) {
            setProducts([]);
            return;
        }

        searchProducts(searchText, combinedFilterBy).then(setProducts);
    }, [searchText, combinedFilterBy]);

    const categoryOptions = useMemo(() => facetCategories.map((item) => item.value), [facetCategories]);

    const collectionOptions = useMemo(() => facetCollections.map((item) => item.value), [facetCollections]);

    const toggleCategory = (category) => {
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
        );
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedCollections([]);
        setPriceRange({ min: "", max: "" });
        setSortBy("");
    };

    const applySort = (list) => {
        const sorted = [...list];

        switch (sortBy) {
            case "PRICE_LOW_HIGH":
                sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
                break;

            case "PRICE_HIGH_LOW":
                sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
                break;

            default:
                break;
        }

        return sorted;
    };

    const filteredProducts = useMemo(() => {
        let list = products;

        if (priceRange.min !== "" || priceRange.max !== "") {
            const min = priceRange.min !== "" ? Number(priceRange.min) : null;
            const max = priceRange.max !== "" ? Number(priceRange.max) : null;

            list = list.filter((product) => {
                const price = product.price ?? 0;

                if (min != null && price < min) return false;
                if (max != null && price > max) return false;

                return true;
            });
        }

        return applySort(list);
    }, [products, selectedCategories, priceRange, sortBy]);

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

    const hasActiveFiltersOrSort =
        sortBy ||
        selectedCategories.length > 0 ||
        selectedCollections.length > 0 ||
        priceRange.min !== "" ||
        priceRange.max !== "";

    const activeFilterCount =
        selectedCategories.length + selectedCollections.length + (priceRange.min !== "" || priceRange.max !== "" ? 1 : 0);

    const priceRangeLabel =
        priceRange.min !== "" && priceRange.max !== ""
            ? `₹${priceRange.min} - ₹${priceRange.max}`
            : priceRange.min !== ""
                ? `From ₹${priceRange.min}`
                : priceRange.max !== ""
                    ? `Up to ₹${priceRange.max}`
                    : "";

    return (
        <div className="relative min-h-screen bg-white pb-24">
            <div className="mt-2 space-y-3">
                {hasActiveFiltersOrSort && (
                    <div className="px-1">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-2">
                                {sortBy && (
                                    <button
                                        type="button"
                                        onClick={() => setSortBy("")}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-600"
                                    >
                                        {SORT_OPTIONS.find((opt) => opt.id === sortBy)?.label ?? "Sort"}
                                        <span aria-hidden>×</span>
                                    </button>
                                )}

                                {selectedCategories.map((category) => (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => toggleCategory(category)}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-600"
                                    >
                                        {formatCategoryLabel(category)}
                                        <span aria-hidden>×</span>
                                    </button>
                                ))}

                                {selectedCollections.map((collection) => (
                                    <button
                                        key={collection}
                                        type="button"
                                        onClick={() => setSelectedCollections((prev) => prev.filter((c) => c !== collection))}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-600"
                                    >
                                        {formatCategoryLabel(collection)}
                                        <span aria-hidden>×</span>
                                    </button>
                                ))}

                                {priceRangeLabel && (
                                    <button
                                        type="button"
                                        onClick={() => setPriceRange({ min: "", max: "" })}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-600"
                                    >
                                        {priceRangeLabel}
                                        <span aria-hidden>×</span>
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs font-medium text-orange-600 flex-shrink-0"
                            >
                                Clear all
                            </button>
                        </div>
                    </div>
                )}

                {filteredProducts.map((product) => {
                    const quantity = quantities[product.id] ?? 0;

                    return (
                        <div key={product.id} className="flex gap-3 bg-white py-3 border-b border-gray-100">
                            <div className="relative w-[72px] h-[111px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {product.featured_image && <Image src={product.featured_image} alt={product.title} fill />}
                            </div>

                            <div className="flex-1 flex flex-col min-w-0">
                                <div className="flex justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-[14px] text-[#292E2C] leading-[20px]">
                                            {highlightMatch(product.title, searchText)}
                                        </div>

                                        <div className="text-[12px] text-[#7B818C] mb-0.5 leading-[16px]">{product.subtitle}</div>

                                        <div className="flex gap-x-2">
                                            <p className="text-[12px] leading-[16px] text-[#676B73] bg-[#F5F7FA] px-[4px]">30g</p>
                                            <div className="flex gap-x-2 bg-[#F5F7FA] px-[4px] rounded-[2px] w-fit">
                                                <StarRating />
                                                <p className="text-[12px] leading-[16px] text-[#676B73]">(171)</p>
                                            </div>
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
                                                    −
                                                </button>
                                                <span>{quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleIncrease(product.id)}
                                                    className="w-5 h-5 rounded-full border border-orange-300 flex items-center justify-center"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-2 flex items-baseline gap-[2px] flex-wrap">
                                    {formatPrice(product.price) && (
                                        <p className="text-[10px] text-[#292E2C]">
                                            ₹<span className="text-[16px]">{formatPrice(product.price)}</span>
                                        </p>
                                    )}

                                    {product.compare_at_price && product.compare_at_price > product.price && (
                                        <>
                                            <span className="text-[12px] text-[#9DA6B2] line-through">
                                                {formatPrice(product.compare_at_price)}
                                            </span>
                                            {getDiscountPercent(product.price, product.compare_at_price) != null && (
                                                <span className="text-xs font-semibold text-[#D13F44]">
                                                    -{getDiscountPercent(product.price, product.compare_at_price)}%
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
                    <div className="py-16 text-center text-sm text-gray-500">No products found for this search.</div>
                )}
            </div>

            {/* Sort & Filter bar */}
            <div className="w-full fixed inset-x-0 bottom-0 z-30 bg-white border-t border-gray-200 px-5 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setIsSortOpen(true)}
                    className={`py-3 flex items-center justify-center gap-2 text-sm font-medium w-1/2 border-[#E6EAF0] border-r ${sortBy ? "text-[#C4512B]" : "text-[#292E2C]"}`}
                >
                    {sortBy ? (
                        <span className="text-[14px]">{SORT_OPTIONS.find((opt) => opt.id === sortBy)?.label ?? "Selected"}</span>
                    ) : (
                        <span>Sort</span>
                    )}
                    <span className="relative w-4 h-4">
                        {sortBy ? (
                            <Image src="/svg/sort-active.svg" alt="Sort" fill sizes="16px" unoptimized />
                        ) : (
                            <Image src="/svg/sort.svg" alt="Sort" fill sizes="16px" unoptimized />
                        )}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setIsFilterOpen(true)}
                    className={`py-3 flex items-center gap-2 text-sm font-medium w-1/2 justify-center ${activeFilterCount > 0 ? "text-[#C4512B]" : "text-[#292E2C]"}`}
                >
                    <span>Filters</span>
                    {activeFilterCount < 1 && (
                        <span className="relative w-4 h-4">
                            <Image src="/svg/filter.svg" alt="Filters" fill sizes="16px" unoptimized />
                        </span>
                    )}

                    {activeFilterCount > 0 && (
                        <div className="text-[#FFFFFF] text-[10px] w-[16px] h-[16px] flex items-center justify-center font-semibold bg-[#C4512B] rounded-[1000px]">
                            {activeFilterCount}
                        </div>
                    )}
                </button>
            </div>

            {/* Sort bottom sheet */}
            {isSortOpen && (
                <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
                    <div className="w-full max-w-md rounded-t-2xl bg-white pb-6 pt-3 px-4">
                        <div className="flex justify-center mb-3">
                            <button
                                type="button"
                                onClick={() => setIsSortOpen(false)}
                                className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center text-xl leading-none"
                                aria-label="Close sort"
                            >
                                ×
                            </button>
                        </div>
                        <h2 className="text-base font-semibold text-[#111827] mb-3">Sort by</h2>
                        <div className="divide-y divide-gray-100">
                            {SORT_OPTIONS.map((option) => {
                                const active = sortBy === option.id;

                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            setSortBy(option.id);
                                            setIsSortOpen(false);
                                        }}
                                        className={`w-full text-left py-3 text-sm ${active ? "text-[#111827] font-semibold" : "text-[#4B5563]"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters bottom sheet */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
                    <div className="w-full max-w-md rounded-t-2xl bg-white pb-6 pt-3 px-4">
                        <div className="flex justify-center mb-3">
                            <button
                                type="button"
                                onClick={() => setIsFilterOpen(false)}
                                className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center text-xl leading-none"
                                aria-label="Close filters"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-semibold text-[#111827]">Filters</h2>
                            {(selectedCategories.length > 0 ||
                                selectedCollections.length > 0 ||
                                priceRange.min !== "" ||
                                priceRange.max !== "") && (
                                    <button type="button" onClick={clearFilters} className="text-xs font-medium text-[#EF4444]">
                                        Clear all
                                    </button>
                                )}
                        </div>

                        <div className="space-y-5 max-h-[60vh] overflow-y-auto">
                            {/* Category filter */}
                            {categoryOptions.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-[#6B7280] mb-2">Category</p>
                                    <div className="space-y-2">
                                        {facetCategories.map((item) => {
                                            const value = item.value;
                                            const checked = selectedCategories.includes(value);

                                            return (
                                                <label key={value} className="flex items-center justify-between text-sm">
                                                    <span className="text-[#111827]">{formatCategoryLabel(value)}</span>
                                                    <span className="flex items-center gap-2">
                                                        <span className="inline-flex items-center justify-center min-w-[24px] px-2 h-[20px] rounded-full bg-[#F3F4F6] text-[11px] text-[#6B7280]">
                                                            {item.count}
                                                        </span>
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-[#111827] focus:ring-[#111827]"
                                                            checked={checked}
                                                            onChange={() => toggleCategory(value)}
                                                        />
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Collections filter */}
                            {collectionOptions.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-[#6B7280] mb-2">Collections</p>
                                    <div className="space-y-2">
                                        {facetCollections.map((item) => {
                                            const value = item.value;
                                            const checked = selectedCollections.includes(value);

                                            return (
                                                <label key={value} className="flex items-center justify-between text-sm">
                                                    <span className="text-[#111827]">{formatCategoryLabel(value)}</span>
                                                    <span className="flex items-center gap-2">
                                                        <span className="inline-flex items-center justify-center min-w-[24px] px-2 h-[20px] rounded-full bg-[#F3F4F6] text-[11px] text-[#6B7280]">
                                                            {item.count}
                                                        </span>
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-[#111827] focus:ring-[#111827]"
                                                            checked={checked}
                                                            onChange={() =>
                                                                setSelectedCollections((prev) =>
                                                                    checked ? prev.filter((c) => c !== value) : [...prev, value],
                                                                )
                                                            }
                                                        />
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Price range filter */}
                            <div>
                                <p className="text-xs font-medium text-[#6B7280] mb-2">Price range</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <label className="block text-[11px] text-[#9CA3AF] mb-1">Min</label>
                                        <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5">
                                            <span className="text-xs text-[#6B7280]">₹</span>
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                min={0}
                                                className="w-full text-sm outline-none border-none bg-transparent"
                                                value={priceRange.min}
                                                onChange={(e) =>
                                                    setPriceRange((prev) => ({
                                                        ...prev,
                                                        min: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>

                                    <span className="text-xs text-[#9CA3AF]">to</span>

                                    <div className="flex-1">
                                        <label className="block text-[11px] text-[#9CA3AF] mb-1">Max</label>
                                        <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5">
                                            <span className="text-xs text-[#6B7280]">₹</span>
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                min={0}
                                                className="w-full text-sm outline-none border-none bg-transparent"
                                                value={priceRange.max}
                                                onChange={(e) =>
                                                    setPriceRange((prev) => ({
                                                        ...prev,
                                                        max: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsFilterOpen(false)}
                            className="mt-5 w-full h-11 rounded-xl bg-[#111827] text-sm font-semibold text-white"
                        >
                            Apply filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
