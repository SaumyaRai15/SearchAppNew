import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";

export const TYPESENSE_INDEXES = {
  PRODUCTS: "products",
  PRODUCTS_PRICE_LOW_HIGH: "products/sort/price:asc",
  PRODUCTS_PRICE_HIGH_LOW: "products/sort/price:desc",
  SEARCH_SUGGESTIONS: "search_suggestions",
};

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY,
    nodes: [
      {
        host: "search.api.nathabit.in",
        port: "443",
        protocol: "https",
      },
    ],
    cacheSearchResultsForSeconds: 5 * 60,
  },
  collectionSpecificSearchParameters: {
    products: {
      query_by: "title,subtitle,concerns,categories,collections,ingredients,additional_ingredients,",
      query_by_weights: "25,22,15,6,1,100,101",
      max_facet_values: 200,
      num_typos: 2,
      typo_tokens_threshold: 1,
      min_len_1typo: 3,
      min_len_2typo: 6,
    },
    search_suggestions: {
      query_by: "query,label",
      sort_by: "priority:desc",
      num_typos: 1,
      typo_tokens_threshold: 1,
      min_len_1typo: 3,
    },
  },
});

const baseSearchClient = typesenseInstantsearchAdapter.searchClient;
const pendingSearches = new Map();
const cachedResponses = new Map();
const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000;
const previewProductsCache = new Map();

export const typesenseSearchClient = {
  ...baseSearchClient,
  search(requests) {
    const requestKey = JSON.stringify(requests);
    const cachedEntry = cachedResponses.get(requestKey);

    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      return Promise.resolve(cachedEntry.response);
    }

    if (cachedEntry) {
      cachedResponses.delete(requestKey);
    }

    if (pendingSearches.has(requestKey)) {
      return pendingSearches.get(requestKey);
    }

    const pendingRequest = baseSearchClient
      .search(requests)
      .then((response) => {
        cachedResponses.set(requestKey, {
          response,
          expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
        });

        return response;
      })
      .finally(() => {
        pendingSearches.delete(requestKey);
      });

    pendingSearches.set(requestKey, pendingRequest);
    return pendingRequest;
  },
};

export function setPreviewProductsCache(query, products) {
  if (!query) return;

  previewProductsCache.set(query, {
    products,
    expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
  });
}

export function getPreviewProductsCache(query) {
  if (!query) return [];

  const cachedEntry = previewProductsCache.get(query);

  if (!cachedEntry) {
    return [];
  }

  if (cachedEntry.expiresAt <= Date.now()) {
    previewProductsCache.delete(query);
    return [];
  }

  return cachedEntry.products;
}
