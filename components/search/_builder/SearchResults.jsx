"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { searchProducts } from "@/lib/search";
import { formatCategoryLabel } from "../../../constants/categoryUtils";
import SortAndFilterBar from "./SortAndFilterBar";

const SortSheet = dynamic(() => import("./SortSheet"));
const FilterSheet = dynamic(() => import("./FilterSheet"));
const VariantSheet = dynamic(() => import("./VariantSheet"));

const SORT_OPTIONS = [
    { id: "PRICE_LOW_HIGH", label: "Price - Low to High" },
    { id: "PRICE_HIGH_LOW", label: "Price - High to low" },
];

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

const SkeletonCard = () => (
    <div className="flex gap-3 bg-white py-3 border-b border-gray-100 animate-pulse">
        <div className="w-[72px] h-[111px] rounded-lg bg-gray-200 flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
            <div className="h-[14px] bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="mt-4 flex justify-end">
                <div className="h-7 bg-gray-200 rounded-xl w-16" />
            </div>
            <div className="mt-auto h-4 bg-gray-200 rounded w-1/3" />
        </div>
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
    const router = useRouter();
    const searchParams = useSearchParams();


    // Initialise all filter/sort state from URL so a direct link loads correctly
    const [sortBy, setSortBy] = useState(() => searchParams.get("sort") || "");
    const [selectedCategories, setSelectedCategories] = useState(() => {
        const cats = searchParams.get("categories");
        return cats ? cats.split(",").filter(Boolean) : [];
    });
    const [selectedCollections, setSelectedCollections] = useState(() => {
        const cols = searchParams.get("collections");
        return cols ? cols.split(",").filter(Boolean) : [];
    });
    const [priceRange, setPriceRange] = useState(() => ({
        min: searchParams.get("price_min") || "",
        max: searchParams.get("price_max") || "",
    }));
    const [quantities, setQuantities] = useState({});
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [variantSheetProduct, setVariantSheetProduct] = useState(null);

    console.log("quantities: ", quantities)


    // Support both string and suggestion object
    const searchText = typeof query === "string" ? query.trim() : query?.q?.trim() || "";
    const baseFilterBy = typeof query === "string" ? undefined : query?.filter_by || undefined;

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

    // Query 1: fires only when search term changes — used for facets only so the
    // full list of categories/collections is always visible regardless of active filters
    const { data: facetData } = useQuery({
        queryKey: ["search-facets", searchText, baseFilterBy],
        queryFn: () => searchProducts(searchText, baseFilterBy),
        enabled: !!searchText,
        placeholderData: keepPreviousData,
    });

    // Query 2: fires on every filter/sort change — used for products only
    const {
        data: searchData,
        isFetching,
        isPending,
    } = useQuery({
        queryKey: ["search", searchText, combinedFilterBy, sortBy],
        queryFn: () => searchProducts(searchText, combinedFilterBy, sortBy),
        enabled: !!searchText,
        placeholderData: keepPreviousData,
    });

    const { products = [] } = searchData ?? {};
    const { facets: { categories: facetCategories = [], collections: facetCollections = [] } = {} } = facetData ?? {};

    // Reset filters (but not sort) whenever the search query changes
    const prevSearchText = useRef(searchText);
    useEffect(() => {
        if (prevSearchText.current !== searchText) {
            prevSearchText.current = searchText;
            setSelectedCategories([]);
            setSelectedCollections([]);
            setPriceRange({ min: "", max: "" });
        }
    }, [searchText]);

    // Sync filter/sort state back to URL whenever it changes (skip the first mount)
    const isInitialized = useRef(false);
    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true;
            return;
        }

        const params = new URLSearchParams();
        if (searchText) params.set("q", searchText);
        if (baseFilterBy) params.set("filter_by", baseFilterBy);
        if (sortBy) params.set("sort", sortBy);
        if (selectedCategories.length) params.set("categories", selectedCategories.join(","));
        if (selectedCollections.length) params.set("collections", selectedCollections.join(","));
        if (priceRange.min) params.set("price_min", priceRange.min);
        if (priceRange.max) params.set("price_max", priceRange.max);

        router.replace(`?${params.toString()}`, { scroll: false });
    }, [sortBy, selectedCategories, selectedCollections, priceRange]);

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

    // Price range stays client-side (continuous input — no need for a round-trip per keystroke)
    const filteredProducts = useMemo(() => {
        if (priceRange.min === "" && priceRange.max === "") return products;

        const min = priceRange.min !== "" ? Number(priceRange.min) : null;
        const max = priceRange.max !== "" ? Number(priceRange.max) : null;

        return products.filter((product) => {
            const price = product.price ?? 0;
            if (min != null && price < min) return false;
            if (max != null && price > max) return false;
            return true;
        });
    }, [products, priceRange]);

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

    // isPending = no data at all yet (first load for this query key)
    // isFetching && !isPending = new query in-flight but we have previous data to show
    if (isPending && isFetching) {
        return (
            <div className="relative min-h-screen bg-white pb-24">
                <div className="mt-2 space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-white pb-24">
            <div className={`mt-2 space-y-3 transition-opacity duration-150 ${isFetching ? "opacity-50" : "opacity-100"}`}>
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
                    const hasVariants = product.variants?.length > 0;
                    const quantity = quantities[product.id] ?? 0;
                    const totalVariantQty = hasVariants
                        ? product.variants.reduce((sum, v) => {
                            const vid = v.attributes?.shopifyVariantId;
                            return sum + (vid ? (quantities[vid] ?? 0) : 0);
                        }, 0)
                        : 0;

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
                                        {hasVariants ? (
                                            <>
                                                {totalVariantQty === 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setVariantSheetProduct(product)}
                                                        className="px-4 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-xs font-semibold text-orange-600"
                                                    >
                                                        ADD
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setVariantSheetProduct(product)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-xs font-semibold text-orange-600"
                                                    >
                                                        <span>{totalVariantQty}</span>
                                                        <span className="text-[10px]">▾</span>
                                                    </button>
                                                )}
                                                <p className="text-[10px] text-[#7B818C]">{product.variants.length} Options</p>
                                            </>
                                        ) : (
                                            <>
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
                                            </>
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
            <SortAndFilterBar
                sortBy={sortBy}
                setIsSortOpen={setIsSortOpen}
                setIsFilterOpen={setIsFilterOpen}
                activeFilterCount={activeFilterCount}
                sortOptions={SORT_OPTIONS}
            />

            {/* Sort bottom sheet */}
            <SortSheet
                isOpen={isSortOpen}
                onClose={() => setIsSortOpen(false)}
                sortBy={sortBy}
                onSortChange={setSortBy}
                sortOptions={SORT_OPTIONS}
            />

            {/* Filters bottom sheet */}
            <FilterSheet
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                selectedCategories={selectedCategories}
                selectedCollections={selectedCollections}
                priceRange={priceRange}
                facetCategories={facetCategories}
                facetCollections={facetCollections}
                onApply={({ categories, collections, priceRange: pr }) => {
                    setSelectedCategories(categories);
                    setSelectedCollections(collections);
                    setPriceRange(pr);
                }}
            />

            {/* Variant picker bottom sheet */}
            <VariantSheet
                isOpen={!!variantSheetProduct}
                onClose={() => setVariantSheetProduct(null)}
                product={variantSheetProduct}
                quantities={quantities}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
            />
        </div>
    );
}
