import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(),
  isDbConfigured: vi.fn(),
}));
vi.mock("@/lib/db/schema", () => ({ designs: { id: "id-column" } }));
vi.mock("drizzle-orm", () => ({ eq: vi.fn((col, val) => ({ col, val })) }));

import { GET } from "./route";
import { getDb, isDbConfigured } from "@/lib/db";

const mockedIsDbConfigured = vi.mocked(isDbConfigured);
const mockedGetDb = vi.mocked(getDb);

function ctxFor(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/designs/[id]", () => {
  it("returns 503 when no database is configured", async () => {
    mockedIsDbConfigured.mockReturnValue(false);
    const res = await GET(new Request("http://localhost/api/designs/abc"), ctxFor("abc"));
    expect(res.status).toBe(503);
  });

  it("returns 404 when the design doesn't exist", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    mockedGetDb.mockReturnValue({
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
    } as unknown as ReturnType<typeof getDb>);

    const res = await GET(new Request("http://localhost/api/designs/missing"), ctxFor("missing"));
    expect(res.status).toBe(404);
  });

  it("returns the design row when found", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    const row = { id: "abc", name: "Saved Setup", floorItems: [], deskItems: [], duration: "week", cycles: 1 };
    mockedGetDb.mockReturnValue({
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [row] }) }) }),
    } as unknown as ReturnType<typeof getDb>);

    const res = await GET(new Request("http://localhost/api/designs/abc"), ctxFor("abc"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(row);
  });

  it("returns 500 when the query throws", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    mockedGetDb.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              throw new Error("db exploded");
            },
          }),
        }),
      }),
    } as unknown as ReturnType<typeof getDb>);

    const res = await GET(new Request("http://localhost/api/designs/abc"), ctxFor("abc"));
    expect(res.status).toBe(500);
  });
});
