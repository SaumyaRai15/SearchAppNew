import React, { useState, useEffect } from "react";
import { formatCategoryLabel } from "../../../constants/categoryUtils";

export default function FilterSheet({
    isOpen,
    onClose,
    selectedCategories,
    selectedCollections,
    priceRange,
    facetCategories,
    facetCollections,
    onApply,
}) {
    const [localCategories, setLocalCategories] = useState(selectedCategories);
    const [localCollections, setLocalCollections] = useState(selectedCollections);
    const [localPriceRange, setLocalPriceRange] = useState(priceRange);

    // Sync local state from applied state whenever the sheet opens
    useEffect(() => {
        if (isOpen) {
            setLocalCategories(selectedCategories);
            setLocalCollections(selectedCollections);
            setLocalPriceRange(priceRange);
        }
    }, [isOpen]);

    const toggleLocalCategory = (value) =>
        setLocalCategories((prev) =>
            prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
        );

    const clearLocal = () => {
        setLocalCategories([]);
        setLocalCollections([]);
        setLocalPriceRange({ min: "", max: "" });
    };

    const handleApply = () => {
        onApply({ categories: localCategories, collections: localCollections, priceRange: localPriceRange });
        onClose();
    };

    const tabs = [
        { id: "category", label: "Category", count: localCategories.length },
        { id: "collections", label: "Collection", count: localCollections.length },
        { id: "price", label: "Price Range", count: 0 },
    ].filter((tab) => {
        if (tab.id === "category") return facetCategories.length > 0;
        if (tab.id === "collections") return facetCollections.length > 0;
        return true;
    });

    const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "category");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-end backdrop-blur-sm bg-black/30">
            {/* Close button — outside the sheet */}
            <div className="w-full flex justify-center pb-[24px] px-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-lg font-medium text-[#374151] shadow"
                    aria-label="Close filters"
                >
                    ✕
                </button>
            </div>

            <div className="w-full max-w-md rounded-t-2xl bg-white flex flex-col" style={{ maxHeight: "80vh" }}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-[16px] shrink-0 border-b border-gray-100">
                    <h2 className="text-base font-bold text-[#111827]">Filters</h2>
                    {(localCategories.length > 0 ||
                        localCollections.length > 0 ||
                        localPriceRange.min !== "" ||
                        localPriceRange.max !== "") && (
                            <button
                                type="button"
                                onClick={clearLocal}
                                className="text-xs font-medium text-[#EF4444]"
                            >
                                Clear all
                            </button>
                        )}
                </div>

                {/* Two-column body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left sidebar tabs */}
                    <div className="w-[140px] shrink-0 bg-[#F9FAFB] overflow-y-auto border-r border-gray-100">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full px-4 py-4 text-sm font-medium flex items-center justify-between gap-2 border-l-[2px] transition-colors ${isActive
                                        ? "border-l-[#C05621] text-[#C05621] bg-[#FCF1ED]"
                                        : "border-l-transparent text-[#374151] "
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                    {tab.count > 0 && (
                                        <div className="text-white text-[10px] w-[18px] h-[18px] flex items-center justify-center font-semibold bg-[#C4512B] rounded-full">
                                            {tab.count}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right panel options */}
                    <div className="flex-1 overflow-y-auto px-4 py-3">
                        {activeTab === "category" && (
                            <div className="space-y-3">
                                {facetCategories.map((item) => {
                                    const value = item.value;
                                    const checked = localCategories.includes(value);
                                    return (
                                        <label
                                            key={value}
                                            className="flex items-center justify-between text-sm cursor-pointer"
                                        >
                                            <span className="text-[#111827]">
                                                {formatCategoryLabel(value)}
                                            </span>
                                            <input
                                                type="checkbox"
                                                className="h-[18px] w-[18px] rounded border-gray-300 accent-[#C05621] cursor-pointer"
                                                checked={checked}
                                                onChange={() => toggleLocalCategory(value)}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === "collections" && (
                            <div className="space-y-3">
                                {facetCollections.map((item) => {
                                    const value = item.value;
                                    const checked = localCollections.includes(value);
                                    return (
                                        <label
                                            key={value}
                                            className="flex items-center justify-between text-sm cursor-pointer"
                                        >
                                            <span className="text-[#111827]">
                                                {formatCategoryLabel(value)}
                                            </span>
                                            <input
                                                type="checkbox"
                                                className="h-[18px] w-[18px] rounded border-gray-300 accent-[#C05621] cursor-pointer"
                                                checked={checked}
                                                onChange={() =>
                                                    setLocalCollections((prev) =>
                                                        checked
                                                            ? prev.filter((c) => c !== value)
                                                            : [...prev, value],
                                                    )
                                                }
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === "price" && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[11px] text-[#9CA3AF] mb-1">Min</label>
                                    <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2">
                                        <span className="text-xs text-[#6B7280]">₹</span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            className="w-full text-sm outline-none border-none bg-transparent"
                                            value={localPriceRange.min}
                                            onChange={(e) =>
                                                setLocalPriceRange((prev) => ({
                                                    ...prev,
                                                    min: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] text-[#9CA3AF] mb-1">Max</label>
                                    <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2">
                                        <span className="text-xs text-[#6B7280]">₹</span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            className="w-full text-sm outline-none border-none bg-transparent"
                                            value={localPriceRange.max}
                                            onChange={(e) =>
                                                setLocalPriceRange((prev) => ({
                                                    ...prev,
                                                    max: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Apply button */}
                <div className="px-4 pb-6 pt-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleApply}
                        className="w-full h-11 rounded-xl bg-[#111827] text-sm font-semibold text-white"
                    >
                        Apply filters
                    </button>
                </div>
            </div>
            {/* end sheet */}
        </div>
    );
}
