import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getFromAddress, isEmailConfigured } from "./resend-client";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("isEmailConfigured", () => {
  it("is false when RESEND_API_KEY is unset", () => {
    expect(isEmailConfigured()).toBe(false);
  });

  it("is true when RESEND_API_KEY is set", () => {
    process.env.RESEND_API_KEY = "re_test";
    expect(isEmailConfigured()).toBe(true);
  });
});

describe("getFromAddress", () => {
  it("defaults to the shared Resend test sender when unset", () => {
    expect(getFromAddress()).toBe("CiptaForge <onboarding@resend.dev>");
  });

  it("defaults when the env var is an empty string (set but blank)", () => {
    process.env.RESEND_FROM_EMAIL = "";
    expect(getFromAddress()).toBe("CiptaForge <onboarding@resend.dev>");
  });

  it("defaults when the env var is only whitespace", () => {
    process.env.RESEND_FROM_EMAIL = "   ";
    expect(getFromAddress()).toBe("CiptaForge <onboarding@resend.dev>");
  });

  it("uses a valid override verbatim", () => {
    process.env.RESEND_FROM_EMAIL = "CiptaForge <noreply@ciptaforge.com>";
    expect(getFromAddress()).toBe("CiptaForge <noreply@ciptaforge.com>");
  });

  it("trims stray surrounding whitespace from an override", () => {
    process.env.RESEND_FROM_EMAIL = "  noreply@ciptaforge.com  ";
    expect(getFromAddress()).toBe("noreply@ciptaforge.com");
  });
});
