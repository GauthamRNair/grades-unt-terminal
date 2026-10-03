"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import type { SearchResult } from "@/lib/types";
import { fetchManifest, searchManifest } from "@/lib/encryptedData";
import { SEARCH_LOG_ENABLED } from "@/lib/deploy";
import PromptInput from "@/components/term/PromptInput";
import { branch, prefersReducedMotion, useSpinner } from "@/components/term/Primitives";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 200;
const LINE_STAGGER_MS = 100; // each line starts typing 0.1s after the previous
const CHAR_MS = 6; // per-character typing speed

type Line =
  | { kind: "header"; text: string }
  | { kind: "empty"; text: string }
  | { kind: "item"; text: string; dim: string; itemIdx: number; href: string; last: boolean; source: Suggestion };

type Item = Extract<Line, { kind: "item" }>;
type Suggestion = SearchResult["courses"][number] | SearchResult["instructors"][number];

function isCourse(item: Suggestion): item is SearchResult["courses"][number] {
  return "prefix" in item;
}

interface TerminalSearchProps {
  /** "hero" renders results inline under the prompt; "inline" renders them in a floating panel. */
  variant?: "hero" | "inline";
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Terminal-style search prompt. Results type out in two parallel columns
 * (instructors left, courses right) so neither waits behind the other.
 */
export default function TerminalSearch({ variant = "hero", autoFocus = false, placeholder, className = "" }: TerminalSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounce(query, DEBOUNCE_MS);
  const normalized = debounced.trim().toLowerCase();
  const spinner = useSpinner(loading);
  const inline = variant === "inline";

  useEffect(() => {
    void fetchManifest().catch(() => undefined);
  }, []);

  // Clear after navigating so the status-line search doesn't carry over.
  useEffect(() => {
    setQuery("");
    setResults(null);
    setHighlight(-1);
    setLoading(false);
  }, [pathname]);

  // "/" focuses the status-line search from anywhere on the page.
  useEffect(() => {
    if (!inline) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof Element && e.target.closest("input, textarea, [contenteditable]");
      if (e.key !== "/" || typing) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inline]);

  useEffect(() => {
    if (normalized.length < MIN_QUERY_LENGTH) return;
    let active = true;
    searchManifest(normalized)
      .then((data) => {
        if (!active) return;
        setResults(data as SearchResult);
        setHighlight(-1);
        setLoading(false);
        setError(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
        setError(true);
      });
    return () => {
      active = false;
    };
  }, [normalized]);

  const columns = useMemo<Line[][]>(() => {
    if (!results) return [];
    const groups: Array<{ name: string; rows: Array<Omit<Item, "kind" | "itemIdx" | "last">> }> = [
      {
        name: "instructors",
        rows: results.instructors.map((i) => ({
          text: `${i.lastName}, ${i.firstName}`,
          dim: "",
          href: `/instructor/${i.id}`,
          source: i,
        })),
      },
      {
        name: "courses",
        rows: results.courses.map((c) => ({
          text: `${c.prefix} ${c.number}`,
          dim: c.title,
          href: `/course/${c.prefix}/${c.number}`,
          source: c,
        })),
      },
    ];

    let itemIdx = 0;
    return groups.map((g) => {
      const col: Line[] = [{ kind: "header", text: `${g.name} (${g.rows.length})` }];
      if (g.rows.length === 0) col.push({ kind: "empty", text: "no matches" });
      g.rows.forEach((r, i) => {
        col.push({ kind: "item", ...r, itemIdx: itemIdx++, last: i === g.rows.length - 1 });
      });
      return col;
    });
  }, [results]);

  const items = columns.flat().filter((l): l is Item => l.kind === "item");
  const hasAny = items.length > 0;

  // One rAF clock drives the typing animation; restarts per result set.
  useEffect(() => {
    if (columns.length === 0) return;
    const total = Math.max(
      ...columns.map((col) => (col.length - 1) * LINE_STAGGER_MS + Math.max(...col.map(lineLength)) * CHAR_MS)
    );
    const reduced = prefersReducedMotion();
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = now - start;
      setElapsed(t);
      if (t < total) raf = requestAnimationFrame(tick);
    };
    setElapsed(0);
    if (!reduced) raf = requestAnimationFrame(tick);
    // Finishes instantly for reduced motion, and never leaves results half-typed if rAF is paused.
    const done = setTimeout(() => setElapsed(Infinity), reduced ? 0 : total + 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [columns]);

  const logSelection = (item: Suggestion) => {
    const raw = debounced.trim();
    if (!SEARCH_LOG_ENABLED || raw.length < MIN_QUERY_LENGTH) return;
    const course = isCourse(item) ? item : undefined;
    void fetch("/api/search-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Do not transmit an instructor query or name. The API records only
        // the anonymous instructor-search event and result counts.
        rawQuery: course ? debounced : undefined,
        searchKind: course ? "course" : "instructor",
        source: "site",
        normalizedQuery: course ? raw.toLowerCase().replace(/\s+/g, " ") : undefined,
        coursePrefix: course?.prefix,
        courseNumber: course?.number,
        courseTitle: course?.title,
        resultCountCourses: results?.courses.length ?? 0,
        resultCountInstructors: results?.instructors.length ?? 0,
      }),
      keepalive: true,
    });
  };

