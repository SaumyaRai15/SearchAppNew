export async function searchProducts(query) {
  if (!query) return [];

  const params = new URLSearchParams({
    q: query,
    query_by: "title,subtitle,concerns,categories,collections",
    query_by_weights: "25,22,15,6,1",
    per_page: "50",
    sort_by: "_text_match:desc",
  });

  const res = await fetch(
    `https://search.api.nathabit.in/collections/products/documents/search?${params.toString()}`,
    {
      headers: {
        "X-TYPESENSE-API-KEY": process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY,
      },
    },
  );

  const data = await res.json();
  return data.hits?.map((hit) => hit.document) || [];
}

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
