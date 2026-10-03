"use client";

import { useSavedCourses } from "@/context/SavedCoursesContext";
import type { CartItem } from "@/lib/types";

interface SaveForLaterButtonProps {
  item: CartItem;
}

export default function SaveForLaterButton({
  item,
}: SaveForLaterButtonProps) {
  const { addCourse, removeCourse, isSaved } = useSavedCourses();
  const isBookmarked = isSaved(item.courseId);

  return (
    <button
      onClick={() =>
        isBookmarked ? removeCourse(item.courseId) : addCourse(item)
      }
      aria-label={isBookmarked ? "Remove bookmark" : "Save bookmark"}
      className={`term-btn ${isBookmarked ? "text-term-accent-bright" : ""}`}
    >
      {isBookmarked ? "saved ✓" : "save"}
    </button>
  );
}
