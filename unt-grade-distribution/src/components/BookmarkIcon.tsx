"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSavedCourses } from "@/context/SavedCoursesContext";

/** `saved[3]` link to the saved-courses page. */
export default function BookmarkIcon() {
  const { items } = useSavedCourses();
  const pathname = usePathname();
  const count = items.length;

  return (
    <Link
      href="/cart"
      className={`term-link whitespace-nowrap ${pathname === "/cart" ? "text-term-accent" : ""}`}
      aria-label={`Saved courses with ${count} items`}
    >
      saved<span className="text-neutral-500">[</span>
      <span className={count > 0 ? "text-term-accent-bright" : "text-neutral-500"}>{count}</span>
      <span className="text-neutral-500">]</span>
    </Link>
  );
}
