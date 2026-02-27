import { Suspense } from "react";
import SearchIndex from "../../components/search";

export default function SearchPage() {
    return (
        <Suspense>
            <SearchIndex />
        </Suspense>
    );
}