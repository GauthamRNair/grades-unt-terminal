"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TerminalSearch from "./TerminalSearch";
import BookmarkIcon from "./BookmarkIcon";

const KOFI_URL = "https://ko-fi.com/S6S61VT6MR";

/** One-line terminal status bar. Hidden on the home page, which is just the prompt. */
export default function Navbar() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-800 bg-black text-sm">
      <div className="mx-auto flex h-10 max-w-6xl items-center gap-x-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0 select-none font-bold text-term-accent hover:text-term-accent-bright">
          unt-grades
        </Link>
        <span aria-hidden className="hidden shrink-0 text-neutral-700 sm:inline">│</span>
        <TerminalSearch variant="inline" placeholder="search  (press /)" className="flex-1" />
        <div className="flex shrink-0 items-center gap-x-3">
          <span aria-hidden className="hidden text-neutral-700 sm:inline">│</span>
          <Link href="/compare" className={`term-link hidden sm:inline ${pathname.startsWith("/compare") ? "text-term-accent" : ""}`}>
            compare
          </Link>
          <span aria-hidden className="hidden text-neutral-700 sm:inline">│</span>
          <BookmarkIcon />
          <span aria-hidden className="hidden text-neutral-700 md:inline">│</span>
          <a href={KOFI_URL} target="_blank" rel="noreferrer" className="term-link hidden text-neutral-500 md:inline">
            ko-fi
          </a>
        </div>
      </div>
    </nav>
  );
}
