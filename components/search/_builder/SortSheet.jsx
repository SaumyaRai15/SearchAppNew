import React from "react";

export default function SortSheet({ isOpen, onClose, sortBy, onSortChange, sortOptions }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-end backdrop-blur-[8px] bg-black/30">
            {/* Close button — outside the sheet */}
            <div className="w-full flex justify-center pb-[24px] px-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-lg font-medium text-[#374151] shadow"
                    aria-label="Close sort"
                >
                    ✕
                </button>
            </div>

            <div className="w-full max-w-md rounded-t-2xl bg-white pb-6 pt-4 px-4">
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
            {/* end sheet */}
        </div>
    );
}

