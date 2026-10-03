"use client";

import { GRADE_COLORS, LETTER_GRADES } from "@/lib/grades";
import type { ChartDataPoint } from "@/lib/grades";

interface GradeChartProps {
  data: ChartDataPoint[];
  mode?: "count" | "percentage";
  /** Smaller layout for cards: hides empty non-letter grades. */
  dense?: boolean;
}

const BLOCKS = "█".repeat(160);

/**
 * Horizontal ASCII bar chart:
 *   A   ████████████████▌   412  38.2%
 */
export default function GradeChart({ data, mode = "count", dense = false }: GradeChartProps) {
  const rows = dense
    ? data.filter((d) => d.count > 0 || (LETTER_GRADES as readonly string[]).includes(d.grade))
    : data;
  const value = (d: ChartDataPoint) => (mode === "count" ? d.count : d.percentage);
  const max = Math.max(1, ...rows.map(value));
  const countWidth = Math.max(...rows.map((d) => d.count.toLocaleString().length));

  return (
    <div role="img" aria-label="Grade distribution" className={`min-w-0 ${dense ? "text-[13px] leading-5" : "leading-6"}`}>
      {rows.map((d, i) => {
        const pct = (value(d) / max) * 100;
        const empty = d.count === 0;
        return (
          <div key={d.grade} className="flex min-w-0 items-baseline gap-[1ch] whitespace-pre" title={`${d.grade}: ${d.count} (${d.percentage}%)`}>
            <span className={`w-[2ch] shrink-0 ${empty ? "text-neutral-700" : "text-neutral-300"}`}>{d.grade}</span>
            <span className="relative min-w-0 flex-1 overflow-hidden">
              <span aria-hidden>{" "}</span>
              <span
                aria-hidden
                className="term-grow absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${pct}%`, color: GRADE_COLORS[d.grade], animationDelay: `${i * 40}ms` }}
              >
                {BLOCKS}
              </span>
            </span>
            <span className={`shrink-0 text-right ${empty ? "text-neutral-700" : "text-neutral-300"}`} style={{ width: `${countWidth}ch` }}>
              {d.count.toLocaleString()}
            </span>
            <span className={`w-[6ch] shrink-0 text-right ${empty ? "text-neutral-700" : "text-neutral-500"}`}>
              {d.percentage.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
