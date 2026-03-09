import React from "react";

export default function SortSheet({ isOpen, onClose, sortBy, onSortChange, sortOptions }) {
  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col items-center justify-end transition-all duration-300 ease-in-out ${
        isOpen
          ? "backdrop-blur-[8px] bg-black/30 pointer-events-auto"
          : "backdrop-blur-0 bg-transparent pointer-events-none"
      }`}
    >
      <div
        className={`w-full max-w-md flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
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

        <div className="w-full overflow-hidden rounded-t-2xl bg-[#F9FAFB]">
          <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-4">
            <h2 className="text-[16px] text-[#18191A] font-black leading-[24px]">Sort by</h2>
          </div>
          <div className="divide-y divide-gray-100 px-4">
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
                  className={`w-full text-left py-3 text-[16px] leading-[24px] ${
                    active ? "text-[#C4512B]" : "text-[#292E2C]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
