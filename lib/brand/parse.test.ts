import { describe, it, expect } from "vitest";
import { parseBrandConfig } from "./parse";
import { DEFAULT_BRAND } from "./default";

describe("parseBrandConfig", () => {
  it("returns default brand when env is undefined", () => {
    expect(parseBrandConfig(undefined)).toEqual(DEFAULT_BRAND);
  });

  it("returns default brand when env is empty string", () => {
    expect(parseBrandConfig("")).toEqual(DEFAULT_BRAND);
  });

  it("overlays partial config on defaults", () => {
    const b = parseBrandConfig(JSON.stringify({ appName: "Porta Moneta GAS", locale: "it" }));
    expect(b.appName).toBe("Porta Moneta GAS");
    expect(b.locale).toBe("it");
    expect(b.currency).toBe("EUR"); // default preserved
  });

  it("deep-merges theme", () => {
    const b = parseBrandConfig(JSON.stringify({ theme: { primary: "#ff0000" } }));
    expect(b.theme.primary).toBe("#ff0000");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseBrandConfig("{not json")).toThrow(/not valid JSON/);
  });

  it("throws on non-object JSON", () => {
    expect(() => parseBrandConfig('"hello"')).toThrow(/must be a JSON object/);
  });

  it("throws on invalid locale", () => {
    expect(() => parseBrandConfig(JSON.stringify({ locale: "fr" }))).toThrow(/locale/);
  });

  it("throws on non-string field", () => {
    expect(() => parseBrandConfig(JSON.stringify({ appName: 42 }))).toThrow(/appName/);
  });

  it("throws on non-boolean headerShowName", () => {
    expect(() => parseBrandConfig(JSON.stringify({ headerShowName: "yes" }))).toThrow(/headerShowName/);
  });
});
