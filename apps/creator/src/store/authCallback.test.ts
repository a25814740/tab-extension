import { describe, expect, it } from "vitest";
import {
  hasAuthHashToken,
  normalizeCreatorEntryHash,
  normalizeHashPayload,
  parseHashTokens,
} from "./authCallback";

describe("authCallback", () => {
  it("parses standard hash callback payload", () => {
    const parsed = parseHashTokens("#access_token=aaa&refresh_token=bbb&expires_in=3600");
    expect(parsed).toEqual({
      accessToken: "aaa",
      refreshToken: "bbb",
      expiresIn: 3600,
    });
  });

  it("parses hash-router callback payload", () => {
    const parsed = parseHashTokens("#/access_token=aaa&refresh_token=bbb&expires_in=1800");
    expect(parsed).toEqual({
      accessToken: "aaa",
      refreshToken: "bbb",
      expiresIn: 1800,
    });
  });

  it("normalizes hash payload for URLSearchParams", () => {
    expect(normalizeHashPayload("#/access_token=aaa&refresh_token=bbb")).toBe("access_token=aaa&refresh_token=bbb");
  });

  it("detects auth hash token", () => {
    expect(hasAuthHashToken("#/access_token=aaa")).toBe(true);
    expect(hasAuthHashToken("#/design")).toBe(false);
  });

  it("normalizes creator entry hash", () => {
    expect(normalizeCreatorEntryHash("")).toBe("#/");
    expect(normalizeCreatorEntryHash("#/assets")).toBe("#/assets");
    expect(normalizeCreatorEntryHash("#/access_token=aaa")).toBe("#access_token=aaa");
  });
});
