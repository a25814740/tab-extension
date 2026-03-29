import { describe, expect, it } from "vitest";
import { resolveConflict } from "./conflict";

describe("resolveConflict", () => {
  it("returns the newer item", () => {
    const local = { id: "1", updatedAt: "2024-01-02T00:00:00Z" };
    const remote = { id: "1", updatedAt: "2024-01-01T00:00:00Z" };
    const result = resolveConflict(local, remote);
    expect(result.resolved).toEqual(local);
  });
});
