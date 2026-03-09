"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Configure, Index, InstantSearch, useHits, useInstantSearch } from "react-instantsearch";
import {
  setPreviewProductsCache,
  typesenseSearchClient,
  TYPESENSE_INDEXES,
} from "../../../lib/typesenseInstantsearch";

function SuggestionsStateBridge({ onChange }) {
  const { items } = useHits();

  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  return null;
}

function SearchSuggestionAndProductsContent({ query, onSuggestionClick, onLoadingChange }) {
  const { items: products, status } = useHits();
  const { status: instantSearchStatus } = useInstantSearch();
  const [suggestions, setSuggestions] = useState([]);
  const [displayedSuggestions, setDisplayedSuggestions] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);

  const isLoading =
    Boolean(query) &&
    (status === "loading" ||
      status === "stalled" ||
      instantSearchStatus === "loading" ||
      instantSearchStatus === "stalled");

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    if (!query || products.length === 0) return;
    setPreviewProductsCache(query, products);
  }, [products, query]);

  useEffect(() => {
    if (isLoading) return;

    setDisplayedSuggestions(suggestions);
    setDisplayedProducts(products);
  }, [isLoading, products, suggestions]);

  const hasDisplayedResults = displayedSuggestions.length > 0 || displayedProducts.length > 0;
  const shouldShowPreviousResults = isLoading && hasDisplayedResults;
  const visibleSuggestions = shouldShowPreviousResults ? displayedSuggestions : suggestions;
  const visibleProducts = shouldShowPreviousResults ? displayedProducts : products;

  return (
    <>
      <Configure query={query} hitsPerPage={10} />

      {query ? (
        <Index indexName={TYPESENSE_INDEXES.SEARCH_SUGGESTIONS}>
          <Configure query={query} hitsPerPage={5} />
          <SuggestionsStateBridge onChange={setSuggestions} />
        </Index>
      ) : null}

      {visibleSuggestions.length > 0 || visibleProducts.length > 0 ? (
        <div className="mt-2 bg-white">
          {visibleSuggestions.length > 0 && (
            <div className="bg-white">
              {visibleSuggestions.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full py-3 flex items-center gap-3 text-left border-b border-gray-100"
                  onClick={() => onSuggestionClick?.(item)}
                >
                  <div className="relative w-[14px] h-[14px]">
                    <Image src="/svg/search-gray.svg" alt="Search" fill unoptimized />
                  </div>

                  <span className="text-sm text-gray-800">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {visibleProducts.length > 0 && (
            <div className="bg-white">
              {visibleProducts.map((product) => (
                <div
                  key={product.id}
                  className="py-3 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="w-[32px] h-[49px] rounded-[4px] overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src={product.featured_image} alt={product.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5 line-clamp-1">{product.subtitle}</div>
                    <div className="text-sm text-gray-900 font-medium leading-5 line-clamp-2">{product.title}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}

export default function SearchSuggestionAndProducts({ searchValue, onSuggestionClick, onLoadingChange }) {
  const query = searchValue.trim();

  if (!query) {
    return null;
  }

  return (
    <InstantSearch searchClient={typesenseSearchClient} indexName={TYPESENSE_INDEXES.PRODUCTS}>
      <SearchSuggestionAndProductsContent
        query={query}
        onSuggestionClick={onSuggestionClick}
        onLoadingChange={onLoadingChange}
      />
    </InstantSearch>
  );
}
