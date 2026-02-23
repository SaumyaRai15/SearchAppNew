import Image from "next/image";

export default function SearchHomePage({ recentSearches, recentProducts }) {
    return (
        <>
            {/* Recent Searches */}
            <h4 className="mb-3 font-medium">Recent searches</h4>

            <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                    <div
                        key={item}
                        className="bg-white px-3 py-2 rounded-xl text-sm text-gray-700"
                    >
                        {item}
                    </div>
                ))}
            </div>

            {/* Recently Viewed */}
            <h4 className="mt-8 mb-3 font-medium">Recently viewed</h4>

            <div className="flex gap-4 overflow-x-auto pb-3">
                {recentProducts.map((product) => (
                    <div key={product.id} className="w-[150px] flex-shrink-0">
                        <Image
                            src={product.featuredImage}
                            alt={product.title}
                            width={150}
                            height={180}
                            className="rounded-2xl object-cover mb-2"
                        />

                        <div className="text-sm font-medium leading-5 mb-1 line-clamp-2">
                            {product.title}
                        </div>

                        <div className="text-xs text-gray-500 mb-1">
                            {product.subtitle}
                        </div>

                        <div className="text-sm font-semibold">
                            ₹{product.sp}
                            <span className="line-through text-gray-400 text-xs ml-2">
                                ₹{product.mrp}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Explore */}
            <h4 className="mt-8 mb-3 font-medium">Explore</h4>

            <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-24 bg-gray-200 rounded-2xl"
                    />
                ))}
            </div>
        </>
    );
}
