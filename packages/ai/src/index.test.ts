import { describe, expect, it } from "vitest";
import { suggestGroups } from "./index";

describe("suggestGroups", () => {
  it("groups by domain", () => {
    const groups = suggestGroups([
      { title: "A", url: "https://github.com/openai" },
      { title: "B", url: "https://example.com" },
    ]);

    const github = groups.find((group) => group.name === "GitHub");
    expect(github).toBeDefined();
  });
});