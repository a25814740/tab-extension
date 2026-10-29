import { describe, expect, it } from "vitest";
import { toSafeFaviconUrl } from "./favicon";

describe("toSafeFaviconUrl", () => {
  it("proxies real sites through the Google favicon service", () => {
    expect(toSafeFaviconUrl("https://github.com/a/b")).toBe(
      "https://www.google.com/s2/favicons?sz=64&domain_url=https%3A%2F%2Fgithub.com"
    );
  });

  it("skips reserved example and test hosts", () => {
    expect(toSafeFaviconUrl("https://example.com/design")).toBeNull();
    expect(toSafeFaviconUrl("https://docs.example.org/x")).toBeNull();
    expect(toSafeFaviconUrl("http://localhost:5173/")).toBeNull();
    expect(toSafeFaviconUrl("https://app.test/")).toBeNull();
  });

  it("does not treat lookalike domains as reserved", () => {
    expect(toSafeFaviconUrl("https://myexample.com/")).not.toBeNull();
  });

  it("still returns a local data icon for a reserved page", () => {
    const icon = "data:image/png;base64,AAAA";
    expect(toSafeFaviconUrl("https://example.com/", icon)).toBe(icon);
  });
});
