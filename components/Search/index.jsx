"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBar from "./_builder/SearchBar";
import SearchHomePage from "./_builder/SearchHomePage";
import SearchSuggestionAndProducts from "./_builder/SearchSuggestionAndProducts";
import SearchResults from "./_builder/SearchResults";

const replaceSearchUrl = (search) => {
  if (typeof window === "undefined") return;

  const nextUrl = search ? `${window.location.pathname}${search}` : window.location.pathname;
  window.history.replaceState(window.history.state, "", nextUrl);
};

const SearchIndex = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [recentSearches, setRecentSearches] = useState(null);
  const [recentProducts, setRecentProducts] = useState(null);

  const initialQ = searchParams.get("q") || "";
  const initialFilterBy = searchParams.get("filter_by") || null;

  const [searchValue, setSearchValue] = useState(initialQ);
  const [isResultsOpen, setIsResultsOpen] = useState(!!initialQ);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const refreshHomePageData = () => {
    try {
      const searches = JSON.parse(localStorage.getItem("recent_searches") || "[]");
      setRecentSearches(searches);
    } catch {
      setRecentSearches([]);
    }
    try {
      const products = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
      setRecentProducts(products);
    } catch {
      setRecentProducts([]);
    }
  };

  useEffect(() => {
    if (!searchValue || !isResultsOpen) {
      refreshHomePageData();
    }
  }, [searchValue, isResultsOpen]);

  const addToRecentSearches = (label) => {
    try {
      const stored = JSON.parse(localStorage.getItem("recent_searches") || "[]");
      const filtered = stored.filter((s) => s !== label);
      const updated = [label, ...filtered].slice(0, 8);
      localStorage.setItem("recent_searches", JSON.stringify(updated));
    } catch {}
  };

  const [resultsQuery, setResultsQuery] = useState(
    initialQ ? { q: initialQ, filter_by: initialFilterBy || undefined } : null,
  );

  const handleSubmitSearch = () => {
    const query = searchValue.trim();
    if (!query) return;

    addToRecentSearches(query);
    setResultsQuery({ q: query });
    setIsResultsOpen(true);
    replaceSearchUrl(`?q=${encodeURIComponent(query)}`);
  };

  const handleSuggestionClick = (suggestion) => {
    addToRecentSearches(suggestion.label);
    setSearchValue(suggestion.label);
    setResultsQuery({ q: suggestion.query, filter_by: suggestion.filter_by });
    setIsResultsOpen(true);

    const params = new URLSearchParams();
    params.set("q", suggestion.query);
    if (suggestion.filter_by) params.set("filter_by", suggestion.filter_by);
    replaceSearchUrl(`?${params.toString()}`);
  };

  const handleBack = () => {
    if (isResultsOpen) {
      // Step back from results to suggestions for the same query
      setIsResultsOpen(false);
      return;
    }

    if (searchValue) {
      // Step back from suggestions to home
      setSearchValue("");
      setIsResultsOpen(false);
      replaceSearchUrl("");
      return;
    }

    // Step back from search home to app home page
    router.push("/");
  };

  return (
    <div className={`min-h-screen p-5 font-satoshi ${searchValue ? "bg-white" : "bg-gray-100"}`}>
      <SearchBar
        searchValue={searchValue}
        onChange={(value) => {
          setSearchValue(value);
          if (!value) {
            setIsSearchLoading(false);
          }
        }}
        onClear={() => {
          setSearchValue("");
          setIsResultsOpen(false);
          setIsSearchLoading(false);
          replaceSearchUrl("");
        }}
        onSubmit={handleSubmitSearch}
        onBack={handleBack}
        isResultsOpen={isResultsOpen}
        isLoading={isSearchLoading}
      />

      {searchValue ? (
        isResultsOpen ? (
          <SearchResults query={resultsQuery} />
        ) : (
          <SearchSuggestionAndProducts
            searchValue={searchValue}
            onSuggestionClick={handleSuggestionClick}
            onLoadingChange={setIsSearchLoading}
          />
        )
      ) : (
        <SearchHomePage recentSearches={recentSearches} recentProducts={recentProducts} />
      )}
    </div>
  );
};

export default SearchIndex;
