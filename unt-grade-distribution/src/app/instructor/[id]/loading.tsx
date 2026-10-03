import { Spinner } from "@/components/term/Primitives";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Spinner label="loading…" />
    </div>
  );
}
