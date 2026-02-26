import React from "react";

export default function SortSheet({ isOpen, onClose, sortBy, onSortChange, sortOptions }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
            <div className="w-full max-w-md rounded-t-2xl bg-white pb-6 pt-3 px-4">
                <div className="flex justify-center mb-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center text-xl leading-none"
                        aria-label="Close sort"
                    >
                        ×
                    </button>
                </div>
                <h2 className="text-[16px] text-[#18191A] font-black leading-[24px] mb-3">Sort by</h2>
                <div className="divide-y divide-gray-100">
                    {sortOptions.map((option) => {
                        const active = sortBy === option.id;

                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onSortChange(option.id);
                                    onClose();
                                }}
                                className={`w-full text-left py-3 text-[16px] leading-[24px] ${active ? "text-[#111827] font-semibold" : "text-[#292E2C]"
                                    }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

