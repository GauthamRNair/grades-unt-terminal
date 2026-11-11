import type { Metadata } from "next";

// The saved-courses page is a client component, so its metadata lives here.
export const metadata: Metadata = { alternates: { canonical: "/cart/" } };

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
