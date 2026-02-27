const TYPESENSE_SEARCH_URL = "https://search.api.nathabit.in/collections/products/documents/search";

const TYPESENSE_SEARCH_HEADERS = {
  "X-TYPESENSE-API-KEY": process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY,
};

export async function searchProducts(query, filterBy, sortBy) {
  if (!query) return { products: [], facets: { categories: [], collections: [] } };

  const sortParam =
    sortBy === "PRICE_LOW_HIGH" ? "price:asc" : sortBy === "PRICE_HIGH_LOW" ? "price:desc" : "_text_match:desc";

  const params = new URLSearchParams({
    q: query,
    query_by: "title,subtitle,concerns,categories,collections",
    query_by_weights: "25,22,15,6,1",
    per_page: "10",
    sort_by: sortParam,
    // facet_counts in the response always reflect ALL matching docs, not just per_page
    facet_by: "categories,collections",
    max_facet_values: "200",
  });

  if (filterBy) {
    params.append("filter_by", filterBy);
  }

  const res = await fetch(`${TYPESENSE_SEARCH_URL}?${params.toString()}`, {
    headers: TYPESENSE_SEARCH_HEADERS,
  });

  const data = await res.json();

  const facetCounts = Array.isArray(data.facet_counts) ? data.facet_counts : [];
  const categoriesFacet = facetCounts.find((f) => f.field_name === "categories") || {};
  const collectionsFacet = facetCounts.find((f) => f.field_name === "collections") || {};

  return {
    products: data.hits?.map((hit) => hit.document) || [],
    facets: {
      categories: categoriesFacet.counts || [],
      collections: collectionsFacet.counts || [],
    },
  };
}

// export async function fetchFacets() {
//   const params = new URLSearchParams({
//     q: "*",
//     query_by: "title,subtitle,concerns,categories,collections",
//     per_page: "1",
//     facet_by: "categories,collections",
//     max_facet_values: "200",
//   });

//   const res = await fetch(`${TYPESENSE_SEARCH_URL}?${params.toString()}`, {
//     headers: TYPESENSE_SEARCH_HEADERS,
//   });

//   const data = await res.json();

//   const facetCounts = Array.isArray(data.facet_counts) ? data.facet_counts : [];

//   const categoriesFacet = facetCounts.find((f) => f.field_name === "categories") || {};
//   const collectionsFacet = facetCounts.find((f) => f.field_name === "collections") || {};

//   return {
//     categories: categoriesFacet.counts || [],
//     collections: collectionsFacet.counts || [],
//   };
// }

export async function fetchSuggestions(query) {
  if (!query || query.length < 2) return [];

  const res = await fetch(
    `https://search.api.nathabit.in/collections/search_suggestions/documents/search?q=${query}&query_by=query,label&sort_by=priority:desc`,
    {
      headers: {
        "X-TYPESENSE-API-KEY": process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY,
      },
    },
  );

  const data = await res.json();
  return data.hits?.map((hit) => hit.document) || [];
}
