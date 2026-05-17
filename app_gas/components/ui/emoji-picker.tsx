"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EMOJI_CATALOG, searchEmoji } from "@/lib/emoji-catalog";

type Props = {
  /** Form field name — used by FormData on the parent form. */
  name: string;
  /** Initial emoji value. */
  value: string;
  /** Optional callback when the user picks/types an emoji. */
  onChange?: (emoji: string) => void;
};

/**
 * Searchable emoji picker. Renders as a small button showing the current
 * emoji. Clicking opens a popover with a text-search box and a grid of
 * food-relevant emojis (see `lib/emoji-catalog.ts`). The selected value is
 * mirrored to a hidden `<input name={name}>` so existing form-data wiring
 * keeps working without any server-side changes.
 */
export function EmojiPicker({ name, value, onChange }: Props) {
  const [current, setCurrent] = useState(value || "🛒");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Allow the parent to push a new value (e.g. on product-name change the
  // existing auto-suggest logic in prodotti-forms updates the emoji).
  useEffect(() => {
    if (value && value !== current) setCurrent(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close on outside-click or Escape.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    // Focus the search box on open.
    setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const filtered = useMemo(() => searchEmoji(query), [query]);

  function pick(emoji: string) {
    setCurrent(emoji);
    onChange?.(emoji);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className="relative">
      {/* Hidden field that participates in FormData submission. */}
      <input type="hidden" name={name} value={current} readOnly />

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-[38px] w-full items-center justify-center rounded-lg border border-pm-border bg-white text-2xl leading-none transition hover:border-pm-teal/60 focus:outline-none focus:ring-2 focus:ring-pm-teal/30"
      >
        {current}
      </button>

      {/* Popover */}
      {open && (
        <div
          role="dialog"
          aria-label="Scegli un'emoji"
          className="absolute right-0 z-50 mt-2 w-[296px] overflow-hidden rounded-xl border border-pm-border bg-white shadow-lg"
        >
          <div className="border-b border-pm-border p-2">
            <input
              ref={searchRef}
              type="text"
              placeholder="Cerca: es. pomodoro, miele…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-pm-border px-2.5 py-1.5 text-[12px] text-pm-near-black placeholder:text-pm-gray-light focus:outline-none focus:ring-2 focus:ring-pm-teal/30"
            />
          </div>

          <div className="max-h-[260px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="px-2 py-6 text-center text-[12px] text-pm-gray">
                Nessuna emoji trovata per “{query}”.
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-1">
                {filtered.map((e) => {
                  const isSelected = e.char === current;
                  return (
                    <button
                      type="button"
                      key={e.char + e.name}
                      onClick={() => pick(e.char)}
                      title={e.name}
                      aria-label={e.name}
                      className={`flex h-8 w-8 items-center justify-center rounded-md text-xl leading-none transition hover:bg-pm-teal-light ${
                        isSelected ? "bg-pm-teal-light ring-2 ring-pm-teal" : ""
                      }`}
                    >
                      {e.char}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-pm-border bg-pm-warm-white px-3 py-2 text-[10px] text-pm-gray">
            <span>{filtered.length} di {EMOJI_CATALOG.length}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-semibold text-pm-near-black hover:underline"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
