import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(),
  isDbConfigured: vi.fn(),
}));
vi.mock("@/lib/db/schema", () => ({ rentalRequests: {} }));

import { POST } from "./route";
import { getDb, isDbConfigured } from "@/lib/db";

const mockedIsDbConfigured = vi.mocked(isDbConfigured);
const mockedGetDb = vi.mocked(getDb);

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/requests", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validPayload = {
  designId: "design-1",
  contactName: "Daffa",
  contactEmail: "daffa@example.com",
  note: "Please call before delivery",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/requests", () => {
  it("returns 503 when no database is configured", async () => {
    mockedIsDbConfigured.mockReturnValue(false);
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(503);
  });

  it("returns 400 for invalid JSON", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    const res = await POST(makeRequest("{not json"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a missing contact name", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    const { contactName, ...rest } = validPayload;
    void contactName;
    const res = await POST(makeRequest(rest));
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid email", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    const res = await POST(makeRequest({ ...validPayload, contactEmail: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("saves a valid request without a note (optional field)", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    const values = vi.fn().mockResolvedValue(undefined);
    mockedGetDb.mockReturnValue({ insert: () => ({ values }) } as unknown as ReturnType<typeof getDb>);

    const { note, ...withoutNote } = validPayload;
    void note;
    const res = await POST(makeRequest(withoutNote));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ designId: "design-1" }));
  });

  it("returns 500 when the database insert throws", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    mockedGetDb.mockReturnValue({
      insert: () => ({ values: vi.fn().mockRejectedValue(new Error("db down")) }),
    } as unknown as ReturnType<typeof getDb>);

    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(500);
  });
});