  const open = (item: Item) => {
    logSelection(item.source);
    inputRef.current?.blur();
    if (pathname === item.href) {
      setQuery("");
      setResults(null);
      return;
    }
    router.push(item.href);
  };

  const onChange = (value: string) => {
    setQuery(value);
    setError(false);
    if (value.trim().length < MIN_QUERY_LENGTH) {
      setResults(null);
      setLoading(false);
      setHighlight(-1);
    } else {
      setLoading(true);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      setHighlight((h) => (h + 1) % items.length);
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      setHighlight((h) => (h - 1 + items.length) % items.length);
    } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && highlight >= 0) {
      // Jump to the same row in the other column.
      e.preventDefault();
      const leftCount = results?.instructors.length ?? 0;
      const inLeft = highlight < leftCount;
      const row = inLeft ? highlight : highlight - leftCount;
      const targetCount = inLeft ? items.length - leftCount : leftCount;
      if (targetCount === 0) return;
      setHighlight((inLeft ? leftCount : 0) + Math.min(row, targetCount - 1));
    } else if (e.key === "Enter" && items.length) {
      e.preventDefault();
      open(items[Math.max(highlight, 0)]);
    } else if (e.key === "Escape") {
      onChange("");
      if (inline) inputRef.current?.blur();
    }
  };

  // `i` is the line's position within its own column, so both columns type at once.
  const renderLine = (line: Line, i: number) => {
    const shown = Math.max(0, Math.floor((elapsed - i * LINE_STAGGER_MS) / CHAR_MS));
    if (shown === 0) return <div key={i} className="h-6" />;

    if (line.kind === "header") {
      const full = `── ${line.text} `;
      return (
        <div key={i} className="flex items-center text-neutral-500">
          <span className="whitespace-pre">{full.slice(0, shown)}</span>
          {shown >= full.length && <span className="term-rule h-px flex-1 bg-neutral-800" />}
        </div>
      );
    }

    if (line.kind === "empty") {
      return (
        <div key={i} className="whitespace-pre text-neutral-600">
          {"  └─ " + line.text.slice(0, shown)}
        </div>
      );
    }

    const active = highlight === line.itemIdx;
    const main = line.text.slice(0, shown);
    const dimText = line.dim ? `  ${line.dim}` : "";
    const dim = dimText.slice(0, Math.max(0, shown - line.text.length));
    const typing = shown < line.text.length + dimText.length;
    return (
      <button
        key={i}
        type="button"
        onMouseEnter={() => setHighlight(line.itemIdx)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => open(line)}
        className="flex w-full items-baseline text-left whitespace-pre"
      >
        <span className="shrink-0 text-neutral-700">{"  " + branch(line.last)}</span>
        <span className={`shrink-0 ${active ? "bg-neutral-200 text-black" : "text-neutral-100"}`}>{main}</span>
        <span className={`min-w-0 overflow-hidden text-ellipsis whitespace-pre ${active ? "text-neutral-300" : "text-neutral-500"}`}>{dim}</span>
        {typing && <span className="ml-px inline-block h-[1em] w-[0.5em] shrink-0 translate-y-[2px] bg-neutral-400" />}
        {active && !typing && <span className="ml-2 shrink-0 text-term-accent">↵</span>}
      </button>
    );
  };

  const showResults = query.trim().length >= MIN_QUERY_LENGTH && (!inline || focused);

  const output = showResults && (
    <div className="select-none">
      {loading && columns.length === 0 && (
        <p className="pl-1 text-neutral-500">
          <span className="text-term-accent">{spinner}</span> searching…
        </p>
      )}
      {!loading && error && <p className="pl-1 text-red-400">error: could not load search results</p>}
      {!loading && !error && results && !hasAny && (
        <p className="pl-1 text-neutral-500">
          <span className="text-neutral-600">⎿</span> no matches for &quot;{normalized}&quot;
        </p>
      )}
      {hasAny && (
        <div className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
          {columns.map((col, c) => (
            <div key={c} className="min-w-0">
              {col.map((line, i) => renderLine(line, i))}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    // Inline results anchor to the nearest positioned ancestor (the status line), not this box.
    <div className={`${inline ? "" : "relative"} min-w-0 ${className}`}>
      <PromptInput
        ref={inputRef}
        value={query}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocusChange={setFocused}
        autoFocus={autoFocus}
        placeholder={placeholder}
        ariaLabel="Search courses or instructors"
      />
      {inline ? (
        output && (
          <div className="absolute inset-x-0 top-full z-50 border-b border-neutral-800 bg-black/95 backdrop-blur-sm">
            <div className="mx-auto max-h-[70vh] w-full max-w-6xl overflow-y-auto px-4 py-3 sm:px-6">{output}</div>
          </div>
        )
      ) : (
        <div className="mt-2">{output}</div>
      )}
    </div>
  );
}

function lineLength(line: Line) {
  if (line.kind === "header") return line.text.length + 4;
  if (line.kind === "empty") return line.text.length;
  return line.text.length + (line.dim ? line.dim.length + 2 : 0);
}
