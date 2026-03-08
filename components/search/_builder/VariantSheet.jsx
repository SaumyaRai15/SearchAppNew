import Image from "next/image";
import { useRef } from "react";
import LoaderIcon from "@/components/Loaders/LoaderIcon";

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
            <Image src="/svg/star-white.svg" width={11} height={11} alt="" aria-hidden />
          )}
        </span>
      ))}
    </div>
  );
};

export default function VariantSheet({
  isOpen,
  onClose,
  product,
  quantities,
  isLoadingByVariant = {},
  onIncrease,
  onDecrease,
}) {
  const lastProductRef = useRef(null);
  if (product) lastProductRef.current = product;
  const displayProduct = isOpen ? product : lastProductRef.current;
  const variants = displayProduct?.variants ?? [];
  const displayRating = getDisplayRating(displayProduct?.rating);

  const firstMeasurement = (() => {
    for (const v of variants) {
      const attrs = v.attributes ?? {};
      if (attrs.measurementValue != null && attrs.measurementUnit) {
        return `${attrs.measurementValue}${attrs.measurementUnit}`;
      }
    }
    return null;
  })();

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-end transition-all duration-300 ease-in-out ${
        isOpen
          ? "backdrop-blur-[8px] bg-black/30 pointer-events-auto"
          : "backdrop-blur-0 bg-transparent pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
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
          {/* Drag handle
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-gray-200" />
                    </div> */}

          {displayProduct && (
            <>
              {/* Product header */}
              <div className="flex gap-3 px-4 pt-4 pb-4">
                <div className="relative w-[48px] h-[72px] rounded-[8px] overflow-hidden bg-gray-100 flex-shrink-0">
                  {displayProduct.featured_image && (
                    <Image
                      src={displayProduct.featured_image}
                      alt={displayProduct.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                  <p className="text-[16px] font-medium text-[#303133] leading-[24px]">{displayProduct.title}</p>
                  {displayProduct.subtitle && (
                    <p className="text-[12px] text-[#7B818C] leading-[16px]">{displayProduct.subtitle}</p>
                  )}
                  <div className="flex gap-x-2 mt-0.5">
                    {firstMeasurement && (
                      <p className="text-[12px] leading-[16px] text-[#676B73] bg-[#F5F7FA] px-[4px] rounded-[2px]">
                        {firstMeasurement}
                      </p>
                    )}
                    <div className="flex gap-x-2 bg-[#F5F7FA] px-[4px] rounded-[2px] w-fit">
                      <StarRating rating={displayProduct?.rating} />
                      <p className="text-[12px] leading-[16px] text-[#676B73]">({displayRating})</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variants list */}
              <div className="px-4 pb-8">
                {/* "Buying options" row — its border-b is the first separator */}
                <div className="pb-3 border-b border-gray-100">
                  <p className="text-[12px] text-[#7B818C] font-medium leading-[20px]">Buying options</p>
                </div>

                {variants.map((variant, idx) => {
                  const attrs = variant.attributes ?? {};
                  const variantId = attrs.shopifyVariantId;
                  const price = attrs.price;
                  const compareAtPrice = attrs.compareAtPrice;
                  const discount = getDiscountPercent(price, compareAtPrice);
                  const isLoading = variantId ? !!isLoadingByVariant[variantId] : false;

                  return (
                    <div
                      key={variantId ?? idx}
                      className="flex items-center justify-between gap-3 py-3.5 border-b border-gray-100 last:border-b-0"
                    >
                      {/* Left: name + badge + price */}
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[16px] font-medium leading-[24px] text-[#292E2C]">{attrs.title}</p>
                          {discount != null && (
                            <span className="text-[12px] font-bold text-[#D13F44] bg-[#FFF5F5] px-2 py-0.5 rounded-[8px]">
                              -{discount}% OFF
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1 flex-wrap leading-[20px]">
                          {formatPrice(price) && (
                            <p className="text-[10px] text-[#292E2C]">
                              ₹<span className="text-[18px] font-medium leading-[100%]">{formatPrice(price)}</span>
                            </p>
                          )}
                          {compareAtPrice && compareAtPrice > price && (
                            <span className="text-[12px] text-[#9DA6B2] line-through">
                              ₹{formatPrice(compareAtPrice)}
                            </span>
                          )}
                        </div>

                        {/* Right: ADD / stepper */}
                        <div className="flex-shrink-0">
                          {(quantities[variantId] ?? 0) === 0 ? (
                            <button
                              type="button"
                              onClick={() => variantId && onIncrease(variantId)}
                              disabled={isLoading}
                              className="w-[72px] h-[40px] p-[4px] rounded-[8px] border-[#F0C3B4] border bg-[#FCF1ED] text-[14px] leading-[20px] font-bold text-[#C4512B]"
                            >
                              {isLoading ? (
                                <LoaderIcon width={18} height={18} className="animate-spin mx-auto" />
                              ) : (
                                "ADD"
                              )}
                            </button>
                          ) : (
                            <div className="w-[72px] h-[40px] flex items-center justify-between px-[5px] py-[4px] rounded-[8px] border border-[#C4512B] text-[14px] font-bold text-[#C4512B]">
                              <button
                                type="button"
                                onClick={() => variantId && onDecrease(variantId)}
                                disabled={isLoading}
                                className="w-[16px] h-[16px] flex items-center justify-center"
                              >
                                −
                              </button>
                              <span>
                                {isLoading ? (
                                  <LoaderIcon width={16} height={16} className="animate-spin" />
                                ) : (
                                  quantities[variantId]
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => variantId && onIncrease(variantId)}
                                disabled={isLoading}
                                className="w-[16px] h-[16px] flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-3 pb-3 pt-3 shrink-0 bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.07)] backdrop-blur-[12px]">
                <div className="flex w-full rounded-[20px]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-14 w-full rounded-xl bg-[#111827] text-sm font-bold text-white"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
