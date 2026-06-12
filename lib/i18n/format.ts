import { brand } from "@/lib/brand";

const LOCALE_TAG: Record<"it" | "en", string> = { it: "it-IT", en: "en-GB" };
const tag = LOCALE_TAG[brand.locale];

export function formatMoney(value: number | string): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat(tag, { style: "currency", currency: brand.currency }).format(n);
}

export function formatDate(d: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(tag, opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(d: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(tag, opts ?? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatNumber(value: number, maxDecimals = 3): string {
  return new Intl.NumberFormat(tag, { maximumFractionDigits: maxDecimals }).format(value);
}

// Pre-fills for editable numeric <input>s: Italian admins type decimal commas,
// everyone else gets dots. The parse direction tolerates both separators.
export function formatDecimalInput(value: number | string): string {
  const s = typeof value === "number" ? String(value) : value;
  return brand.locale === "it" ? s.replace(".", ",") : s;
}
