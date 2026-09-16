"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search } from "lucide-react";
import { AvatarMark } from "@/components/kaggler/avatar-mark";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { DataSource, KagglerSearchResult } from "@/lib/data/kagglers";

type SearchStatus = "idle" | "loading" | "ready" | "error";

export function KagglerSearch({ source }: { source: DataSource }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KagglerSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Search request failed");

        const data = (await response.json()) as {
          results: KagglerSearchResult[];
        };
        setResults(data.results);
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
        setResults([]);
        setStatus("error");
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function updateQuery(value: string) {
    setQuery(value);
    setOpen(Boolean(value.trim()));
    if (!value.trim()) {
      setResults([]);
      setStatus("idle");
    }
  }

  function visitProfile(username: string) {
    setOpen(false);
    router.push(`/kagglers/${username}`);
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Command
        shouldFilter={false}
        className="overflow-visible rounded-2xl border border-border bg-card/85 shadow-[0_24px_80px_rgb(0_0_0/22%)] transition-colors focus-within:border-primary/60 **:data-[slot=command-input-wrapper]:h-16 **:data-[slot=command-input-wrapper]:border-0 **:data-[slot=command-input-wrapper]:px-5"
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <CommandInput
          id="kaggler-search"
          value={query}
          onValueChange={updateQuery}
          onFocus={() => setOpen(Boolean(query.trim()))}
          aria-label="Search Kagglers"
          placeholder="Search by username or display name..."
          className="h-14 pr-24 text-base sm:pr-28"
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-lg bg-secondary px-3 py-2 font-mono text-xs text-muted-foreground">
          {source === "database" ? "Database" : "Preview"}
        </span>

        {open && (
          <CommandList className="absolute top-[calc(100%+0.6rem)] z-40 max-h-96 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-2xl">
            {status === "loading" && (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                Searching Kagglers...
              </div>
            )}
            {status === "error" && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Search is temporarily unavailable. Please try again.
              </div>
            )}
            {status === "ready" && (
              <>
                <CommandEmpty>No matching Kagglers found.</CommandEmpty>
                <CommandGroup
                  heading={`${results.length} result${results.length === 1 ? "" : "s"}`}
                >
                  {results.map((kaggler) => (
                    <CommandItem
                      key={kaggler.username}
                      value={kaggler.username}
                      onSelect={() => visitProfile(kaggler.username)}
                      className="min-h-16 gap-3 rounded-lg px-3 py-2"
                    >
                      <AvatarMark
                        name={kaggler.displayName}
                        className="size-9"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {kaggler.displayName}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          @{kaggler.username} · Competition {kaggler.tier}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {kaggler.officialRank
                          ? `Official #${kaggler.officialRank}`
                          : "Unranked"}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        )}
      </Command>
      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Search className="size-3.5" aria-hidden="true" />
        Use ↑ and ↓ to choose, then Enter to open a profile.
      </p>
    </div>
  );
}
