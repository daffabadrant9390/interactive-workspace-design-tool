import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(),
  isDbConfigured: vi.fn(),
}));
vi.mock("@/lib/db/schema", () => ({ designs: {} }));

import { POST } from "./route";
import { getDb, isDbConfigured } from "@/lib/db";

const mockedIsDbConfigured = vi.mocked(isDbConfigured);
const mockedGetDb = vi.mocked(getDb);

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/designs", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const validPayload = {
  name: "My Setup",
  floorItems: [{ instanceId: "a", catalogId: "desk-standard" }],
  deskItems: [],
  duration: "week",
  cycles: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/designs", () => {
  it("returns 503 when no database is configured", async () => {
    mockedIsDbConfigured.mockReturnValue(false);
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toMatch(/No database configured/);
    expect(mockedGetDb).not.toHaveBeenCalled();
  });

  it("returns 400 for a body that isn't valid JSON", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    const res = await POST(makeRequest("not json"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when required fields are missing", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    const res = await POST(makeRequest({ floorItems: [], deskItems: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid duration enum value", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    const res = await POST(makeRequest({ ...validPayload, duration: "fortnight" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when cycles is out of range", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    const res = await POST(makeRequest({ ...validPayload, cycles: 0 }));
    expect(res.status).toBe(400);
    const res2 = await POST(makeRequest({ ...validPayload, cycles: 999 }));
    expect(res2.status).toBe(400);
  });

  it("saves a valid design and returns its id", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    const values = vi.fn().mockResolvedValue(undefined);
    mockedGetDb.mockReturnValue({ insert: () => ({ values }) } as unknown as ReturnType<typeof getDb>);

    const res = await POST(makeRequest(validPayload));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.id).toBe("string");
    expect(json.id.length).toBeGreaterThan(0);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My Setup", duration: "week", cycles: 1 }),
    );
  });

  it("defaults the name to 'Untitled workspace' when omitted", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    const values = vi.fn().mockResolvedValue(undefined);
    mockedGetDb.mockReturnValue({ insert: () => ({ values }) } as unknown as ReturnType<typeof getDb>);

    const { name, ...withoutName } = validPayload;
    void name;
    await POST(makeRequest(withoutName));

    expect(values).toHaveBeenCalledWith(expect.objectContaining({ name: "Untitled workspace" }));
  });

  it("returns 500 when the database insert throws", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    mockedGetDb.mockReturnValue({
      insert: () => ({ values: vi.fn().mockRejectedValue(new Error("db down")) }),
    } as unknown as ReturnType<typeof getDb>);

    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/Could not save/);
  });
});
