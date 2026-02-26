"use client";

import { useState } from "react";
import { products } from "../../constants/products";
import SearchBar from "./_builder/SearchBar";
import SearchHomePage from "./_builder/SearchHomePage";
import SearchSuggestionAndProducts from "./_builder/SearchSuggestionAndProducts";
import SearchResults from "./_builder/SearchResults";

export default function SearchComponent() {
    const recentSearches = [
        "Moisturiser",
        "Shampoo",
        "Cold processed soap",
        "Aloe vera face pack",
    ];

    const recentProducts = products.slice(0, 3);

    const [searchValue, setSearchValue] = useState("");
    const [isResultsOpen, setIsResultsOpen] = useState(false);
    const [resultsQuery, setResultsQuery] = useState(null);

    const handleSubmitSearch = () => {
        const query = searchValue.trim();
        if (!query) return;

        setResultsQuery({ q: query });
        setIsResultsOpen(true);
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchValue(suggestion.label);

        setResultsQuery({
            q: suggestion.query,
            filter_by: suggestion.filter_by,
        });

        setIsResultsOpen(true);
    };

    return (
        <div className={`min-h-screen bg-gray-100 p-5 font-sans ${searchValue ? "bg-white" : "bg-gray-100"}`}>
            {/* Search Bar */}
            <SearchBar
                searchValue={searchValue}
                onChange={setSearchValue}
                onClear={() => setSearchValue("")}
                onSubmit={handleSubmitSearch}
                onBack={isResultsOpen ? () => setIsResultsOpen(false) : undefined}
            />

            {searchValue ? (
                isResultsOpen ? (
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