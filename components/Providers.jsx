"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";

export default function Providers({ children }) {
    const [queryClient] = useState(
        () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } }),
    );
    const initializeCartData = useCartStore((state) => state.initializeCartData);

    useEffect(() => {
        initializeCartData();
    }, [initializeCartData]);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
