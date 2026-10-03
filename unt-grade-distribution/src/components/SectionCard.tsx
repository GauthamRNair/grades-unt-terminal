"use client";

import Link from "next/link";
import GpaBadge from "./GpaBadge";
import GradeChart from "./GradeChart";
import { calculateGPA, toChartData } from "@/lib/grades";
import ShareButton from "./ShareButton";
import { toInstructorSlug } from "@/lib/encryptedData";
import { semesterLabel } from "@/lib/semester";

type SectionCardData = {
  id: number | string;
  sectionNumber: string;
  instructorId?: number | string;
  instructor: { firstName: string; lastName: string };
  course: { prefix: string; number: string; title?: string };
  year?: string | null;
  term?: string | null;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  gradeD: number;
  gradeF: number;
  gradeP: number;
  gradeNP: number;
  gradeW: number;
  gradeI: number;
  totalEnroll: number;
};

interface SectionCardProps {
  section: SectionCardData;
  showCourse?: boolean;
}

/** A section rendered as a bordered terminal pane with a mini ASCII chart. */
export default function SectionCard({
  section,
  showCourse = false,
}: SectionCardProps) {
  const gpa = calculateGPA(section);
  const chartData = toChartData(section);
  const semester = semesterLabel(section);
  const instructorSlug = toInstructorSlug(
    section.instructor.firstName,
    section.instructor.lastName
  );

  return (
    <div className="min-w-0 border border-neutral-800 px-3 pb-2 pt-1 transition-colors hover:border-neutral-600">
      <div className="mb-1 flex min-w-0 items-baseline justify-between gap-3 text-sm">
        <div className="min-w-0 truncate">
          {showCourse && (
            <Link href={`/course/${section.course.prefix}/${section.course.number}`} className="term-link mr-2">
              {section.course.prefix} {section.course.number}
            </Link>
          )}
          <span className="text-neutral-500">{semester.toLowerCase()} · sec {section.sectionNumber}</span>
        </div>
        <GpaBadge gpa={gpa} />
      </div>
      <div className="mb-2 flex min-w-0 items-baseline justify-between gap-3 text-sm">
        <Link href={`/instructor/${instructorSlug}`} className="term-link min-w-0 truncate">
          {section.instructor.lastName}, {section.instructor.firstName}
        </Link>
        <ShareButton url={`/instructor/${instructorSlug}`} compact />
      </div>
      <GradeChart data={chartData} dense />
      <div className="mt-1 text-right text-xs text-neutral-600">
        {section.totalEnroll} students
      </div>
    </div>
  );
}
