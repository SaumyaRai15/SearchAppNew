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
    const [resultsQuery, setResultsQuery] = useState("");

    const handleSubmitSearch = () => {
        const query = searchValue.trim();
        if (!query) return;
        setResultsQuery(query);
        setIsResultsOpen(true);
    };

    const handleSuggestionClick = (value) => {
        const nextValue = value.trim();
        setSearchValue(nextValue);
        if (!nextValue) return;
        setResultsQuery(nextValue);
        setIsResultsOpen(true);
    };

    const handleCloseResults = () => {
        setIsResultsOpen(false);
        setResultsQuery("");
        setSearchValue("");
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
                    <SearchResults
                        query={resultsQuery || searchValue}
                        onBack={() => setIsResultsOpen(false)}
                        onClose={handleCloseResults}
                    />
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