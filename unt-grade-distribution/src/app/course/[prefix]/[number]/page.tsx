import type { Metadata } from "next";
import CourseClient from "./CourseClient";
import { courseParams, IS_STATIC_EXPORT } from "@/lib/staticParams";
import { coursePath } from "@/lib/sitePaths";

// The normal build renders on demand; the static export pre-renders every course.
export function generateStaticParams() {
  return IS_STATIC_EXPORT ? courseParams() : [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ prefix: string; number: string }>;
}): Promise<Metadata> {
  const { prefix, number } = await params;
  return { alternates: { canonical: coursePath(prefix, number) } };
}

export default function CoursePage() {
  return <CourseClient />;
}
