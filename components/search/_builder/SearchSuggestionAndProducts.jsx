"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { searchProducts, fetchSuggestions } from "@/lib/search";
import { SearchSuggestionSkeleton } from "@/components/Loaders/SearchSuggestionSkeleton";

export default function SearchSuggestionAndProducts({
    searchValue,
    onSuggestionClick,
}) {
    const query = searchValue.trim();

    const [suggestions, setSuggestions] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!query) {
            setSuggestions([]);
            setProducts([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        Promise.all([
            fetchSuggestions(query),
            searchProducts(query),
        ]).then(([suggs, res]) => {
            setSuggestions(suggs);
            setProducts(res.products.slice(0, 8));
            setIsLoading(false);
        });
    }, [query]);

    const highlightMatch = (text) => {
        if (!text || !query) return <span>{text}</span>;

        const lower = text.toLowerCase();
        const index = lower.indexOf(query.toLowerCase());

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

    if (isLoading) return <SearchSuggestionSkeleton />;

    if (suggestions.length === 0 && products.length === 0 && query) {
        return (
            <div className="mt-2 bg-white py-16 flex flex-col items-center gap-1">
                <p className="text-[14px] text-[#7B818C]">0 Matching Results for</p>
                <p className="text-[16px] text-[#292E2C] font-semibold">&ldquo;{query}&rdquo;</p>
            </div>
        );
    }

    return (
        <div className="mt-2 bg-white">
            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div className="bg-white">
                    {suggestions.slice(0, 5).map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className="w-full py-3 flex items-center gap-3 text-left border-b border-gray-100"
                            onClick={() => onSuggestionClick?.(item)}
                        >
                            <div className="relative w-[14px] h-[14px]">
                                <Image
                                    src="/svg/search-gray.svg"
                                    alt="Search"
                                    fill
                                    unoptimized
                                />
                            </div>

                            <span className="text-sm text-gray-800">
                                {highlightMatch(item.label)}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Product preview */}
            {products.length > 0 && (
                <div className="bg-white">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="py-3 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                        >
                            <div className="w-[32px] h-[49px] rounded-[4px] overflow-hidden flex-shrink-0 bg-gray-100">
                                <img
                                    src={product.featured_image}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-500 mb-0.5 line-clamp-1">
                                    {product.subtitle}
                                </div>
                                <div className="text-sm text-gray-900 font-medium leading-5 line-clamp-2">
                                    {highlightMatch(product.title)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}