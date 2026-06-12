import { describe, it as test, expect } from "vitest";
import { formatMoney, formatDate, formatTime } from "./format";

// default brand (no env in vitest) is locale "en", currency EUR
describe("format helpers with default (en) brand", () => {
  test("formatMoney renders EUR with en-GB conventions", () => {
    expect(formatMoney(1234.5)).toBe("€1,234.50");
  });
  test("formatMoney accepts numeric strings (Drizzle numeric columns)", () => {
    expect(formatMoney("90.00")).toBe("€90.00");
  });
  test("formatDate renders a readable date", () => {
    expect(formatDate(new Date("2026-06-11T10:00:00Z"))).toMatch(/11/);
  });
  test("formatTime renders HH:mm", () => {
    expect(formatTime(new Date("2026-06-11T10:30:00Z"))).toMatch(/\d{2}:\d{2}/);
  });
});
