"use client";

import { useState, useCallback } from "react";
import { BASE_PATH } from "@/lib/deploy";

interface ShareButtonProps {
  url: string;
  compact?: boolean;
}

export default function ShareButton({ url, compact = false }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const fullUrl = typeof window !== "undefined"
        ? `${window.location.origin}${BASE_PATH}${url}`
        : url;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const fullUrl = `${window.location.origin}${BASE_PATH}${url}`;
      const textarea = document.createElement("textarea");
      textarea.value = fullUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  return (
    <button
      onClick={handleCopy}
      className={`term-btn ${copied ? "text-term-accent-bright" : ""} ${compact ? "text-xs" : ""}`}
      title="Copy link to clipboard"
    >
      {copied ? "copied ✓" : "share"}
    </button>
  );
}
