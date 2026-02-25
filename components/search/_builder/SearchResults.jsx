"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { searchProducts } from "@/lib/search";

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

const formatPrice = (n) => (n != null && !Number.isNaN(n) ? `${Math.round(n)}` : null);

const getDiscountPercent = (price, compareAtPrice) => {
    if (price == null || compareAtPrice == null || compareAtPrice <= 0 || price >= compareAtPrice) return null;
    return Math.round((1 - price / compareAtPrice) * 100);
};

const StarRating = () => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="inline-block">
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

export default function SearchResults({ query = "" }) {
    const [products, setProducts] = useState([]);
    const [sortBy, setSortBy] = useState("POPULARITY");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [quantities, setQuantities] = useState({});

    const trimmedQuery = query.trim();

    // 🔥 FETCH FROM TYPESENSE
    useEffect(() => {
        if (!trimmedQuery) {
            setProducts([]);
            return;
        }

        searchProducts(trimmedQuery).then(setProducts);
    }, [trimmedQuery]);

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
            case "PRICE_LOW_HIGH":
                sorted.sort(
                    (a, b) => (a.price ?? 0) - (b.price ?? 0)
                );
                break;

            case "PRICE_HIGH_LOW":
                sorted.sort(
                    (a, b) => (b.price ?? 0) - (a.price ?? 0)
                );
                break;

            default:
                break;
        }

        return sorted;
    };

    const filteredProducts = useMemo(() => {
        let list = products;

        if (selectedCategories.length > 0) {
            list = list.filter((product) =>
                selectedCategories.includes(getCategoryFromProduct(product))
            );
        }

        return applySort(list);
    }, [products, selectedCategories, sortBy]);

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

    const activeFiltersCount =
        selectedCategories.length + (sortBy !== "POPULARITY" ? 1 : 0);

    return (
        <div className="relative min-h-screen bg-white pb-24">

            {/* Results list */}
            <div className="mt-2 space-y-3">
                {filteredProducts.map((product) => {
                    const quantity = quantities[product.id] ?? 0;
                    return (
                        <div
                            key={product.id}
                            className="flex gap-3 bg-white py-3 border-b border-gray-100"
                        >
                            <div className="relative w-[72px] h-[111px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {product.featured_image && (
                                    <Image
                                        src={product.featured_image}
                                        alt={product.title}
                                        fill
                                    />
                                )}
                            </div>

                            <div className="flex-1 flex flex-col min-w-0">
                                <div className="flex justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-[14px] text-[#292E2C] leading-[20px]">
                                            {highlightMatch(product.title, trimmedQuery)}
                                        </div>
                                        <div className="text-[12px] text-[#7B818C] mb-0.5 leading-[16px]">
                                            {product.subtitle}
                                        </div>
                                        {product.quantity_tag && (
                                            <div className="text-[12px] text-[#7B818C] leading-[16px]">
                                                {product.quantity_tag}
                                            </div>
                                        )}
                                        <div className="flex gap-x-2">
                                            <p className="text-[12px] leading-[16px] text-[#676B73] bg-[#F5F7FA] px-[4px]">
                                                30g
                                            </p>
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
                                        <p className="text-[10px] text-[#292E2C]">₹
                                            <span className="text-[16px]">
                                                {formatPrice(product.price)}
                                            </span>
                                        </p>

                                    )}
                                    {product.compare_at_price != null &&
                                        product.compare_at_price > 0 &&
                                        (product.price == null || product.compare_at_price > product.price) && (
                                            <>
                                                <span className="text-[12px] text-[#9DA6B2] line-through leading-[10px]">
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
                    <div className="py-16 text-center text-sm text-gray-500">
                        No products found for this search.
                    </div>
                )}
            </div>
        </div>
    );
}