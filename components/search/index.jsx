"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { products } from "../../constants/products";
import SearchBar from "./_builder/SearchBar";
import SearchHomePage from "./_builder/SearchHomePage";
import SearchSuggestionAndProducts from "./_builder/SearchSuggestionAndProducts";
import SearchResults from "./_builder/SearchResults";

export default function SearchComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const recentSearches = [
        "Moisturiser",
        "Shampoo",
        "Cold processed soap",
        "Aloe vera face pack",
    ];

    const recentProducts = products.slice(0, 3);

    const initialQ = searchParams.get("q") || "";
    const initialFilterBy = searchParams.get("filter_by") || null;

    const [searchValue, setSearchValue] = useState(initialQ);
    const [isResultsOpen, setIsResultsOpen] = useState(!!initialQ);
    const [resultsQuery, setResultsQuery] = useState(
        initialQ ? { q: initialQ, filter_by: initialFilterBy || undefined } : null,
    );

    const handleSubmitSearch = () => {
        const query = searchValue.trim();
        if (!query) return;

        setResultsQuery({ q: query });
        setIsResultsOpen(true);
        // Clear all filter/sort params — SearchResults initialises fresh from the new empty URL
        router.replace(`?q=${encodeURIComponent(query)}`, { scroll: false });
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchValue(suggestion.label);
        setResultsQuery({ q: suggestion.query, filter_by: suggestion.filter_by });
        setIsResultsOpen(true);

        const params = new URLSearchParams();
        params.set("q", suggestion.query);
        if (suggestion.filter_by) params.set("filter_by", suggestion.filter_by);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div className={`min-h-screen p-5 font-sans ${searchValue ? "bg-white" : "bg-gray-100"}`}>
            <SearchBar
                searchValue={searchValue}
                onChange={setSearchValue}
                onClear={() => {
                    setSearchValue("");
                    setIsResultsOpen(false);
                    router.replace("?", { scroll: false });
                }}
                onSubmit={handleSubmitSearch}
                onBack={isResultsOpen ? () => setIsResultsOpen(false) : undefined}
                isResultsOpen={isResultsOpen}
            />

            {searchValue ? (
                isResultsOpen ? (
                    // key=query.q remounts SearchResults on a new search so filter state resets
                    <SearchResults query={resultsQuery} />
                ) : (
                    <SearchSuggestionAndProducts
                        searchValue={searchValue}
                        onSuggestionClick={handleSuggestionClick}
                    />
                )
            ) : (
                <SearchHomePage
                    recentSearches={recentSearches}
                    recentProducts={recentProducts}
                />
            )}
        </div>
    );
}
