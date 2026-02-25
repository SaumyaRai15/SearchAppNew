import Image from "next/image";

export default function SearchHomePage({ recentSearches, recentProducts }) {
    return (
        <>
            {/* Recent Searches */}
            <p
                className="mb-3 text-[12px] leading-4 tracking-[0.23px]"
            >
                Recent searches
            </p>

            <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                    <div
                        key={item}
                        className="bg-white px-3 text-[#4B4D52] py-2 rounded-[4px] leading-4 text-[14px] tracking-[0.23px]"
                    >
                        {item}
                    </div>
                ))}
            </div>

            {/* Recently Viewed */}
            <h4 className="mt-8 mb-3 leading-4 text-[12px] tracking-[0.23px]">Recently viewed</h4>

            <div className="flex gap-4 overflow-x-auto h-[249px]">
                {recentProducts.map((product) => (
                    <div key={product.id} className="w-[112px] h-[249px] flex-shrink-0">
                        <div className="relative w-[112px] h-[149px] mb-2">
                            <Image
                                src={product.featuredImage}
                                alt={product.title}
                                fill
                                sizes="112px"
                                className="rounded-2xl object-cover"
                            />
                        </div>

                        <div className="text-[14px] leading-[20px] mb-1 line-clamp-2">
                            {product.title}
                        </div>

                        <div className="text-[12px] leading-[16px] text-[#7B818C] mb-1 truncate">
                            {product.subtitle}
                        </div>

                        <div className="text-[16px] leading-[20px]">
                            ₹{product.sp}
                            <span className="line-through leading-[10px] text-[#9DA6B2] text-[12px] ml-[3px]">
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
                        className="h-[88px] w-[100px] bg-gray-200 rounded-[4px]"
                    />
                ))}
            </div>
        </>
    );
}
