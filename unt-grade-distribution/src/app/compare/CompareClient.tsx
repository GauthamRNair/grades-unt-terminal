"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { aggregateGrades, calculateGPA, toChartData, type ChartDataPoint } from "@/lib/grades";
import GradeChart from "@/components/GradeChart";
import GpaBadge from "@/components/GpaBadge";
import { SEARCH_LOG_ENABLED } from "@/lib/deploy";
import PromptInput from "@/components/term/PromptInput";
import { Heading, PageHeader, branch, useSpinner } from "@/components/term/Primitives";
import { useDebounce } from "@/hooks/useDebounce";
import type { SearchResult } from "@/lib/types";
import { fetchManifest, fromInstructorSlug, loadCourseByCode, loadInstructorSections, searchManifest } from "@/lib/encryptedData";

type CompareType = "course" | "instructor";
type CourseSuggestion = SearchResult["courses"][number];
type InstructorSuggestion = SearchResult["instructors"][number];
type Suggestion = CourseSuggestion | InstructorSuggestion;
type Selection = Suggestion | string | null;

type CompareData = {
  label: string;
  chartData: ChartDataPoint[];
  summary: {
    sections: number;
    students: number;
    gpa: number | null;
  };
};

function isCourseSuggestion(item: Suggestion): item is CourseSuggestion {
  return "prefix" in item && "number" in item;
}

function isInstructorSuggestion(item: Suggestion): item is InstructorSuggestion {
  return !isCourseSuggestion(item);
}

function initialCompareType(value?: string): CompareType {
  return value === "instructor" ? "instructor" : "course";
}

function oppositeType(value: CompareType): CompareType {
  return value === "course" ? "instructor" : "course";
}

function toSectionModels(course: {
  prefix: string;
  number: string;
  title: string;
  sections: Array<{
    sectionNumber: string;
    instructor: { firstName: string; lastName: string };
    grades: { A: number; B: number; C: number; D: number; F: number; P: number; NP: number; W: number; I: number };
  }>;
}) {
  return course.sections.map((section, index) => ({
    id: `${course.prefix}-${course.number}-${section.sectionNumber}-${index}`,
    sectionNumber: section.sectionNumber,
    instructor: section.instructor,
    course: { prefix: course.prefix, number: course.number, title: course.title },
    gradeA: section.grades.A,
    gradeB: section.grades.B,
    gradeC: section.grades.C,
    gradeD: section.grades.D,
    gradeF: section.grades.F,
    gradeP: section.grades.P,
    gradeNP: section.grades.NP,
    gradeW: section.grades.W,
    gradeI: section.grades.I,
    totalEnroll:
      section.grades.A +
      section.grades.B +
      section.grades.C +
      section.grades.D +
      section.grades.F +
      section.grades.P +
      section.grades.NP +
      section.grades.W +
      section.grades.I,
  }));
}

function selectionLabel(type: CompareType, selection: Selection, dataLabel?: string) {
  if (dataLabel) return dataLabel;
  if (!selection) return "";

  if (typeof selection === "string") {
    if (type === "course") {
      const [prefix, number] = selection.split(":");
      return prefix && number ? `${prefix} ${number}` : selection;
    }

    const parsed = fromInstructorSlug(selection);
    return parsed.firstName && parsed.lastName ? `${parsed.firstName} ${parsed.lastName}` : selection;
  }

  if (type === "course" && isCourseSuggestion(selection)) {
    return `${selection.prefix} ${selection.number} — ${selection.title}`;
  }

  if (type === "instructor" && isInstructorSuggestion(selection)) {
    return `${selection.firstName} ${selection.lastName}`;
  }

  return "";
}

