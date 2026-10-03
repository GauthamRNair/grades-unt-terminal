"use client";

import { useEffect, useState } from "react";

export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useSpinner(active = true) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length), 80);
    return () => clearInterval(id);
  }, [active]);
  return SPINNER_FRAMES[frame];
}

/** `⠋ loading…` line. */
export function Spinner({ label }: { label: string }) {
  const frame = useSpinner();
  return (
    <p className="text-neutral-500" aria-busy="true" aria-live="polite">
      <span className="text-term-accent">{frame}</span> {label}
    </p>
  );
}

/** `── title ─────────────` section heading with an optional right-side slot. */
export function Heading({
  children,
  right,
  as: Tag = "h2",
  className = "",
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 items-center gap-[1ch] text-neutral-500 ${className}`}>
      <span aria-hidden className="shrink-0">──</span>
      <Tag className="min-w-0 shrink-0 font-normal text-neutral-300">{children}</Tag>
      <span aria-hidden className="term-rule h-px min-w-0 flex-1 bg-neutral-800" />
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/**
 * Page header rendered as a shell command followed by its output:
 *   $ grades course CSCE 1030
 *   CSCE 1030  Computer Science I
 */
export function PageHeader({
  command,
  title,
  subtitle,
  actions,
  children,
}: {
  command: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-8">
      <p className="select-none text-neutral-500">
        <span className="text-term-accent">$</span> {command}
      </p>
      <div className="mt-2 flex min-w-0 flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <h1 className="min-w-0 whitespace-pre-wrap break-words text-2xl font-bold text-neutral-100 sm:text-3xl">
          <Typed text={typeof title === "string" ? title : undefined}>{title}</Typed>
        </h1>
        {actions && <div className="flex flex-wrap items-center gap-x-3 gap-y-1">{actions}</div>}
      </div>
      {subtitle && <p className="mt-1 text-neutral-500">{subtitle}</p>}
      {children}
    </header>
  );
}

/** Types `text` out quickly on mount; renders `children` as-is when no text is given. */
export function Typed({ text, children, charMs = 12 }: { text?: string; children?: React.ReactNode; charMs?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!text) return;
    const reduced = prefersReducedMotion();
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const n = Math.floor((now - start) / charMs);
      setShown(Math.min(n, text.length));
      if (n < text.length) raf = requestAnimationFrame(tick);
    };
    if (!reduced) raf = requestAnimationFrame(tick);
    // Finishes instantly for reduced motion, and guarantees completion if rAF is paused.
    const done = setTimeout(() => setShown(text.length), reduced ? 0 : text.length * charMs + 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [text, charMs]);

  if (!text) return <>{children}</>;
  // The full text is always in the DOM (for screen readers, copy and layout); the untyped tail is just transparent.
  return (
    <>
      {text.slice(0, shown)}
      <span className="opacity-0">{text.slice(shown)}</span>
    </>
  );
}

/** Tree branch prefix for list rows. */
export function branch(last: boolean) {
  return last ? "└─ " : "├─ ";
}
