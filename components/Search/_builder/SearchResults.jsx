"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Configure,
  Index,
  InstantSearch,
  useHits,
  useInstantSearch,
  useRefinementList,
  useSearchBox,
  useSortBy,
} from "react-instantsearch";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "../../../store/useCartStore";
import {
  getPreviewProductsCache,
  prefersComboResults,
  typesenseSearchClient,
  TYPESENSE_INDEXES,
} from "../../../lib/typesenseInstantsearch";
import { formatCategoryLabel } from "../../../constants/categoryUtils";
import { addToRecentlyViewed } from "../../../utils/helpers/recentlyViewed";
import SortAndFilterBar from "./SortAndFilterBar";
import { SearchResultsSkeleton } from "../../Loaders/SearchResultsSkeleton";
import SortSheet from "./SortSheet";
import FilterSheet from "./FilterSheet";
import VariantSheet from "./VariantSheet";

const SORT_OPTIONS = [
  {
    id: "PRICE_LOW_HIGH",
    label: "Low to High",
    productIndexName: TYPESENSE_INDEXES.PRODUCTS_PRICE_LOW_HIGH,
    comboIndexName: TYPESENSE_INDEXES.COMBO_PRODUCTS_PRICE_LOW_HIGH,
  },
  {
    id: "PRICE_HIGH_LOW",
    label: "High to low",
    productIndexName: TYPESENSE_INDEXES.PRODUCTS_PRICE_HIGH_LOW,
    comboIndexName: TYPESENSE_INDEXES.COMBO_PRODUCTS_PRICE_HIGH_LOW,
  },
];

const formatPrice = (n) => (n != null && !Number.isNaN(n) ? `${Math.round(n)}` : null);

const getDiscountPercent = (price, compareAtPrice) => {
  if (price == null || compareAtPrice == null || compareAtPrice <= 0 || price >= compareAtPrice) return null;

  return Math.round((1 - price / compareAtPrice) * 100);
};

const getDisplayRating = (rating) => {
  if (rating == null) return 5;

  const numericRating = Number(rating);
  if (Number.isNaN(numericRating)) return 5;
  return Math.min(5, Math.max(0, numericRating));
};

const StarRating = ({ rating }) => {
  const displayRating = getDisplayRating(rating);
  const filledStars = Math.round(displayRating);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>
          {i <= filledStars ? (
            <Image src="/svg/star-yellow.svg" width={11} height={11} alt="" aria-hidden />
          ) : (
            <Image src="/svg/star-white.svg" width={12} height={12} alt="" aria-hidden />
          )}
        </span>
      ))}
    </div>
  );
};

const replaceSearchUrl = (search) => {
  if (typeof window === "undefined") return;

  const nextUrl = search ? `${window.location.pathname}${search}` : window.location.pathname;
  window.history.replaceState(window.history.state, "", nextUrl);
};

function QueryAndSortSync({ queryText, sortBy }) {
  const { query, refine: refineQuery } = useSearchBox();
  const { refine: refineSort, currentRefinement } = useSortBy({
    items: [
      { label: "Relevance", value: TYPESENSE_INDEXES.PRODUCTS },
      ...SORT_OPTIONS.map((option) => ({
        label: option.label,
        value: option.productIndexName,
      })),
    ],
  });

  useEffect(() => {
    if (query !== queryText) {
      refineQuery(queryText);
    }
  }, [query, queryText, refineQuery]);

  useEffect(() => {
    const nextIndexName =
      SORT_OPTIONS.find((option) => option.id === sortBy)?.productIndexName ?? TYPESENSE_INDEXES.PRODUCTS;

    if (currentRefinement !== nextIndexName) {
      refineSort(nextIndexName);
    }
  }, [currentRefinement, refineSort, sortBy]);

  return null;
}

function FacetCollector({ onUpdate }) {
  const { items: categoryItems } = useRefinementList({
    attribute: "categories",
    operator: "or",
    limit: 200,
  });
  const { items: collectionItems } = useRefinementList({
    attribute: "collections",
    operator: "or",
    limit: 200,
  });

  useEffect(() => {
    onUpdate({
      categories: categoryItems.map(({ value, count }) => ({ value, count })),
      collections: collectionItems.map(({ value, count }) => ({ value, count })),
    });
  }, [categoryItems, collectionItems, onUpdate]);

  return null;
}

function ComboResultsCollector({ onUpdate }) {
  const { items } = useHits();
  const { status } = useInstantSearch();

  useEffect(() => {
    onUpdate({ items, status });
  }, [items, onUpdate, status]);

  return null;
}

