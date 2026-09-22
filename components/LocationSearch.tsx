"use client";

import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import {
  searchLocations,
  formatLocationLabel,
  countryCodeToFlag,
} from "@/lib/geocoding";
import type { GeocodingResult, SearchStatus } from "@/types/location";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 1;
const COPY_FEEDBACK_MS = 1500;

export default function LocationSearch() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<GeocodingResult | null>(null);
  const [copied, setCopied] = useState(false);

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const abortRef = useRef<AbortController | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { recent, addRecent, clearRecent } = useRecentSearches();

  const isRecentMode = query.trim().length === 0;
  const visibleItems = isRecentMode ? recent : results;

  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    abortRef.current?.abort();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setStatus("idle");
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setIsOpen(true);

    searchLocations(trimmed, controller.signal)
      .then((data) => {
        setResults(data);
        setStatus(data.length === 0 ? "empty" : "success");
        setActiveIndex(-1);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
        setResults([]);
        setActiveIndex(-1);
      });

    return () => controller.abort();
  }, [debouncedQuery, retryCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const option = listRef.current.children[activeIndex] as
      | HTMLElement
      | undefined;
    option?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  function handleSelect(result: GeocodingResult) {
    setSelected(result);
    setQuery(result.name);
    setIsOpen(false);
    setActiveIndex(-1);
    abortRef.current?.abort();
    setStatus("idle");
    addRecent(result);
  }

  function handleRetry() {
    setRetryCount((c) => c + 1);
  }

  function handleCopy() {
    if (!selected) return;
    const text = `${selected.latitude}, ${selected.longitude}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(
        () => setCopied(false),
        COPY_FEEDBACK_MS
      );
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || visibleItems.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % visibleItems.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex(
          (prev) => (prev - 1 + visibleItems.length) % visibleItems.length
        );
        break;
      case "Enter":
        if (activeIndex >= 0) {
          event.preventDefault();
          handleSelect(visibleItems[activeIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  const showDropdown =
    isOpen && (isRecentMode ? recent.length > 0 : query.trim().length >= MIN_QUERY_LENGTH);
  const activeOptionId =
    activeIndex >= 0 ? `flocate-option-${activeIndex}` : undefined;

  return (
    <div className="w-full">
      <div ref={containerRef} className="relative">
        <label htmlFor="flocate-input" className="sr-only">
          Search for a city, country or location
        </label>

        <div className="relative">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M13.5 13.5 17 17"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <input
            id="flocate-input"
            type="text"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="flocate-listbox"
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            autoComplete="off"
            placeholder="Search for a city, country or location..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-3.5 text-sm text-ink shadow-card outline-none transition placeholder:text-ink-faint focus:border-accent focus:ring-4 focus:ring-accent-soft"
          />
        </div>

        {showDropdown && (
          <div className="absolute z-10 mt-2 w-full origin-top overflow-hidden rounded-xl border border-border bg-surface shadow-panel motion-safe:animate-panel-in">
            {isRecentMode ? (
              <div className="p-1.5">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
                    Recent
                  </p>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clearRecent();
                    }}
                    className="text-xs font-medium text-ink-soft transition hover:text-ink"
                  >
                    Clear
                  </button>
                </div>
                <ul
                  ref={listRef}
                  id="flocate-listbox"
                  role="listbox"
                  aria-label="Recent searches"
                >
                  {recent.map((result, index) => (
                    <ResultRow
                      key={result.id}
                      result={result}
                      index={index}
                      active={index === activeIndex}
                      onHover={setActiveIndex}
                      onSelect={handleSelect}
                    />
                  ))}
                </ul>
              </div>
            ) : (
              <>
                {status === "loading" && (
                  <ul className="p-1.5" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="h-7 w-7 shrink-0 rounded-full bg-canvas motion-safe:animate-pulse" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 w-2/5 rounded-full bg-canvas motion-safe:animate-pulse" />
                          <div className="h-2 w-3/5 rounded-full bg-canvas motion-safe:animate-pulse" />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {status === "error" && (
                  <div className="px-4 py-4" role="alert">
                    <p className="text-sm font-medium text-ink">
                      Something went wrong
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      We couldn&apos;t search locations.
                    </p>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="mt-3 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white transition hover:bg-ink/85"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {status === "empty" && (
                  <div className="px-4 py-4">
                    <p className="text-sm font-medium text-ink">
                      No locations found
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      Try a different search.
                    </p>
                  </div>
                )}

                {status === "success" && (
                  <ul
                    ref={listRef}
                    id="flocate-listbox"
                    role="listbox"
                    aria-label="Location suggestions"
                    className="max-h-72 overflow-y-auto p-1.5"
                  >
                    {results.map((result, index) => (
                      <ResultRow
                        key={result.id}
                        result={result}
                        index={index}
                        active={index === activeIndex}
                        onHover={setActiveIndex}
                        onSelect={handleSelect}
                      />
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {selected && (
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-card motion-safe:animate-card-in">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
                Selected location
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-medium text-ink-soft transition hover:text-ink"
              >
                {copied ? (
                  <>
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className="h-3.5 w-3.5 text-accent"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.5 8.5 6.5 11.5 12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <rect
                        x="5.5"
                        y="5.5"
                        width="8"
                        height="8"
                        rx="1.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                      <path
                        d="M3.5 10.5V3.5a1 1 0 0 1 1-1h7"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-base">
                {countryCodeToFlag(selected.country_code) ?? "•"}
              </span>
              <p className="text-lg font-semibold tracking-tight text-ink">
                {selected.name}
              </p>
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">
              {[selected.admin1, selected.country].filter(Boolean).join(", ")}
            </p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
                Latitude
              </p>
              <p className="mt-1 font-mono text-sm tabular-nums text-ink">
                {selected.latitude}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
                Longitude
              </p>
              <p className="mt-1 font-mono text-sm tabular-nums text-ink">
                {selected.longitude}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultRow({
  result,
  index,
  active,
  onHover,
  onSelect,
}: {
  result: GeocodingResult;
  index: number;
  active: boolean;
  onHover: (index: number) => void;
  onSelect: (result: GeocodingResult) => void;
}) {
  const label = formatLocationLabel(result);
  const flag = countryCodeToFlag(result.country_code);

  return (
    <li
      id={`flocate-option-${index}`}
      role="option"
      aria-selected={active}
      onMouseEnter={() => onHover(index)}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(result);
      }}
      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition ${
        active ? "bg-accent-soft" : ""
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas text-base">
        {flag ?? "•"}
      </span>
      <span className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">
          {label.primary}
        </p>
        <p className="truncate text-xs text-ink-soft">{label.secondary}</p>
      </span>
    </li>
  );
}
