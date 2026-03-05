import { Suspense } from "react";
import SearchIndex from "../../components/Search";

export default function SearchPage() {
    return (
        <Suspense>
            <SearchIndex />
        </Suspense>
    );
}