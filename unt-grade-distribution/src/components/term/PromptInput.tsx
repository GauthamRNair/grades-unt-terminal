"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocusChange?: (focused: boolean) => void;
  placeholder?: string;
  autoFocus?: boolean;
  ariaLabel: string;
  symbol?: string;
  className?: string;
}

/**
 * A `❯` prompt with a custom blinking block cursor. The real <input> sits
 * invisibly on top so native editing, selection and IME all still work.
 */
const PromptInput = forwardRef<HTMLInputElement, PromptInputProps>(function PromptInput(
  { value, onChange, onKeyDown, onFocusChange, placeholder, autoFocus, ariaLabel, symbol = "❯", className = "" },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
  const [caret, setCaret] = useState(0);
  const [focused, setFocused] = useState(false);

  // React skips `autoFocus` when hydrating server-rendered markup, so focus explicitly.
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const syncCaret = () => setCaret(inputRef.current?.selectionStart ?? value.length);
  const pos = Math.min(caret, value.length);
  const showPlaceholder = !value && !focused && placeholder;

  return (
    <div
      className={`relative flex min-w-0 cursor-text items-baseline ${className}`}
      onMouseDown={(e) => {
        e.preventDefault();
        inputRef.current?.focus();
      }}
    >
      <span className="mr-[1ch] shrink-0 select-none text-term-accent">{symbol}</span>
      <span className="min-w-0 overflow-hidden whitespace-pre text-neutral-100">
        {showPlaceholder ? (
          <span className="text-neutral-600">{placeholder}</span>
        ) : (
          <>
            {value.slice(0, pos)}
            <span className={focused ? "term-blink" : ""}>{value[pos] ?? " "}</span>
            {value.slice(pos + 1)}
          </>
        )}
      </span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCaret(e.target.selectionStart ?? e.target.value.length);
        }}
        onKeyDown={onKeyDown}
        onKeyUp={syncCaret}
        onSelect={syncCaret}
        onFocus={() => {
          setFocused(true);
          onFocusChange?.(true);
        }}
        onBlur={() => {
          setFocused(false);
          onFocusChange?.(false);
        }}
        spellCheck={false}
        autoComplete="off"
        aria-label={ariaLabel}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </div>
  );
});

export default PromptInput;
