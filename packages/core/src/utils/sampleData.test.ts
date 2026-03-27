import { describe, expect, it } from "vitest";
import { sampleWorkspaces } from "./sampleData";

describe("sampleWorkspaces", () => {
  it("returns multiple workspaces with collections and tabs", () => {
    const data = sampleWorkspaces();
    expect(data.length).toBeGreaterThan(1);
    data.forEach((workspace) => {
      expect(workspace.collections.length).toBeGreaterThan(0);
      expect(workspace.collections[0].tabs.length).toBeGreaterThan(0);
    });
  });
});
