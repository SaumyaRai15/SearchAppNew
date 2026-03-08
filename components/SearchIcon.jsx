"use client";

import { useRouter } from "next/navigation";

export default function SearchIcon() {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push("/search")}
      style={{
        cursor: "pointer",
        fontSize: "28px",
      }}
    >
      🔍
    </div>
  );
}
