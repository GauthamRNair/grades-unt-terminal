import type { Metadata } from "next";
import InstructorClient from "./InstructorClient";
import { instructorParams, IS_STATIC_EXPORT } from "@/lib/staticParams";
import { instructorPath } from "@/lib/sitePaths";

// The normal build renders on demand; the static export pre-renders every instructor.
export function generateStaticParams() {
  return IS_STATIC_EXPORT ? instructorParams() : [];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { alternates: { canonical: instructorPath(id) } };
}

export default function InstructorPage() {
  return <InstructorClient />;
}
