"use client";

import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, LoaderCircle, Scale } from "lucide-react";
import { AvatarMark } from "@/components/kaggler/avatar-mark";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { KagglerSearchResult } from "@/lib/data/kagglers";

type SearchStatus = "idle" | "loading" | "ready" | "error";

function ComparePicker({
  label,
  query,
  selected,
  onQueryChange,
  onSelect,
}: {
  label: string;
  query: string;
  selected: KagglerSearchResult | null;
  onQueryChange: (value: string) => void;
  onSelect: (value: KagglerSearchResult) => void;
}) {
  const inputId = useId();
  const [results, setResults] = useState<KagglerSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery === selected?.username) return;

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
  }, [query, selected?.username]);

  function updateQuery(value: string) {
    onQueryChange(value);
    setOpen(Boolean(value.trim()));
    if (!value.trim()) {
      setResults([]);
      setStatus("idle");
    }
  }

  return (
    <div className="relative min-w-0">
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium text-muted-foreground"
      >
        {label}
      </label>
      <Command
        shouldFilter={false}
        className="overflow-visible rounded-xl border border-border bg-background/45 focus-within:border-primary/50"
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <CommandInput
          id={inputId}
          value={query}
          onValueChange={updateQuery}
          onFocus={() => {
            if (query.trim() && query.trim() !== selected?.username) {
              setOpen(true);
            }
          }}
          aria-label={label}
          placeholder="Search username or display name..."
          className="h-12 text-base"
        />
        {open && (
          <CommandList className="absolute top-[calc(100%+0.5rem)] z-40 max-h-80 w-full rounded-xl border border-border bg-popover p-1 shadow-2xl">
            {status === "loading" && (
              <StatusRow>
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                Searching...
              </StatusRow>
            )}
            {status === "error" && (
              <StatusRow>Search is temporarily unavailable.</StatusRow>
            )}
            {status === "ready" && (
              <>
                <CommandEmpty>No matching Kagglers found.</CommandEmpty>
                <CommandGroup>
                  {results.map((result) => (
                    <CommandItem
                      key={result.username}
                      value={result.username}
                      onSelect={() => {
                        onSelect(result);
                        setOpen(false);
                      }}
                      className="min-h-16 gap-3 rounded-lg px-3 py-2"
                    >
                      <AvatarMark
                        name={result.displayName}
                        className="size-9"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {result.displayName}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          @{result.username} · {result.tier}
                        </span>
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {result.officialRank
                          ? `#${result.officialRank}`
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
      {selected && (
        <p className="mt-2 truncate text-xs text-primary">
          Selected: {selected.displayName} (@{selected.username})
        </p>
      )}
    </div>
  );
}

function StatusRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function CompareSelector({
  initialLeft,
  initialRight,
}: {
  initialLeft: KagglerSearchResult | null;
  initialRight: KagglerSearchResult | null;
}) {
  const router = useRouter();
  const [left, setLeft] = useState(initialLeft);
  const [right, setRight] = useState(initialRight);
  const [leftQuery, setLeftQuery] = useState(initialLeft?.username ?? "");
  const [rightQuery, setRightQuery] = useState(initialRight?.username ?? "");
  const isSameKaggler = Boolean(
    left && right && left.username === right.username,
  );

  function updateLeftQuery(value: string) {
    setLeftQuery(value);
    if (value !== left?.username) setLeft(null);
  }

  function updateRightQuery(value: string) {
    setRightQuery(value);
    if (value !== right?.username) setRight(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!left || !right || isSameKaggler) return;
    const params = new URLSearchParams({
      a: left.username,
      b: right.username,
    });
    router.push(`/compare?${params.toString()}`);
  }

  function swap() {
    setLeft(right);
    setRight(left);
    setLeftQuery(right?.username ?? "");
    setRightQuery(left?.username ?? "");
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-primary/15 bg-card/60 p-4 shadow-[0_24px_80px_rgb(0_0_0/16%)] sm:p-6"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] lg:items-end">
        <ComparePicker
          label="First Kaggler"
          query={leftQuery}
          selected={left}
          onQueryChange={updateLeftQuery}
          onSelect={(result) => {
            setLeft(result);
            setLeftQuery(result.username);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={swap}
          disabled={!left && !right}
          aria-label="Swap Kagglers"
          className="mb-0.5 justify-self-center"
        >
          <ArrowLeftRight aria-hidden="true" />
        </Button>
        <ComparePicker
          label="Second Kaggler"
          query={rightQuery}
          selected={right}
          onQueryChange={updateRightQuery}
          onSelect={(result) => {
            setRight(result);
            setRightQuery(result.username);
          }}
        />
        <Button
          type="submit"
          disabled={!left || !right || isSameKaggler}
          className="min-h-11 gap-2"
        >
          <Scale aria-hidden="true" /> Compare
        </Button>
      </div>
      {isSameKaggler && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          Choose two different Kagglers to compare.
        </p>
      )}
    </form>
  );
}
