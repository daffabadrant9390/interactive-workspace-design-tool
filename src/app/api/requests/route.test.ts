import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(),
  isDbConfigured: vi.fn(),
}));
vi.mock("@/lib/db/schema", () => ({ rentalRequests: {}, designs: {} }));
vi.mock("@/lib/email/resend-client", () => ({ isEmailConfigured: vi.fn() }));
vi.mock("@/lib/email/send-request-confirmation", () => ({
  sendRequestConfirmationEmail: vi.fn(),
}));

import { POST } from "./route";
import { getDb, isDbConfigured } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email/resend-client";
import { sendRequestConfirmationEmail } from "@/lib/email/send-request-confirmation";

const mockedIsDbConfigured = vi.mocked(isDbConfigured);
const mockedGetDb = vi.mocked(getDb);
const mockedIsEmailConfigured = vi.mocked(isEmailConfigured);
const mockedSendEmail = vi.mocked(sendRequestConfirmationEmail);

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

const sampleDesignRow = {
  id: "design-1",
  name: "Untitled workspace",
  floorItems: [],
  deskItems: [],
  duration: "week",
  cycles: 1,
  createdAt: new Date(),
};

/** Builds a fake Drizzle client supporting both the insert and select chains this route uses. */
function makeDbMock(opts: {
  insertValues?: ReturnType<typeof vi.fn>;
  selectRows?: unknown[];
}) {
  const insertValues = opts.insertValues ?? vi.fn().mockResolvedValue(undefined);
  const selectRows = opts.selectRows ?? [];
  return {
    insert: () => ({ values: insertValues }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: vi.fn().mockResolvedValue(selectRows),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof getDb>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedIsEmailConfigured.mockReturnValue(false);
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
    mockedGetDb.mockReturnValue(makeDbMock({ insertValues: values }));

    const { note, ...withoutNote } = validPayload;
    void note;
    const res = await POST(makeRequest(withoutNote));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.emailSent).toBe(false);
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

  it("does not attempt to send an email when Resend isn't configured", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    mockedIsEmailConfigured.mockReturnValue(false);
    mockedGetDb.mockReturnValue(makeDbMock({ selectRows: [sampleDesignRow] }));

    await POST(makeRequest(validPayload));

    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it("sends a confirmation email with the design's breakdown when configured", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    mockedIsEmailConfigured.mockReturnValue(true);
    mockedGetDb.mockReturnValue(makeDbMock({ selectRows: [sampleDesignRow] }));
    mockedSendEmail.mockResolvedValue(undefined);

    const res = await POST(makeRequest(validPayload));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.emailSent).toBe(true);
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    const callArg = mockedSendEmail.mock.calls[0][0];
    expect(callArg.contactEmail).toBe(validPayload.contactEmail);
    expect(callArg.shareUrl).toBe("http://localhost/d/design-1");
    expect(callArg.duration).toBe("week");
    expect(callArg.breakdown).toBeDefined();
  });

  it("still returns ok when sending the email throws", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    mockedIsEmailConfigured.mockReturnValue(true);
    mockedGetDb.mockReturnValue(makeDbMock({ selectRows: [sampleDesignRow] }));
    mockedSendEmail.mockRejectedValue(new Error("Resend is down"));

    const res = await POST(makeRequest(validPayload));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.emailSent).toBe(false);
  });

  it("skips sending when the design record can't be found", async () => {
    mockedIsDbConfigured.mockReturnValue(true);
    mockedIsEmailConfigured.mockReturnValue(true);
    mockedGetDb.mockReturnValue(makeDbMock({ selectRows: [] }));

    const res = await POST(makeRequest(validPayload));
    const json = await res.json();

    expect(json.emailSent).toBe(false);
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });
});
