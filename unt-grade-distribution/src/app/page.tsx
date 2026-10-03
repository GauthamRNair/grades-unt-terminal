"use client";

import { useEffect } from "react";
import Link from "next/link";
import TerminalSearch from "@/components/TerminalSearch";
import BookmarkIcon from "@/components/BookmarkIcon";

export default function Home() {
  // Home is a single screen; results scroll inside it without a visible bar.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("no-scrollbar");
    return () => root.classList.remove("no-scrollbar");
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 pt-[22vh] pb-16 sm:px-6">
        <div className="select-none">
          <p className="text-neutral-500">
            <span className="text-term-accent">$</span> grades --school &quot;University of North Texas&quot;
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-100 sm:text-5xl">UNT Grade Explorer</h1>
          <p className="mt-1 text-neutral-500">explore grade distributions for UNT classes</p>
          <p className="mt-1 text-neutral-600"># try &quot;ACCT 2010&quot; or &quot;Moore&quot; · ↑↓←→ to move · enter to open</p>
        </div>

        <TerminalSearch variant="hero" autoFocus className="mt-8 text-lg" />
      </div>

      <footer className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-5 gap-y-1 px-4 pb-6 text-sm text-neutral-600 sm:px-6">
        <Link href="/compare" className="term-link text-neutral-500">compare</Link>
        <BookmarkIcon />
        <Link href="/terms" className="term-link text-neutral-500">terms</Link>
        <a href="https://ko-fi.com/S6S61VT6MR" target="_blank" rel="noreferrer" className="term-link text-neutral-500">
          ko-fi
        </a>
      </footer>
    </div>
  );
}
