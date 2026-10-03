import CourseClient from "./CourseClient";
import { courseParams, IS_STATIC_EXPORT } from "@/lib/staticParams";

// The normal build renders on demand; the static export pre-renders every course.
export function generateStaticParams() {
  return IS_STATIC_EXPORT ? courseParams() : [];
}

export default function CoursePage() {
  return <CourseClient />;
}
