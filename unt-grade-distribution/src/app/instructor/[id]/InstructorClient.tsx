"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { aggregateGrades, calculateGPA, toChartData } from "@/lib/grades";
import GpaBadge from "@/components/GpaBadge";
import SectionCard from "@/components/SectionCard";
import GradeChart from "@/components/GradeChart";
import { Heading, PageHeader, Spinner } from "@/components/term/Primitives";
import { SemesterCheckboxGroup, type SemesterSelection } from "@/components/SemesterControls";
import { fromInstructorSlug, loadInstructorSections } from "@/lib/encryptedData";
import { groupBySemester, semesterLabel } from "@/lib/semester";

type SectionWithCourse = {
  sectionNumber: string;
  year: string | null;
  term: string | null;
  instructor: { firstName: string; lastName: string };
  grades: { A: number; B: number; C: number; D: number; F: number; P: number; NP: number; W: number; I: number };
  course: { prefix: string; number: string; title: string };
};

export default function InstructorClient() {
  const params = useParams<{ id: string }>();
  const slug = params?.id || "";
  const { firstName, lastName } = useMemo(() => fromInstructorSlug(slug), [slug]);

  const [sections, setSections] = useState<SectionWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distributionSemesters, setDistributionSemesters] = useState<SemesterSelection>("all");
  const [sectionSemesters, setSectionSemesters] = useState<SemesterSelection>("all");

  useEffect(() => {
    if (!firstName || !lastName) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    let mounted = true;
    queueMicrotask(() => {
      if (!mounted) return;
      setLoading(true);
      setError(null);
    });

    loadInstructorSections(firstName, lastName)
      .then((data) => {
        if (!mounted) return;
        setSections(data as SectionWithCourse[]);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to decrypt instructor data");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [firstName, lastName]);

  const normalizedSections = useMemo(
    () =>
      sections.map((s, idx) => ({
        id: `${s.course.prefix}-${s.course.number}-${s.sectionNumber}-${idx}`,
        sectionNumber: s.sectionNumber,
        year: s.year,
        term: s.term,
        instructor: s.instructor,
        course: s.course,
        gradeA: s.grades.A,
        gradeB: s.grades.B,
        gradeC: s.grades.C,
        gradeD: s.grades.D,
        gradeF: s.grades.F,
        gradeP: s.grades.P,
        gradeNP: s.grades.NP,
        gradeW: s.grades.W,
        gradeI: s.grades.I,
        totalEnroll:
          s.grades.A + s.grades.B + s.grades.C + s.grades.D + s.grades.F + s.grades.P + s.grades.NP + s.grades.W + s.grades.I,
      })),
    [sections]
  );

  const overallAggregate = useMemo(() => aggregateGrades(normalizedSections), [normalizedSections]);
  const overallGPA = useMemo(() => calculateGPA(overallAggregate), [overallAggregate]);
  const semesterGroups = useMemo(() => groupBySemester(normalizedSections), [normalizedSections]);
  const semesterLabels = useMemo(() => semesterGroups.map((group) => group.label), [semesterGroups]);
  const summarySemesterLabels = useMemo(() => [...semesterLabels].reverse(), [semesterLabels]);
  const activeDistributionSemesterLabels = distributionSemesters === "all"
    ? semesterLabels
    : distributionSemesters.filter((label) => semesterLabels.includes(label));
  const distributionSections = useMemo(
    () => distributionSemesters === "all"
      ? normalizedSections
      : normalizedSections.filter((section) => activeDistributionSemesterLabels.includes(semesterLabel(section))),
    [activeDistributionSemesterLabels, distributionSemesters, normalizedSections]
  );
  const distributionAggregate = useMemo(() => aggregateGrades(distributionSections), [distributionSections]);
  const distributionGPA = useMemo(() => calculateGPA(distributionAggregate), [distributionAggregate]);
  const visibleSemesterLabels = sectionSemesters === "all"
    ? summarySemesterLabels
    : summarySemesterLabels.filter((label) => sectionSemesters.includes(label));
  const visibleSemesterGroups = useMemo(
    () => semesterGroups.filter((group) => visibleSemesterLabels.includes(group.label)),
    [semesterGroups, visibleSemesterLabels]
  );
  const visibleSections = useMemo(
    () => normalizedSections.filter((section) => visibleSemesterLabels.includes(semesterLabel(section))),
    [normalizedSections, visibleSemesterLabels]
  );
  const allCourseCount = useMemo(
    () => new Set(normalizedSections.map((section) => `${section.course.prefix}:${section.course.number}`)).size,
    [normalizedSections]
  );

  const courseGroups = useMemo(() => {
    const map = new Map<string, { course: { prefix: string; number: string; title: string }; sections: typeof normalizedSections }>();
    for (const section of visibleSections) {
      const key = `${section.course.prefix}:${section.course.number}`;
      const existing = map.get(key);
      if (existing) {
        existing.sections.push(section);
      } else {
        map.set(key, {
          course: section.course,
          sections: [section],
        });
      }
    }
    return Array.from(map.values());
  }, [visibleSections]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="mb-2 text-neutral-500"><span className="text-term-accent">$</span> grades instructor &quot;{lastName}, {firstName}&quot;</p>
        <Spinner label="decrypting instructor data…" />
      </div>
    );
  }

  if (error || !firstName || !lastName || sections.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="mb-2 text-neutral-500"><span className="text-term-accent">$</span> grades instructor {firstName && lastName ? `"${lastName}, ${firstName}"` : slug}</p>
        <p className="text-red-400">error: {error ?? "instructor not found"}</p>
        <Link href="/" className="term-btn mt-4">back home</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        command={`grades instructor "${lastName}, ${firstName}"`}
        title={`${firstName} ${lastName}`}
        actions={
          <Link
            href={`/compare?type=instructor&a=${encodeURIComponent(`${lastName},${firstName}`)}`}
            className="term-btn"
            title="Compare with another instructor"
          >
            compare
          </Link>
        }
        subtitle={
          <>
            gpa <GpaBadge gpa={overallGPA} /> · {normalizedSections.length} sections · {semesterGroups.length} semester{semesterGroups.length !== 1 ? "s" : ""} · {allCourseCount} course{allCourseCount !== 1 ? "s" : ""} taught
          </>
        }
      />

      <section className="mb-10 min-w-0">
        <Heading>grade distribution</Heading>
        <p className="mt-1 text-sm text-neutral-500">
          {distributionSemesters === "all" ? "all semesters" : `${activeDistributionSemesterLabels.length} selected`} · {distributionSections.length} section{distributionSections.length !== 1 ? "s" : ""} · gpa <GpaBadge gpa={distributionGPA} />
        </p>
        <div className="mt-3">
          <SemesterCheckboxGroup
            id="instructor-distribution-semester"
            labels={semesterLabels}
            value={distributionSemesters}
            onChange={setDistributionSemesters}
          />
        </div>
        <div className="mt-4 max-w-4xl">
          <GradeChart data={toChartData(distributionAggregate)} />
        </div>
      </section>

      <section className="mb-10 min-w-0">
        <Heading right={<span className="hidden text-sm sm:inline">{sectionSemesters === "all" ? "all semesters" : `${visibleSemesterLabels.length} selected`}</span>}>
          semester summary
        </Heading>
        <div className="mt-3 mb-4">
          <SemesterCheckboxGroup
            id="instructor-summary-semesters"
            labels={summarySemesterLabels}
            value={sectionSemesters}
            onChange={setSectionSemesters}
          />
        </div>
        <div className="max-w-3xl overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-neutral-500">
              <tr>
                <th className="pr-6 font-normal">semester</th>
                <th className="pr-6 text-right font-normal">sections</th>
                <th className="pr-6 text-right font-normal">students</th>
                <th className="text-right font-normal">gpa</th>
              </tr>
            </thead>
            <tbody>
              {visibleSemesterGroups.map(({ label, items }) => {
                const semesterAggregate = aggregateGrades(items);
                return (
                  <tr key={label} className="hover:bg-neutral-900">
                    <td className="pr-6 text-neutral-100">{label.toLowerCase()}</td>
                    <td className="pr-6 text-right">{items.length}</td>
                    <td className="pr-6 text-right">{semesterAggregate.totalEnroll.toLocaleString()}</td>
                    <td className="text-right"><GpaBadge gpa={calculateGPA(semesterAggregate)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="min-w-0">
        <Heading>courses in selected semesters</Heading>
        <div className="mt-4 space-y-8">
          {courseGroups.map(({ course, sections }) => (
            <div key={`${course.prefix}-${course.number}`}>
              <p className="mb-3 min-w-0 break-words text-sm">
                <span className="text-term-accent">▸</span>{" "}
                <Link href={`/course/${course.prefix}/${course.number}`} className="term-link font-bold">
                  {course.prefix} {course.number}
                </Link>
                <span className="text-neutral-500">{"  "}{course.title}</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sections.map((section) => (
                  <SectionCard key={section.id} section={section} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
