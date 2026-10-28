import { describe, expect, it } from "vitest";
import { findDuplicateTabGroups, normalizeTabUrl } from "./duplicateTabs";

describe("normalizeTabUrl", () => {
  it("ignores host case, trailing slash and empty hash", () => {
    expect(normalizeTabUrl("https://Example.com/docs/")).toBe(normalizeTabUrl("https://example.com/docs#"));
  });

  it("keeps query and hash distinct", () => {
    expect(normalizeTabUrl("https://a.com/?q=1")).not.toBe(normalizeTabUrl("https://a.com/?q=2"));
    expect(normalizeTabUrl("https://mail.com/#inbox")).not.toBe(normalizeTabUrl("https://mail.com/#sent"));
  });
});

describe("findDuplicateTabGroups", () => {
  it("returns nothing when all tabs are unique", () => {
    expect(findDuplicateTabGroups([{ id: 1, url: "https://a.com" }, { id: 2, url: "https://b.com" }])).toEqual([]);
  });

  it("keeps the most recently used tab and closes older ones", () => {
    const groups = findDuplicateTabGroups([
      { id: 1, url: "https://a.com/", lastAccessed: 100 },
      { id: 2, url: "https://a.com", lastAccessed: 300 },
      { id: 3, url: "https://A.com", lastAccessed: 200 },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.keep.id).toBe(2);
    expect(groups[0]?.close.map((tab) => tab.id)).toEqual([3, 1]);
  });

  it("prefers the active tab over a more recent one", () => {
    const groups = findDuplicateTabGroups([
      { id: 1, url: "https://a.com", active: true, lastAccessed: 1 },
      { id: 2, url: "https://a.com", lastAccessed: 999 },
    ]);
    expect(groups[0]?.keep.id).toBe(1);
    expect(groups[0]?.close.map((tab) => tab.id)).toEqual([2]);
  });

  it("never offers pinned or active tabs for closing", () => {
    const groups = findDuplicateTabGroups([
      { id: 1, url: "https://a.com", pinned: true, lastAccessed: 1 },
      { id: 2, url: "https://a.com", active: true, lastAccessed: 2 },
      { id: 3, url: "https://a.com", active: true, lastAccessed: 3 },
      { id: 4, url: "https://a.com", lastAccessed: 4 },
    ]);
    expect(groups[0]?.close.map((tab) => tab.id)).toEqual([4]);
  });

  it("falls back to the newest tab id without lastAccessed", () => {
    const groups = findDuplicateTabGroups([
      { id: 5, url: "https://a.com" },
      { id: 9, url: "https://a.com" },
    ]);
    expect(groups[0]?.keep.id).toBe(9);
  });
});
