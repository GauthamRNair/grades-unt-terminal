import { calculateGPA } from "@/lib/grades";
import type { GradeData } from "@/lib/grades";

interface GpaBadgeProps {
  gpa?: number | null;
  data?: GradeData;
  label?: string;
}

function gpaTextColor(gpa: number | null) {
  if (gpa === null) return "text-neutral-500";
  if (gpa >= 3.5) return "text-green-400";
  if (gpa >= 2.5) return "text-yellow-300";
  if (gpa >= 2.0) return "text-orange-400";
  return "text-red-400";
}

/** Colored GPA value, e.g. `3.42`. */
export default function GpaBadge({ gpa, data, label = "Average GPA" }: GpaBadgeProps) {
  const value = gpa !== undefined ? gpa : data ? calculateGPA(data) : null;
  const displayValue = value !== null ? value.toFixed(2) : "N/A";

  return (
    <span className={`font-bold ${gpaTextColor(value)}`} title={label} aria-label={`${label}: ${displayValue}`}>
      {displayValue}
    </span>
  );
}
