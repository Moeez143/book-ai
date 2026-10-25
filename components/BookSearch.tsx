"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BookSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const syncFromUrl = () => {
      setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
    };
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  useEffect(() => {
    const nextQuery = query.trim();
    const currentQuery = new URLSearchParams(window.location.search).get("q") ?? "";
    if (nextQuery === currentQuery) return;

    const timeout = window.setTimeout(() => {
      router.replace(nextQuery ? "/?q=" + encodeURIComponent(nextQuery) : "/", {
        scroll: false,
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [query, router]);

  return (
    <div className="library-search-wrapper">
      <Search className="ml-3 size-5 shrink-0 text-(--text-secondary)" aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by title or author"
        aria-label="Search books by title or author"
        className="library-search-input min-w-0"
      />
    </div>
  );
}