import React from "react";
import { formatCategoryLabel } from "../../../constants/categoryUtils";

export default function FilterSheet({
    isOpen,
    onClose,
    selectedCategories,
    selectedCollections,
    priceRange,
    clearFilters,
    categoryOptions,
    facetCategories,
    facetCollections,
    toggleCategory,
    setSelectedCollections,
    setPriceRange,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
            <div className="w-full max-w-md rounded-t-2xl bg-white pb-6 pt-3 px-4">
                <div className="flex justify-center mb-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center text-xl leading-none"
                        aria-label="Close filters"
                    >
                        ×
                    </button>
                </div>

                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-[#111827]">Filters</h2>
                    {(selectedCategories.length > 0 ||
                        selectedCollections.length > 0 ||
                        priceRange.min !== "" ||
                        priceRange.max !== "") && (
                            <button type="button" onClick={clearFilters} className="text-xs font-medium text-[#EF4444]">
                                Clear all
                            </button>
                        )}
                </div>

                <div className="space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Category filter */}
                    {categoryOptions.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-[#6B7280] mb-2">Category</p>
                            <div className="space-y-2">
                                {facetCategories.map((item) => {
                                    const value = item.value;
                                    const checked = selectedCategories.includes(value);

                                    return (
                                        <label key={value} className="flex items-center justify-between text-sm">
                                            <span className="text-[#111827]">{formatCategoryLabel(value)}</span>
                                            <span className="flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center min-w-[24px] px-2 h-[20px] rounded-full bg-[#F3F4F6] text-[11px] text-[#6B7280]">
                                                    {item.count}
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-[#111827] focus:ring-[#111827]"
                                                    checked={checked}
                                                    onChange={() => toggleCategory(value)}
                                                />
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Collections filter */}
                    {facetCollections.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-[#6B7280] mb-2">Collections</p>
                            <div className="space-y-2">
                                {facetCollections.map((item) => {
                                    const value = item.value;
                                    const checked = selectedCollections.includes(value);

                                    return (
                                        <label key={value} className="flex items-center justify-between text-sm">
                                            <span className="text-[#111827]">{formatCategoryLabel(value)}</span>
                                            <span className="flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center min-w-[24px] px-2 h-[20px] rounded-full bg-[#F3F4F6] text-[11px] text-[#6B7280]">
                                                    {item.count}
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-[#111827] focus:ring-[#111827]"
                                                    checked={checked}
                                                    onChange={() =>
                                                        setSelectedCollections((prev) =>
                                                            checked ? prev.filter((c) => c !== value) : [...prev, value],
                                                        )
                                                    }
                                                />
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Price range filter */}
                    <div>
                        <p className="text-xs font-medium text-[#6B7280] mb-2">Price range</p>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <label className="block text-[11px] text-[#9CA3AF] mb-1">Min</label>
                                <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5">
                                    <span className="text-xs text-[#6B7280]">₹</span>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        className="w-full text-sm outline-none border-none bg-transparent"
                                        value={priceRange.min}
                                        onChange={(e) =>
                                            setPriceRange((prev) => ({
                                                ...prev,
                                                min: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <span className="text-xs text-[#9CA3AF]">to</span>

                            <div className="flex-1">
                                <label className="block text-[11px] text-[#9CA3AF] mb-1">Max</label>
                                <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5">
                                    <span className="text-xs text-[#6B7280]">₹</span>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        className="w-full text-sm outline-none border-none bg-transparent"
                                        value={priceRange.max}
                                        onChange={(e) =>
                                            setPriceRange((prev) => ({
                                                ...prev,
                                                max: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 w-full h-11 rounded-xl bg-[#111827] text-sm font-semibold text-white"
                >
                    Apply filters
                </button>
            </div>
        </div>
    );
}