async function loadSelectionData(type: CompareType, selection: Selection): Promise<CompareData | null> {
  if (!selection) return null;

  if (type === "course") {
    let prefix = "";
    let number = "";

    if (typeof selection === "string") {
      [prefix, number] = selection.split(":");
    } else if (isCourseSuggestion(selection)) {
      prefix = selection.prefix;
      number = selection.number;
    }

    if (!prefix || !number) return null;
    const course = await loadCourseByCode(prefix, number);
    if (!course) return null;

    const sections = toSectionModels(course);
    const aggregate = aggregateGrades(sections);
    return {
      label: `${course.prefix} ${course.number} — ${course.title}`,
      chartData: toChartData(aggregate),
      summary: {
        sections: sections.length,
        students: aggregate.totalEnroll,
        gpa: calculateGPA(aggregate),
      },
    };
  }

  let firstName = "";
  let lastName = "";

  if (typeof selection === "string") {
    const parsed = fromInstructorSlug(selection);
    firstName = parsed.firstName;
    lastName = parsed.lastName;
  } else if (isInstructorSuggestion(selection)) {
    firstName = selection.firstName;
    lastName = selection.lastName;
  }

  if (!firstName || !lastName) return null;

  const rows = await loadInstructorSections(firstName, lastName);
  if (!rows.length) return null;

  const sections = rows.map((row, index) => ({
    id: `${row.course.prefix}-${row.course.number}-${row.sectionNumber}-${index}`,
    sectionNumber: row.sectionNumber,
    instructor: row.instructor,
    course: row.course,
    gradeA: row.grades.A,
    gradeB: row.grades.B,
    gradeC: row.grades.C,
    gradeD: row.grades.D,
    gradeF: row.grades.F,
    gradeP: row.grades.P,
    gradeNP: row.grades.NP,
    gradeW: row.grades.W,
    gradeI: row.grades.I,
    totalEnroll:
      row.grades.A +
      row.grades.B +
      row.grades.C +
      row.grades.D +
      row.grades.F +
      row.grades.P +
      row.grades.NP +
      row.grades.W +
      row.grades.I,
  }));

  const aggregate = aggregateGrades(sections);
  return {
    label: `${firstName} ${lastName}`,
    chartData: toChartData(aggregate),
    summary: {
      sections: sections.length,
      students: aggregate.totalEnroll,
      gpa: calculateGPA(aggregate),
    },
  };
}

