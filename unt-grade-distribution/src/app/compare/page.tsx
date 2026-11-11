import type { Metadata } from "next";
import { Suspense } from "react";
import CompareClient from "./CompareClient";

// The ?type=&a= query only pre-fills the panels, so every variant shares one canonical URL.
export const metadata: Metadata = { alternates: { canonical: "/compare/" } };

// CompareClient reads ?type=&a= itself so the page can also be exported statically.
export default function ComparePage() {
  return (
    <Suspense>
      <CompareClient />
    </Suspense>
  );
}
