"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Configure, Index, InstantSearch, useHits, useInstantSearch } from "react-instantsearch";
import {
  setPreviewProductsCache,
  typesenseSearchClient,
  TYPESENSE_INDEXES,
} from "../../../lib/typesenseInstantsearch";
import { addToRecentlyViewed } from "../../../utils/helpers/recentlyViewed";

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
  const [shouldRenderDropdown, setShouldRenderDropdown] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

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
  const hasVisibleResults = visibleSuggestions.length > 0 || visibleProducts.length > 0;

  useEffect(() => {
    let animationFrame;
    let hideTimeout;

    if (hasVisibleResults) {
      setShouldRenderDropdown(true);
      animationFrame = window.requestAnimationFrame(() => {
        setIsDropdownVisible(true);
      });
    } else {
      setIsDropdownVisible(false);
      hideTimeout = window.setTimeout(() => {
        setShouldRenderDropdown(false);
      }, 1000);
    }

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      if (hideTimeout) {
        window.clearTimeout(hideTimeout);
      }
    };
  }, [hasVisibleResults]);

  return (
    <>
      <Configure query={query} hitsPerPage={10} />

      {query ? (
        <Index indexName={TYPESENSE_INDEXES.SEARCH_SUGGESTIONS}>
          <Configure query={query} hitsPerPage={5} />
          <SuggestionsStateBridge onChange={setSuggestions} />
        </Index>
      ) : null}

      {shouldRenderDropdown ? (
        <div
          className={`mt-2 overflow-hidden bg-white transform-gpu transition-all duration-1000 ease-out ${
            isDropdownVisible ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-[0.98] opacity-0"
          }`}
        >
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
                <Link
                  key={product.id}
                  href={`https://nathabit.in/products/${product.url}`}
                  target="_blank"
                  rel="noreferrer"
                  prefetch={false}
                  onClick={() => addToRecentlyViewed(product)}
                  className="py-3 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="relative w-[32px] h-[49px] rounded-[4px] overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image src={product.featured_image} alt={product.title} fill />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5 line-clamp-1">{product.subtitle}</div>
                    <div className="text-sm text-gray-900 font-medium leading-5 line-clamp-2">{product.title}</div>
                  </div>
                </Link>
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
