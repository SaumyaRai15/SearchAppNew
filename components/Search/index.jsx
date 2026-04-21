"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBar from "./_builder/SearchBar";
import SearchHomePage from "./_builder/SearchHomePage";
import SearchSuggestionAndProducts from "./_builder/SearchSuggestionAndProducts";
import SearchResults from "./_builder/SearchResults";

/** Updates the address bar without App Router navigation (avoids RSC `search?_rsc=` refetches per keystroke). */
const replaceSearchUrl = (search) => {
  if (typeof window === "undefined") return;

  const nextUrl = search ? `${window.location.pathname}${search}` : window.location.pathname;
  window.history.replaceState(window.history.state, "", nextUrl);
};

/** Display label for a recent-search chip (string legacy or `{ label, ... }`). */
const getRecentSearchLabel = (entry) =>
  typeof entry === "string" ? entry : (entry?.label ?? "");

/**
 * Normalizes localStorage entries: legacy strings become plain text searches;
 * objects may include `sq` (Typesense query, may be "") and `filter_by`.
 */
const normalizeRecentEntry = (entry) => {
  if (typeof entry === "string") {
    const label = entry.trim();
    return { label, sq: label, filter_by: undefined };
  }
  const label = (entry?.label ?? "").trim();
  const hasSq = Object.prototype.hasOwnProperty.call(entry, "sq");
  const sq = hasSq ? String(entry.sq ?? "").trim() : label;
  return { label, sq, filter_by: entry?.filter_by };
};

const SearchIndex = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [recentSearches, setRecentSearches] = useState(null);
  const [recentProducts, setRecentProducts] = useState(null);

  const qDisplay = searchParams.get("q") ?? "";
  const hasSq = searchParams.has("sq");
  /** Typesense search string: explicit `sq` when present (may be empty for filter-only suggestions), else same as `q`. */
  const typesenseQ = hasSq ? (searchParams.get("sq") ?? "") : qDisplay;
  const initialFilterBy = searchParams.get("filter_by") || null;

  const hasResultsContext = Boolean(qDisplay.trim() || initialFilterBy);

  const [searchValue, setSearchValue] = useState(qDisplay);
  const [isResultsOpen, setIsResultsOpen] = useState(hasResultsContext);
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

  const [resultsQuery, setResultsQuery] = useState(() =>
    hasResultsContext
      ? {
          q: typesenseQ,
          filter_by: initialFilterBy || undefined,
          ...(hasSq ? { displayQ: qDisplay } : {}),
        }
      : null,
  );

  const addToRecentSearches = (payload) => {
    const label =
      typeof payload === "string" ? payload.trim() : (payload?.label ?? "").trim();
    if (!label) return;

    const entry =
      typeof payload === "string"
        ? { label, sq: label }
        : {
            label,
            ...(Object.prototype.hasOwnProperty.call(payload, "sq")
              ? { sq: String(payload.sq ?? "") }
              : { sq: label }),
            ...(payload.filter_by ? { filter_by: payload.filter_by } : {}),
          };

    try {
      const stored = JSON.parse(localStorage.getItem("recent_searches") || "[]");
      const filtered = stored.filter((s) => getRecentSearchLabel(s) !== label);
      const updated = [entry, ...filtered].slice(0, 8);
      localStorage.setItem("recent_searches", JSON.stringify(updated));
    } catch {}
  };

  /** Opens results with optional `sq` / `filter_by` (same contract as suggestion clicks). */
  const openStructuredSearch = ({ label, sq, filter_by, persistRecent = true }) => {
    const labelTrim = (label ?? "").trim();
    const sqDefined = sq !== undefined;
    const sqTrim = sqDefined ? String(sq ?? "").trim() : labelTrim;

    if (!labelTrim && !filter_by) return;

    if (persistRecent && labelTrim) {
      addToRecentSearches(
        sqDefined || filter_by ? { label: labelTrim, sq: sqTrim, filter_by } : { label: labelTrim },
      );
    }

    setSearchValue(labelTrim);
    setResultsQuery({
      q: sqTrim,
      filter_by,
      ...(labelTrim !== sqTrim ? { displayQ: labelTrim } : {}),
    });
    setIsResultsOpen(true);

    const params = new URLSearchParams();
    params.set("q", labelTrim);
    if (labelTrim !== sqTrim) {
      params.set("sq", sqTrim);
    }
    if (filter_by) {
      params.set("filter_by", filter_by);
    }
    replaceSearchUrl(`?${params.toString()}`);
  };

  const clearSearchState = () => {
    setSearchValue("");
    setResultsQuery(null);
    setIsResultsOpen(false);
    setIsSearchLoading(false);
    replaceSearchUrl("");
  };

  const openSearchResults = (nextQuery) => {
    const query = nextQuery.trim();
    if (!query) return;
    openStructuredSearch({ label: query });
  };

  const handleSubmitSearch = () => {
    openSearchResults(searchValue);
  };

  const handleRecentSearchClick = (entry) => {
    const { label, sq, filter_by } = normalizeRecentEntry(entry);
    if (!label && !filter_by) return;
    openStructuredSearch({ label, sq, filter_by, persistRecent: true });
  };

  const handleSuggestionClick = (suggestion) => {
    const label = (suggestion.label ?? "").trim();
    const sq = (suggestion.query ?? "").trim();
    openStructuredSearch({
      label,
      sq,
      filter_by: suggestion.filter_by,
      persistRecent: true,
    });
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
          if (!value.trim()) {
            clearSearchState();
          }
        }}
        onClear={clearSearchState}
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
        <SearchHomePage
          recentSearches={recentSearches}
          recentProducts={recentProducts}
          onRecentSearchClick={handleRecentSearchClick}
        />
      )}
    </div>
  );
};

export default SearchIndex;
