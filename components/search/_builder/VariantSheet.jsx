import Image from "next/image";
import { useRef } from "react";

const formatPrice = (n) => (n != null && !Number.isNaN(n) ? `${Math.round(n)}` : null);

const getDiscountPercent = (price, compareAtPrice) => {
    if (price == null || compareAtPrice == null || compareAtPrice <= 0 || price >= compareAtPrice) return null;
    return Math.round((1 - price / compareAtPrice) * 100);
};

export default function VariantSheet({ isOpen, onClose, product, quantities, onIncrease, onDecrease }) {
    const lastProductRef = useRef(null);
    if (product) lastProductRef.current = product;
    const displayProduct = isOpen ? product : lastProductRef.current;
    const variants = displayProduct?.variants ?? [];

    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-end transition-all duration-300 ease-in-out ${isOpen
                ? "backdrop-blur-[8px] bg-black/30 pointer-events-auto"
                : "backdrop-blur-0 bg-transparent pointer-events-none"
                }`}
            onClick={onClose}
        >
            <div
                className={`w-full max-w-md flex flex-col transition-transform duration-300 ease-out ${isOpen ? "translate-y-0" : "translate-y-full"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button — outside the sheet */}
                <div className="w-full flex justify-center pb-[24px] px-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-lg font-medium text-[#374151] shadow"
                        aria-label="Close variants"
                    >
                        ✕
                    </button>
                </div>

                <div className="w-full rounded-t-2xl bg-white overflow-y-auto" style={{ maxHeight: "80vh" }}>
                    {displayProduct && (
                        <>
                            {/* Product header */}
                            <div className="flex gap-3 px-4 pt-4 pb-3 border-b border-gray-100">
                                <div className="relative w-[72px] h-[72px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {displayProduct.featured_image && (
                                        <Image src={displayProduct.featured_image} alt={displayProduct.title} fill className="object-cover" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <p className="text-[14px] font-semibold text-[#292E2C] leading-[20px]">{displayProduct.title}</p>
                                    {displayProduct.subtitle && (
                                        <p className="text-[12px] text-[#7B818C] leading-[16px] mt-0.5">{displayProduct.subtitle}</p>
                                    )}
                                </div>
                            </div>

                            {/* Variants list */}
                            <div className="px-4 py-3 space-y-1 pb-8">
                                {variants.map((variant, idx) => {
                                    const attrs = variant.attributes ?? {};
                                    const variantId = attrs.shopifyVariantId;
                                    const qty = variantId ? (quantities[variantId] ?? 0) : 0;
                                    const price = attrs.price;
                                    const compareAtPrice = attrs.compareAtPrice;
                                    const discount = getDiscountPercent(price, compareAtPrice);

                                    return (
                                        <div
                                            key={variantId ?? idx}
                                            className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-medium text-[#292E2C]">{attrs.title}</p>
                                                {attrs.measurementValue != null && attrs.measurementUnit && (
                                                    <p className="text-[11px] text-[#9DA6B2]">
                                                        {attrs.measurementValue}
                                                        {attrs.measurementUnit}
                                                    </p>
                                                )}
                                                <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                                                    {formatPrice(price) && (
                                                        <p className="text-[10px] text-[#292E2C]">
                                                            ₹<span className="text-[15px] font-semibold">{formatPrice(price)}</span>
                                                        </p>
                                                    )}
                                                    {compareAtPrice && compareAtPrice > price && (
                                                        <>
                                                            <span className="text-[11px] text-[#9DA6B2] line-through">
                                                                ₹{formatPrice(compareAtPrice)}
                                                            </span>
                                                            {discount != null && (
                                                                <span className="text-[11px] font-semibold text-[#D13F44]">-{discount}%</span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0">
                                                {qty === 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => variantId && onIncrease(variantId)}
                                                        className="px-4 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-xs font-semibold text-orange-600"
                                                    >
                                                        ADD
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-xs font-semibold text-orange-600">
                                                        <button
                                                            type="button"
                                                            onClick={() => variantId && onDecrease(variantId)}
                                                            className="w-5 h-5 rounded-full border border-orange-300 flex items-center justify-center"
                                                        >
                                                            −
                                                        </button>
                                                        <span>{qty}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => variantId && onIncrease(variantId)}
                                                            className="w-5 h-5 rounded-full border border-orange-300 flex items-center justify-center"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
