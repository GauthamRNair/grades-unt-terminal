import InstructorClient from "./InstructorClient";
import { instructorParams, IS_STATIC_EXPORT } from "@/lib/staticParams";

// The normal build renders on demand; the static export pre-renders every instructor.
export function generateStaticParams() {
  return IS_STATIC_EXPORT ? instructorParams() : [];
}

export default function InstructorPage() {
  return <InstructorClient />;
}
