import { Resend } from "resend";

/**
 * Lazily-created Resend client, mirroring the DB client pattern in
 * src/lib/db/index.ts. We never throw at import time when RESEND_API_KEY is
 * missing, so the rest of the app (and "Request This Setup" itself) still
 * works without email configured, it just skips sending the confirmation.
 */
let _resend: Resend | null = null;

export function getResendClient(): Resend {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set. Add a free Resend API key to .env.local (see README).",
    );
  }
  _resend = new Resend(apiKey);
  return _resend;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Sender address for outgoing mail. Defaults to Resend's shared test sender,
 * which works immediately with no domain verification, useful for local dev
 * and for this demo. A real deployment would set RESEND_FROM_EMAIL to an
 * address on a verified domain instead.
 */
export function getFromAddress(): string {
  const raw = process.env.RESEND_FROM_EMAIL?.trim();
  // An env var that's set but blank (or pasted with stray quotes/whitespace)
  // must NOT be treated as a valid override — `??` alone would let an empty
  // string through, producing a `from` field Resend rejects as malformed.
  if (!raw) return "CiptaForge <onboarding@resend.dev>";
  return raw;
}
