import { Suspense } from "react";
import CompareClient from "./CompareClient";

// CompareClient reads ?type=&a= itself so the page can also be exported statically.
export default function ComparePage() {
  return (
    <Suspense>
      <CompareClient />
    </Suspense>
  );
}
