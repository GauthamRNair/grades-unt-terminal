"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { aggregateGrades, calculateGPA, toChartData } from "@/lib/grades";
import GpaBadge from "@/components/GpaBadge";
import SectionCard from "@/components/SectionCard";
import GradeChart from "@/components/GradeChart";
import Link from "next/link";
import { Heading, PageHeader, Spinner } from "@/components/term/Primitives";
import CourseSaveButton from "@/components/CourseSaveButton";
import ShareButton from "@/components/ShareButton";
import { SemesterCheckboxGroup, type SemesterSelection } from "@/components/SemesterControls";
import { loadCourseByCode } from "@/lib/encryptedData";
import { groupBySemester, semesterLabel } from "@/lib/semester";

type CourseData = {
  prefix: string;
  number: string;
  title: string;
  sections: Array<{
    sectionNumber: string;
    instructor: { firstName: string; lastName: string };
    year: string | null;
    term: string | null;
    grades: { A: number; B: number; C: number; D: number; F: number; P: number; NP: number; W: number; I: number };
  }>;
};

function toSectionModel(course: CourseData) {
  return course.sections.map((s, idx) => ({
    id: `${course.prefix}-${course.number}-${s.sectionNumber}-${idx}`,
    sectionNumber: s.sectionNumber,
    year: s.year,
    term: s.term,
    instructor: s.instructor,
    course: { prefix: course.prefix, number: course.number, title: course.title },
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
  }));
}

function stableCourseId(prefix: string, number: string) {
  let hash = 0;
  const text = `${prefix}:${number}`;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export default function CourseClient() {
  const params = useParams<{ prefix: string; number: string }>();
  const prefix = (params?.prefix || "").toUpperCase();
  const number = params?.number || "";

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distributionSemesters, setDistributionSemesters] = useState<SemesterSelection>("all");
  const [sectionSemesters, setSectionSemesters] = useState<SemesterSelection>("all");

  useEffect(() => {
    if (!prefix || !number) return;
    let mounted = true;
    queueMicrotask(() => {
      if (!mounted) return;
      setLoading(true);
      setError(null);
    });

    loadCourseByCode(prefix, number)
      .then((data) => {
        if (!mounted) return;
        setCourse(data as CourseData | null);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to decrypt course data");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [prefix, number]);

  const sections = useMemo(() => (course ? toSectionModel(course) : []), [course]);
  const aggregate = useMemo(() => aggregateGrades(sections), [sections]);
  const overallGPA = useMemo(() => calculateGPA(aggregate), [aggregate]);
  const semesterGroups = useMemo(() => groupBySemester(sections), [sections]);
  const semesterLabels = useMemo(() => semesterGroups.map((group) => group.label), [semesterGroups]);
  const summarySemesterLabels = useMemo(() => [...semesterLabels].reverse(), [semesterLabels]);
  const activeDistributionSemesterLabels = distributionSemesters === "all"
    ? semesterLabels
    : distributionSemesters.filter((label) => semesterLabels.includes(label));
  const distributionSections = useMemo(
    () => distributionSemesters === "all"
      ? sections
      : sections.filter((section) => activeDistributionSemesterLabels.includes(semesterLabel(section))),
    [activeDistributionSemesterLabels, distributionSemesters, sections]
  );
  const distributionAggregate = useMemo(() => aggregateGrades(distributionSections), [distributionSections]);
  const distributionChartData = useMemo(() => toChartData(distributionAggregate), [distributionAggregate]);
  const distributionGPA = useMemo(() => calculateGPA(distributionAggregate), [distributionAggregate]);
  const visibleSemesterLabels = sectionSemesters === "all"
    ? summarySemesterLabels
    : summarySemesterLabels.filter((label) => sectionSemesters.includes(label));
  const visibleSemesterGroups = useMemo(
    () => semesterGroups.filter((group) => visibleSemesterLabels.includes(group.label)),
    [semesterGroups, visibleSemesterLabels]
  );
  const visibleSections = useMemo(
    () => sections.filter((section) => visibleSemesterLabels.includes(semesterLabel(section))),
    [sections, visibleSemesterLabels]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="mb-2 text-neutral-500"><span className="text-term-accent">$</span> grades course {prefix} {number}</p>
        <Spinner label="decrypting course data…" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="mb-2 text-neutral-500"><span className="text-term-accent">$</span> grades course {prefix} {number}</p>
        <p className="text-red-400">error: {error ?? "course not found"}</p>
        <Link href="/" className="term-btn mt-4">back home</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        command={`grades course ${course.prefix} ${course.number}`}
        title={`${course.prefix} ${course.number}  ${course.title}`}
        actions={
          <>
            <ShareButton url={`/course/${course.prefix}/${course.number}`} />
            <CourseSaveButton
              item={{
                courseId: stableCourseId(course.prefix, course.number),
                prefix: course.prefix,
                number: course.number,
                title: course.title,
                gpa: overallGPA,
                gradeA: aggregate.gradeA,
                gradeB: aggregate.gradeB,
                gradeC: aggregate.gradeC,
                gradeD: aggregate.gradeD,
                gradeF: aggregate.gradeF,
                gradeP: aggregate.gradeP,
                gradeNP: aggregate.gradeNP,
                gradeW: aggregate.gradeW,
                gradeI: aggregate.gradeI,
                totalEnroll: aggregate.totalEnroll,
                sectionCount: sections.length,
              }}
            />
            <Link href={`/compare?type=course&a=${course.prefix}:${course.number}`} className="term-btn" title="Compare with another course">
              compare
            </Link>
          </>
        }
        subtitle={
          <>
            gpa <GpaBadge gpa={overallGPA} /> · {sections.length} sections · {semesterGroups.length} semester{semesterGroups.length !== 1 ? "s" : ""} · {aggregate.totalEnroll.toLocaleString()} students
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
            id="course-distribution-semester"
            labels={semesterLabels}
            value={distributionSemesters}
            onChange={setDistributionSemesters}
          />
        </div>
        <div className="mt-4 max-w-4xl">
          <GradeChart data={distributionChartData} />
        </div>
      </section>

      <section className="mb-10 min-w-0">
        <Heading right={<span className="hidden text-sm sm:inline">{sectionSemesters === "all" ? "all semesters" : `${visibleSemesterLabels.length} selected`}</span>}>
          sections by semester
        </Heading>
        <div className="mt-3 mb-6">
          <SemesterCheckboxGroup
            id="course-summary-semesters"
            labels={summarySemesterLabels}
            value={sectionSemesters}
            onChange={setSectionSemesters}
          />
        </div>

        <div className="space-y-8">
          {visibleSemesterGroups.map(({ label, items }) => {
            const semesterAggregate = aggregateGrades(items);
            return (
              <section key={label}>
                <p className="mb-3 text-sm">
                  <span className="text-term-accent">▸</span> <span className="font-bold text-neutral-100">{label.toLowerCase()}</span>
                  <span className="text-neutral-500">
                    {"  "}{items.length} section{items.length !== 1 ? "s" : ""} · {semesterAggregate.totalEnroll.toLocaleString()} students · gpa{" "}
                  </span>
                  <GpaBadge gpa={calculateGPA(semesterAggregate)} />
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((section) => (
                    <SectionCard key={section.id} section={section} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
