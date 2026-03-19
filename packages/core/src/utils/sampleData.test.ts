import { describe, expect, it } from "vitest";
import { sampleWorkspace } from "./sampleData";

describe("sampleWorkspace", () => {
  it("returns collections with tabs", () => {
    const data = sampleWorkspace();
    expect(data.collections.length).toBeGreaterThan(0);
    expect(data.collections[0].tabs.length).toBeGreaterThan(0);
  });
});