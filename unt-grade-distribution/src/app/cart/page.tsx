"use client";

import Link from "next/link";
import { useSavedCourses } from "@/context/SavedCoursesContext";
import { downloadCartPDF } from "@/lib/pdf";
import GpaBadge from "@/components/GpaBadge";
import GradeChart from "@/components/GradeChart";
import { PageHeader } from "@/components/term/Primitives";
import { toChartData, calculateGPA } from "@/lib/grades";
import type { CartItem } from "@/lib/types";

export default function CartPage() {
  const { items, removeCourse, clearCart } = useSavedCourses();

  const handleDownload = () => {
    if (items.length === 0) return;
    downloadCartPDF(items);
  };

  // Compute overall averages
  const overallGPA =
    items.length > 0
      ? calculateGPA(
          items.reduce(
            (acc, item) => ({
              gradeA: acc.gradeA + item.gradeA,
              gradeB: acc.gradeB + item.gradeB,
              gradeC: acc.gradeC + item.gradeC,
              gradeD: acc.gradeD + item.gradeD,
              gradeF: acc.gradeF + item.gradeF,
              gradeP: acc.gradeP + item.gradeP,
              gradeNP: acc.gradeNP + item.gradeNP,
              gradeW: acc.gradeW + item.gradeW,
              gradeI: acc.gradeI + item.gradeI,
              totalEnroll: acc.totalEnroll + item.totalEnroll,
            }),
            {
              gradeA: 0,
              gradeB: 0,
              gradeC: 0,
              gradeD: 0,
              gradeF: 0,
              gradeP: 0,
              gradeNP: 0,
              gradeW: 0,
              gradeI: 0,
              totalEnroll: 0,
            }
          )
        )
      : null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <PageHeader command="grades saved --list" title="no saved courses yet" />
        <p className="text-neutral-500">
          <span className="text-neutral-600">⎿</span> save courses to compare grade distributions and download a pdf summary.
        </p>
        <Link href="/" className="term-btn mt-4">browse courses</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        command="grades saved --list"
        title="Saved Courses"
        subtitle={
          <>
            {items.length} bookmark{items.length !== 1 ? "s" : ""}
            {overallGPA !== null && (
              <>
                {" · "}combined gpa <GpaBadge gpa={overallGPA} />
              </>
            )}
          </>
        }
        actions={
          <>
            <button onClick={handleDownload} className="term-btn">download pdf</button>
            <button onClick={clearCart} className="term-btn text-red-400">clear all</button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item: CartItem) => (
          <CartCourseCard
            key={item.courseId}
            item={item}
            onRemove={() => removeCourse(item.courseId)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Individual course card ──────────────────────────── */
function CartCourseCard({
  item,
  onRemove,
}: {
  item: CartItem;
  onRemove: () => void;
}) {
  const chartData = toChartData(item);

  return (
    <div className="min-w-0 border border-neutral-800 px-3 pb-2 pt-1 transition-colors hover:border-neutral-600">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <Link href={`/course/${item.prefix}/${item.number}`} className="term-link min-w-0 truncate font-bold">
          {item.prefix} {item.number}
        </Link>
        <button onClick={onRemove} className="term-btn text-xs" aria-label="Remove saved course">
          remove
        </button>
      </div>
      <p className="truncate text-sm text-neutral-500">{item.title}</p>
      <p className="mb-2 text-xs text-neutral-500">
        gpa <GpaBadge gpa={item.gpa} /> · {item.sectionCount} sections · {item.totalEnroll.toLocaleString()} students
      </p>
      <GradeChart data={chartData} dense />
    </div>
  );
}
