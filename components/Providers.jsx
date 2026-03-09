"use client";

import { useEffect } from "react";
import { useCartStore } from "../store/useCartStore";

export default function Providers({ children }) {
  const initializeCartData = useCartStore((state) => state.initializeCartData);

  useEffect(() => {
    initializeCartData();
  }, [initializeCartData]);

  return children;
}
