const MAX_RECENTLY_VIEWED = 5;

export const addToRecentlyViewed = (product) => {
  if (typeof window === "undefined") return;

  const stored = JSON.parse(localStorage.getItem("recently_viewed") || "[]");
  const filtered = stored.filter((p) => p.id !== product.id);
  const entry = {
    id: product.id,
    title: product.title,
    subtitle: product.subtitle,
    featured_image: product.featured_image,
    url: product.url,
    price: product.price,
    compare_at_price: product.compare_at_price,
  };
  const updated = [entry, ...filtered].slice(0, MAX_RECENTLY_VIEWED);

  localStorage.setItem("recently_viewed", JSON.stringify(updated));
};
