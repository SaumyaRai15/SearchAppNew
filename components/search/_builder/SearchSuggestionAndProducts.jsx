import Image from "next/image";
import { SEARCH_SUGGESTIONS } from "../../../constants/search-suggestions";
import { products } from "../../../constants/products";

export default function SearchSuggestionAndProducts({
    searchValue,
    onSuggestionClick,
}) {
    const query = searchValue.trim().toLowerCase();

    const filteredSuggestions = SEARCH_SUGGESTIONS.filter((item) =>
        item.title.toLowerCase().includes(query)
    ).slice(0, 5);

    const filteredProducts = products
        .filter((product) => {
            const title = product.title?.toLowerCase() ?? "";
            const subtitle = product.subtitle?.toLowerCase() ?? "";
            return title.includes(query) || subtitle.includes(query);
        })
        .slice(0, 8);

    const highlightMatch = (text) => {
        const lower = text.toLowerCase();
        const index = lower.indexOf(query);

        if (index === -1 || !query) {
            return <span>{text}</span>;
        }

        const before = text.slice(0, index);
        const match = text.slice(index, index + query.length);
        const after = text.slice(index + query.length);

        return (
            <span>
                {before}
                <span className="font-semibold">{match}</span>
                {after}
            </span>
        );
    };

    return (
        <div className="mt-2">
            {/* Suggestions list */}
            {filteredSuggestions.length > 0 && (
                <div className="bg-white">
                    {filteredSuggestions.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className="w-full py-3 flex items-center gap-3 text-left border-b border-gray-100"
                            onClick={() => onSuggestionClick?.(item.title)}
                        >
                            <span className="text-gray-400 text-base flex items-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    x="0"
                                    y="0"
                                    enableBackground="new 0 0 23 23"
                                    version="1.1"
                                    viewBox="0 0 24 24"
                                    xmlSpace="preserve"
                                    height="20"
                                    width="20"
                                    className="text-gray-500"
                                    fill="currentColor"
                                >
                                    <title id="search-icon">search-icon</title>
                                    <path d="M16.4 15.2l3.6 3.6-1.2 1.2-3.6-3.6c-1.3 1-2.9 1.7-4.7 1.7-4.2 0-7.6-3.4-7.6-7.6S6.4 3 10.5 3s7.6 3.4 7.6 7.6c0 1.7-.6 3.4-1.7 4.6zm-1.7-.6c1-1.1 1.7-2.5 1.7-4.1 0-3.2-2.6-5.9-5.9-5.9s-5.9 2.6-5.9 5.9 2.6 5.9 5.9 5.9c1.6 0 3-.6 4.1-1.7l.1-.1z"></path>
                                    <path d="M25.2-11.9c.8-.6 1.4-1.5 1.7-2.5s.3-2.1-.1-3-1-1.8-1.8-2.4c-.8-.6-1.9-.9-2.9-.9s-2.1.3-2.9.9c-.8.6-1.5 1.5-1.8 2.4s-.4 2-.1 3c.3 1 .9 1.9 1.7 2.5-1.4.6-2.6 1.5-3.5 2.7-.9 1.2-1.5 2.6-1.7 4.1v.3c0 .1.1.2.2.3.1.2.3.3.6.3.2 0 .4 0 .6-.2.2-.1.3-.3.3-.6.2-1.6 1-3.1 2.2-4.2 1.2-1.1 2.8-1.7 4.4-1.7 1.6 0 3.2.6 4.4 1.7 1.2 1.1 2 2.6 2.2 4.2 0 .2.1.4.3.5.2.1.4.2.6.2h.1c.2 0 .4-.1.6-.3.1-.2.2-.4.2-.6-.2-1.5-.7-2.9-1.7-4.1-1-1.1-2.2-2-3.6-2.6zm-3.1-.6c-.7 0-1.3-.2-1.9-.6-.5-.4-1-.9-1.2-1.5-.3-.6-.3-1.3-.2-1.9.1-.6.4-1.2.9-1.7s1.1-.8 1.7-.9 1.3-.1 1.9.2c.6.3 1.1.7 1.5 1.2.4.5.6 1.2.6 1.9 0 .9-.4 1.7-1 2.4-.6.6-1.4.9-2.3.9z"></path>
                                </svg>
                            </span>
                            <span className="text-sm text-gray-800">
                                {highlightMatch(item.title)}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Products list */}
            {filteredProducts.length > 0 && (
                <div className="bg-white">
                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="py-3 flex items-center gap-3 border-b border-gray-100  last:border-b-0"
                        >
                            <div className="w-[32px] h-[49px] rounded-[4px] overflow-hidden flex-shrink-0 bg-gray-100">
                                <Image
                                    src={product.featuredImage}
                                    alt={product.title}
                                    width={32}
                                    height={49}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-500 mb-0.5 line-clamp-1">
                                    {product.subtitle}
                                </div>
                                <div className="text-sm text-gray-900 font-medium leading-5 line-clamp-2">
                                    {highlightMatch(product.title)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

