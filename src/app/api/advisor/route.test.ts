import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({ generateObject: vi.fn() }));
vi.mock("@ai-sdk/google", () => ({ google: vi.fn(() => "mock-model") }));

import { generateObject } from "ai";
import { POST } from "./route";

const mockedGenerateObject = vi.mocked(generateObject);

function makeRequest(body: unknown, ip = "1.1.1.1") {
  return new Request("http://localhost/api/advisor", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "x-forwarded-for": ip },
  });
}

const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

beforeEach(() => {
  mockedGenerateObject.mockReset();
});

afterEach(() => {
  if (originalKey === undefined) delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  else process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
});

describe("POST /api/advisor", () => {
  it("returns 400 for an empty prompt", async () => {
    const res = await POST(makeRequest({ prompt: "" }, "2.2.2.1"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when prompt is missing", async () => {
    const res = await POST(makeRequest({}, "2.2.2.2"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when prompt exceeds the max length", async () => {
    const res = await POST(makeRequest({ prompt: "a".repeat(501) }, "2.2.2.3"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a body that isn't valid JSON", async () => {
    const res = await POST(makeRequest("not json", "2.2.2.4"));
    expect(res.status).toBe(400);
  });

  it("uses the rule-based fallback when no API key is configured", async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const res = await POST(makeRequest({ prompt: "I trade stocks" }, "2.2.2.5"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.source).toBe("fallback");
    expect(json.suggestedItemIds).toContain("monitor-34-curved");
    expect(mockedGenerateObject).not.toHaveBeenCalled();
  });

  it("uses the AI result and filters out any hallucinated catalog ids", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    mockedGenerateObject.mockResolvedValue({
      object: {
        message: "Here's a great setup for you.",
        suggestedItemIds: ["desk-standard", "not-a-real-id", "chair-ergonomic"],
      },
    });

    const res = await POST(makeRequest({ prompt: "help me set up" }, "2.2.2.6"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.source).toBe("ai");
    expect(json.suggestedItemIds).toEqual(["desk-standard", "chair-ergonomic"]);
    expect(json.message).toBe("Here's a great setup for you.");
  });

  it("falls back to the rule-based advisor when the AI call throws", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    mockedGenerateObject.mockRejectedValue(new Error("quota exceeded"));

    const res = await POST(makeRequest({ prompt: "I code all day" }, "2.2.2.7"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.source).toBe("fallback");
    expect(json.suggestedItemIds).toContain("monitor-27-4k");
  });

  it("rate-limits a single IP after too many requests in the window", async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const ip = "9.9.9.9";
    let lastStatus = 200;
    for (let i = 0; i < 9; i++) {
      const res = await POST(makeRequest({ prompt: "a generic prompt" }, ip));
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
