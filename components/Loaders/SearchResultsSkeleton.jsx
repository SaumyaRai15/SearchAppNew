export const SearchResultsSkeleton = () => (
    <div className="flex gap-3 bg-white py-3 border-b border-gray-100 animate-pulse">
        <div className="w-[72px] h-[111px] rounded-lg bg-gray-200 flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
            <div className="h-[14px] bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="mt-4 flex justify-end">
                <div className="h-7 bg-gray-200 rounded-xl w-16" />
            </div>
            <div className="mt-auto h-4 bg-gray-200 rounded w-1/3" />
        </div>
    </div>
);