function mergeFacetItems(...facetGroups) {
  const mergedCounts = new Map();

  facetGroups.flat().forEach(({ value, count }) => {
    mergedCounts.set(value, (mergedCounts.get(value) || 0) + count);
  });

  return Array.from(mergedCounts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function ResultsList({ sectionTitle, items, quantities, onOpenVariantSheet, emptyMessage, showEmptyState }) {
  if (items.length === 0 && !showEmptyState) {
    return null;
  }

  return (
    <>
      {sectionTitle ? <div className="px-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#7B818C]">{sectionTitle}</div> : null}
      {items.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-500">{emptyMessage}</div>
      ) : (
        items.map((product) => {
          const hasVariants = product.variants?.length > 0;
          const displayRating = getDisplayRating(product.rating);
          const firstVariant = product.variants?.[0]?.attributes;
          const totalVariantQty = hasVariants
            ? product.variants.reduce((sum, v) => {
                const vid = v.attributes?.shopifyVariantId;
                return sum + (vid ? (quantities[vid] ?? 0) : 0);
              }, 0)
            : 0;

          return (
            <div key={product.id} className="flex gap-3 bg-white py-3 border-b border-gray-100">
              <Link
                href={`https://nathabit.in/products/${product.url}`}
                prefetch={false}
                target="_blank"
                onClick={() => addToRecentlyViewed(product)}
              >
                <div className="relative w-[72px] h-[111px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image src={product.featured_image} alt={product.short_code || product.title} fill unoptimized loading="eager" />
                </div>
              </Link>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex justify-between gap-3">
                  <div className="flex flex-col gap-[2px]">
                    <div className="text-[14px] text-[#292E2C] leading-[20px]">{product.short_code || product.title}</div>

                    <div className="text-[12px] text-[#7B818C] leading-[16px]">{product.subtitle}</div>

                    <div className="flex gap-x-2 mt-[6px]">
                      <p className="text-[12px] leading-[16px] text-[#676B73] bg-[#F5F7FA] px-[4px]">
                        {firstVariant?.measurementValue && firstVariant?.measurementUnit
                          ? `${firstVariant.measurementValue}${firstVariant.measurementUnit}`
                          : "1 unit"}
                      </p>
                      <div className="flex gap-x-2 bg-[#F5F7FA] px-[4px] rounded-[2px] w-fit">
                        <StarRating rating={product.rating} />
                        <p className="text-[12px] leading-[16px] text-[#676B73]">({displayRating})</p>
                      </div>
                    </div>
                  </div>

                  <div className={`flex flex-col w-[72px] h-[58px] rounded-[8px] items-center flex-shrink-0 bg-[#FCF8F7]`}>
                    {hasVariants && (
                      <>
                        {totalVariantQty === 0 ? (
                          <button
                            type="button"
                            onClick={() => onOpenVariantSheet(product)}
                            className="w-[72px] h-[40px] p-[4px] rounded-[8px] border-[#F0C3B4] border bg-[#FCF1ED] text-[14px] leading-[20px] font-black text-[#C4512B]"
                          >
                            ADD
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenVariantSheet(product)}
                            className="flex items-center justify-around w-[72px] h-[40px] p-[4px] rounded-[8px] border-[#C4512B] border text-[14px] leading-[20px] font-black bg-white text-[#C4512B]"
                          >
                            <span>{totalVariantQty}</span>
                            <Image
                              src="/svg/chevron-down-orange.svg"
                              width={7}
                              height={4}
                              alt=""
                              aria-hidden
                              className="absolute right-[12px]"
                            />
                          </button>
                        )}
                        <p className="text-[10px]  leading-[12px] rounded-br-[8p] px-[8px] pt-[2px] pb-[4px] rounded-bl-[8px] font-medium bg-[#FCF8F7] text-[#C4512B]">
                          {product.variants.length} {product.variants.length > 1 ? "Options" : "Option"}{" "}
                        </p>
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
                      <p className="text-[10px] text-[#9DA6B2]">
                        ₹
                        <span className="text-[12px] leading-[10px]  line-through">{formatPrice(product.compare_at_price)}</span>
                      </p>
                      {getDiscountPercent(product.price, product.compare_at_price) != null && (
                        <span className="text-[12px] leading-[20px] font-medium text-[#D13F44]">
                          -{getDiscountPercent(product.price, product.compare_at_price)}%
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}

function ComboResultsSection({ combos, status, quantities, onOpenVariantSheet, shouldRender = true }) {
  if (!shouldRender) {
    return null;
  }

  return (
    <div className="mt-6">
      <ResultsList
        sectionTitle="Combos"
        items={combos}
        quantities={quantities}
        onOpenVariantSheet={onOpenVariantSheet}
        emptyMessage="No combos found for this search."
        showEmptyState={status === "idle"}
      />
    </div>
  );
}

const SearchResultsContent = ({ query }) => {
  // Support both string and suggestion object
  const searchText = typeof query === "string" ? query.trim() : query?.q?.trim() || "";
  const baseFilterBy = typeof query === "string" ? undefined : query?.filter_by || undefined;
  const searchParams = useSearchParams();
  const { items: products } = useHits();
  const { status, results } = useInstantSearch();
  const isComboFocusedQuery = useMemo(() => prefersComboResults(searchText), [searchText]);
  const productHitsPerPage = isComboFocusedQuery ? 2 : 8;
  const comboHitsPerPage = isComboFocusedQuery ? 8 : 2;

  // Initialise all filter/sort state from URL so a direct link loads correctly
  const [sortBy, setSortBy] = useState(() => searchParams.get("sort") || "");
  const selectedSortOption = SORT_OPTIONS.find((option) => option.id === sortBy);
  const comboIndexName = selectedSortOption?.comboIndexName ?? TYPESENSE_INDEXES.COMBO_PRODUCTS;
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
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [variantSheetProduct, setVariantSheetProduct] = useState(null);
  const [productFacetData, setProductFacetData] = useState({ categories: [], collections: [] });
  const [comboFacetData, setComboFacetData] = useState({ categories: [], collections: [] });
  const [comboResultsData, setComboResultsData] = useState({ items: [], status: "idle" });
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [cachedPreviewProducts, setCachedPreviewProducts] = useState(() => getPreviewProductsCache(searchText));
  const cartItems = useCartStore((state) => state.cartItems);
  const isLoadingByVariant = useCartStore((state) => state.isLoadingByVariant);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const quantities = useMemo(
    () => Object.fromEntries(Object.entries(cartItems || {}).map(([variantId, item]) => [variantId, item?.qty || 0])),
    [cartItems],
  );

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
  const facetCategories = useMemo(
    () => mergeFacetItems(productFacetData.categories ?? [], comboFacetData.categories ?? []),
    [comboFacetData.categories, productFacetData.categories],
  );
  const facetCollections = useMemo(
    () => mergeFacetItems(productFacetData.collections ?? [], comboFacetData.collections ?? []),
    [comboFacetData.collections, productFacetData.collections],
  );
  const comboResults = comboResultsData.items ?? [];
  const comboResultsStatus = comboResultsData.status;
  const isSearchLoading = status === "loading" || status === "stalled";

  // Reset filters (but not sort) whenever the search query changes
  const prevSearchText = useRef(searchText);
  useEffect(() => {
    if (prevSearchText.current !== searchText) {
      prevSearchText.current = searchText;
      setSelectedCategories([]);
      setSelectedCollections([]);
      setPriceRange({ min: "", max: "" });
      setCachedPreviewProducts(getPreviewProductsCache(searchText));
      setComboResultsData({ items: [], status: "loading" });
      setHasLoadedOnce(false);
    }
  }, [searchText]);

  useEffect(() => {
    if (!results || results.__isArtificial || status !== "idle") return;
    setHasLoadedOnce(true);
  }, [results, status]);

  useEffect(() => {
    if (products.length === 0) return;
    setCachedPreviewProducts(products);
  }, [products]);

  // Keep URL params in sync without triggering App Router navigation.
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

    replaceSearchUrl(params.toString() ? `?${params.toString()}` : "");
  }, [baseFilterBy, priceRange, searchText, selectedCategories, selectedCollections, sortBy]);

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

  const filteredCachedPreviewProducts = useMemo(() => {
    if (priceRange.min === "" && priceRange.max === "") return cachedPreviewProducts;

    const min = priceRange.min !== "" ? Number(priceRange.min) : null;
    const max = priceRange.max !== "" ? Number(priceRange.max) : null;

    return cachedPreviewProducts.filter((product) => {
      const price = product.price ?? 0;
      if (min != null && price < min) return false;
      if (max != null && price > max) return false;
      return true;
    });
  }, [cachedPreviewProducts, priceRange]);

  const displayProducts =
    !hasLoadedOnce && filteredCachedPreviewProducts.length > 0 ? filteredCachedPreviewProducts : filteredProducts;
  const shouldShowSkeleton = !hasLoadedOnce && isSearchLoading && filteredCachedPreviewProducts.length === 0;

  const handleIncrease = async (id) => {
    await addToCart(id);
  };

  const handleDecrease = async (id) => {
    await removeFromCart(id, {}, false, false, 1);
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

  return (
    <div className="relative max-h-full bg-white pb-[48px]">
      <QueryAndSortSync queryText={searchText} sortBy={sortBy} />

      <Configure filters={combinedFilterBy} hitsPerPage={productHitsPerPage} maxValuesPerFacet={200} />

      <Index indexName={TYPESENSE_INDEXES.PRODUCTS}>
        <Configure filters={baseFilterBy} hitsPerPage={1} maxValuesPerFacet={200} />
        <FacetCollector onUpdate={setProductFacetData} />
      </Index>

      <Index indexName={TYPESENSE_INDEXES.COMBO_PRODUCTS}>
        <Configure filters={baseFilterBy} hitsPerPage={1} maxValuesPerFacet={200} />
        <FacetCollector onUpdate={setComboFacetData} />
      </Index>

      <Index indexName={comboIndexName}>
        <Configure filters={combinedFilterBy} hitsPerPage={comboHitsPerPage} />
        <ComboResultsCollector onUpdate={setComboResultsData} />
      </Index>

      {shouldShowSkeleton ? (
        <div className="mt-2 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SearchResultsSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div
            className={`mt-2 space-y-3 transition-opacity duration-150 ${isSearchLoading ? "opacity-50" : "opacity-100"}`}
          >
            {hasActiveFiltersOrSort && (
              <div className="px-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    {sortBy && (
                      <button
                        type="button"
                        onClick={() => setSortBy("")}
                        className="h-[32px] inline-flex items-center gap-[8px] px-[8px] py-[4px] rounded-[8px] border border-[#F0C3B4]  text-xs text-[#C4512B]"
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
                        className="h-[32px] inline-flex items-center gap-[8px] px-[8px] py-[4px] rounded-[8px] border border-[#F0C3B4]  text-xs text-[#C4512B]"
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
                        className="h-[32px] inline-flex items-center gap-[8px] px-[8px] py-[4px] rounded-[8px] border border-[#F0C3B4]  text-xs text-[#C4512B]"
                      >
                        {formatCategoryLabel(collection)}
                        <span aria-hidden>×</span>
                      </button>
                    ))}

                    {priceRangeLabel && (
                      <button
                        type="button"
                        onClick={() => setPriceRange({ min: "", max: "" })}
                        className="h-[32px] inline-flex items-center gap-[8px] px-[8px] py-[4px] rounded-[8px] border border-[#F0C3B4]  text-xs text-[#C4512B]"
                      >
                        {priceRangeLabel}
                        <span aria-hidden>×</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[12px] leading-[16px] font-bold text-[#C4512B] flex-shrink-0"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}

            {isComboFocusedQuery ? (
              <>
                <ComboResultsSection
                  combos={comboResults}
                  status={comboResultsStatus}
                  quantities={quantities}
                  onOpenVariantSheet={setVariantSheetProduct}
                  shouldRender={!shouldShowSkeleton}
                />

                <ResultsList
                  sectionTitle="Products"
                  items={displayProducts}
                  quantities={quantities}
                  onOpenVariantSheet={setVariantSheetProduct}
                  emptyMessage="No products found for this search."
                  showEmptyState={hasLoadedOnce && filteredProducts.length === 0}
                />
              </>
            ) : (
              <>
                <ResultsList
                  sectionTitle="Products"
                  items={displayProducts}
                  quantities={quantities}
                  onOpenVariantSheet={setVariantSheetProduct}
                  emptyMessage="No products found for this search."
                  showEmptyState={hasLoadedOnce && filteredProducts.length === 0}
                />

                <ComboResultsSection
                  combos={comboResults}
                  status={comboResultsStatus}
                  quantities={quantities}
                  onOpenVariantSheet={setVariantSheetProduct}
                  shouldRender={!shouldShowSkeleton}
                />
              </>
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
            isLoadingByVariant={isLoadingByVariant}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
          />
        </>
      )}
    </div>
  );
};

const SearchResults = ({ query }) => {
  const searchText = typeof query === "string" ? query.trim() : query?.q?.trim() || "";
  return (
    <InstantSearch
      searchClient={typesenseSearchClient}
      indexName={TYPESENSE_INDEXES.PRODUCTS}
      initialUiState={{
        [TYPESENSE_INDEXES.PRODUCTS]: { query: searchText },
        [TYPESENSE_INDEXES.COMBO_PRODUCTS]: { query: searchText },
      }}
    >
      <SearchResultsContent query={query} />
    </InstantSearch>
  );
};

export default SearchResults;
