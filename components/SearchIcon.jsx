"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SMART_SUGGESTIONS = ["Hair growth serum", "Face wash", "Shampoo", "Lip balm"];

export default function SearchIcon() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const openSearch = (value = "") => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(trimmedValue)}`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    openSearch(query);
  };

  return (
    <div className="w-full max-w-md rounded-[28px] bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 rounded-[28px] border border-gray-200 bg-gray-50 px-4 py-3 transition focus-within:border-gray-900 focus-within:bg-white">
          <span className="text-lg" aria-hidden="true">
            🔍
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for hair oil, cleansers, lip balm..."
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            aria-label="Search products"
          />
          <button
            type="submit"
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