function ComparePanel({
  title,
  kind,
  onKindChange,
  query,
  onQueryChange,
  loadingResults,
  results,
  focused,
  onFocusChange,
  selected,
  data,
  loadingData,
  error,
  onSelect,
  onClear,
}: {
  title: string;
  kind: CompareType;
  onKindChange: (kind: CompareType) => void;
  query: string;
  onQueryChange: (query: string) => void;
  loadingResults: boolean;
  results: Suggestion[];
  focused: boolean;
  onFocusChange: (focused: boolean) => void;
  selected: Selection;
  data: CompareData | null;
  loadingData: boolean;
  error: string | null;
  onSelect: (item: Suggestion) => void;
  onClear: () => void;
}) {
  const [highlight, setHighlight] = useState(-1);
  const spinner = useSpinner(loadingResults || loadingData);
  const hasQuery = query.trim().length >= 2;
  const open = focused && hasQuery && (loadingResults || results.length > 0 || !!error);

  const label = (item: Suggestion) =>
    isCourseSuggestion(item) ? `${item.prefix} ${item.number}` : `${item.lastName}, ${item.firstName}`;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelect(results[Math.max(highlight, 0)]);
      setHighlight(-1);
    }
  };

  return (
    <section className="min-w-0">
      <Heading right={<button type="button" onClick={onClear} className="term-btn text-sm">clear</button>}>{title}</Heading>

      <div className="mt-3 flex items-baseline gap-[1ch] text-sm" role="radiogroup" aria-label="Compare type">
        <span className="text-neutral-500">mode:</span>
        {(["course", "instructor"] as CompareType[]).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={kind === value}
            onClick={() => onKindChange(value)}
            className={kind === value ? "bg-neutral-200 px-[1ch] text-black" : "px-[1ch] text-neutral-500 hover:text-neutral-100"}
          >
            {value === "course" ? "courses" : "professors"}
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <PromptInput
          value={query}
          onChange={(value) => {
            onQueryChange(value);
            setHighlight(-1);
          }}
          onKeyDown={onKeyDown}
          onFocusChange={onFocusChange}
          placeholder={`search ${kind === "course" ? "course code or title" : "professor name"}`}
          ariaLabel={`Search ${kind === "course" ? "courses" : "professors"}`}
        />

        {open && (
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto border border-neutral-800 bg-black py-1">
            {error ? (
              <p className="px-2 text-red-400">error: {error}</p>
            ) : loadingResults && results.length === 0 ? (
              <p className="px-2 text-neutral-500"><span className="text-term-accent">{spinner}</span> searching…</p>
            ) : results.length === 0 ? (
              <p className="px-2 text-neutral-500">  └─ no matches</p>
            ) : (
              results.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelect(item)}
                  className="flex w-full items-baseline whitespace-pre px-2 text-left"
                >
                  <span className="shrink-0 text-neutral-700">{branch(i === results.length - 1)}</span>
                  <span className={`shrink-0 ${highlight === i ? "bg-neutral-200 text-black" : "text-neutral-100"}`}>{label(item)}</span>
                  {isCourseSuggestion(item) && (
                    <span className="min-w-0 overflow-hidden text-ellipsis text-neutral-500">{"  "}{item.title}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="mt-4 min-h-[300px] min-w-0">
        {loadingData ? (
          <p className="text-neutral-500"><span className="text-term-accent">{spinner}</span> loading {selectionLabel(kind, selected)}…</p>
        ) : data ? (
          <>
            <p className="font-bold text-neutral-100">{data.label}</p>
            <p className="mb-3 text-sm text-neutral-500">
              {data.summary.sections} sections · {data.summary.students.toLocaleString()} students · gpa <GpaBadge gpa={data.summary.gpa} />
            </p>
            <GradeChart data={data.chartData} mode="percentage" />
          </>
        ) : (
          <p className="text-neutral-600">
            <span>⎿</span> pick a {kind === "course" ? "course" : "professor"} above to load its distribution
          </p>
        )}
      </div>
    </section>
  );
}

function useCompareSide(initialKind: CompareType, initialSelection: Selection) {
  const [kind, setKind] = useState<CompareType>(initialKind);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState<Selection>(initialSelection);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [data, setData] = useState<CompareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 200);

  const clear = useCallback(() => {
    setQuery("");
    setFocused(false);
    setSelected(null);
    setResults([]);
    setLoadingResults(false);
    setLoadingData(false);
    setData(null);
    setError(null);
  }, []);

  const onKindChange = useCallback(
    (nextKind: CompareType) => {
      if (nextKind === kind) return;
      setKind(nextKind);
      clear();
    },
    [clear, kind]
  );

  const onSelect = useCallback((item: Suggestion) => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase().replace(/\s+/g, " ");
    const isCourse = isCourseSuggestion(item);
    if (SEARCH_LOG_ENABLED) void fetch("/api/search-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawQuery: isCourse ? debouncedQuery : undefined,
        normalizedQuery: isCourse ? normalizedQuery : undefined,
        searchKind: isCourse ? "course" : "instructor",
        source: "compare",
        coursePrefix: isCourse ? item.prefix : undefined,
        courseNumber: isCourse ? item.number : undefined,
        courseTitle: isCourse ? item.title : undefined,
        resultCountCourses: kind === "course" ? results.length : 0,
        resultCountInstructors: kind === "instructor" ? results.length : 0,
      }),
      keepalive: true,
    });

    setSelected(item);
    setQuery("");
    setFocused(false);
    setResults([]);
    setError(null);
  }, [debouncedQuery, kind, results]);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoadingResults(false);
      setError(null);
      return;
    }

    let active = true;
    setLoadingResults(true);
    setError(null);

    searchManifest(trimmed)
      .then((result) => {
        if (!active) return;
        setResults(kind === "course" ? result.courses : result.instructors);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setResults([]);
        setError(cause instanceof Error ? cause.message : "Failed to search compare options");
      })
      .finally(() => {
        if (active) setLoadingResults(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery, kind]);

  useEffect(() => {
    let active = true;

    async function run() {
      if (!selected) {
        setData(null);
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      setError(null);
      try {
        const nextData = await loadSelectionData(kind, selected);
        if (!active) return;
        setData(nextData);
        if (!nextData) setError("That selection could not be loaded.");
      } catch (cause: unknown) {
        if (!active) return;
        setData(null);
        setError(cause instanceof Error ? cause.message : "Failed to load comparison data");
      } finally {
        if (active) setLoadingData(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [kind, selected]);

  return {
    kind,
    onKindChange,
    query,
    setQuery,
    focused,
    setFocused,
    selected,
    data,
    loadingResults,
    loadingData,
    results,
    error,
    onSelect,
    clear,
  };
}

export default function CompareClient() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") ?? undefined;
  const initialA = searchParams.get("a") ?? undefined;

  useEffect(() => {
    void fetchManifest().catch(() => undefined);
  }, []);

  const leftType = initialCompareType(initialType);
  const rightType = oppositeType(leftType);
  const initialSelection = initialA?.trim() ? initialA.trim() : null;

  const left = useCompareSide(leftType, initialSelection);
  const right = useCompareSide(rightType, null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        command="grades compare"
        title="Compare"
        subtitle="put courses and professors side by side. each side can be either kind."
      />

      <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-2">
        <ComparePanel
          title="left"
          kind={left.kind}
          onKindChange={left.onKindChange}
          query={left.query}
          onQueryChange={left.setQuery}
          loadingResults={left.loadingResults}
          results={left.results}
          focused={left.focused}
          onFocusChange={left.setFocused}
          selected={left.selected}
          data={left.data}
          loadingData={left.loadingData}
          error={left.error}
          onSelect={left.onSelect}
          onClear={left.clear}
        />
        <ComparePanel
          title="right"
          kind={right.kind}
          onKindChange={right.onKindChange}
          query={right.query}
          onQueryChange={right.setQuery}
          loadingResults={right.loadingResults}
          results={right.results}
          focused={right.focused}
          onFocusChange={right.setFocused}
          selected={right.selected}
          data={right.data}
          loadingData={right.loadingData}
          error={right.error}
          onSelect={right.onSelect}
          onClear={right.clear}
        />
      </div>
    </div>
  );
}
