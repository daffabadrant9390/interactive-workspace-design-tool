import type { PriceBreakdown } from "@/lib/pricing";
import { formatUsd } from "@/lib/pricing";

export interface RequestConfirmationInput {
  contactName: string;
  shareUrl: string;
  duration: "week" | "month";
  cycles: number;
  note?: string;
  breakdown: PriceBreakdown;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const ACCENT = "#c9691a";
const INK = "#1a1a1a";
const MUTED = "#6b6b6b";
const BORDER = "#e5e5e5";
const SURFACE = "#f7f5f2";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Builds the confirmation email sent after someone submits "Request This
 * Setup". Table based layout with inline styles on purpose, since that is
 * still the layout method that renders consistently across Gmail, Outlook
 * and Apple Mail, unlike flexbox or grid.
 */
export function buildRequestConfirmationEmail(input: RequestConfirmationInput): RenderedEmail {
  const { contactName, shareUrl, duration, cycles, note, breakdown } = input;
  const firstName = contactName.trim().split(/\s+/)[0] || contactName;
  const durationLabel = duration === "week" ? "week" : "month";
  const durationPlural = cycles === 1 ? durationLabel : `${durationLabel}s`;

  const subject = `We received your workspace request, ${firstName}`;

  const itemRows = breakdown.lines
    .map(
      (line) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${INK};">
            ${escapeHtml(line.name)}
          </td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${INK};white-space:nowrap;">
            ${formatUsd(line.discountedWeeklyCents)}/wk
          </td>
        </tr>`,
    )
    .join("");

  const bundleBlock = breakdown.appliedBundle
    ? `
      <tr>
        <td colspan="2" style="padding:12px 14px;background:${SURFACE};border-radius:8px;font-size:13px;color:#8a4a10;">
          <strong>${escapeHtml(breakdown.appliedBundle.name)}</strong> applied: ${breakdown.appliedBundle.discountPct}% off &mdash; ${escapeHtml(breakdown.appliedBundle.description)}
        </td>
      </tr>
      <tr><td colspan="2" style="height:12px;"></td></tr>`
    : "";

  const noteBlock = note
    ? `
      <tr>
        <td colspan="2" style="padding-top:16px;">
          <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:${MUTED};">Delivery notes</p>
          <p style="margin:0;font-size:14px;color:${INK};">${escapeHtml(note)}</p>
        </td>
      </tr>`
    : "";

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${SURFACE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};">
            <tr>
              <td style="padding:28px 32px 0;">
                <p style="margin:0;font-size:20px;font-weight:700;color:${INK};">
                  Cipta<span style="color:${ACCENT};">Forge</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0;">
                <h1 style="margin:0 0 8px;font-size:20px;color:${INK};">Thanks, ${escapeHtml(firstName)} &mdash; we got your request</h1>
                <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${MUTED};">
                  Our team will follow up by email shortly to confirm delivery. Here is a copy of the
                  setup you requested, plus an invoice attached as a PDF for your records.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td colspan="2" style="padding-bottom:8px;border-bottom:1px solid ${INK};font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:${MUTED};">Item</td>
                  </tr>
                  ${itemRows}
                  <tr><td colspan="2" style="height:14px;"></td></tr>
                  ${bundleBlock}
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:${MUTED};">Weekly subtotal</td>
                    <td align="right" style="padding:4px 0;font-size:13px;color:${INK};">${formatUsd(breakdown.weeklySubtotalCents)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:${MUTED};">Billing period</td>
                    <td align="right" style="padding:4px 0;font-size:13px;color:${INK};">${cycles} ${durationPlural} (${breakdown.totalWeeks} weeks)</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0 0;font-size:16px;font-weight:700;color:${INK};border-top:1px solid ${INK};">Total due</td>
                    <td align="right" style="padding:10px 0 0;font-size:16px;font-weight:700;color:${INK};border-top:1px solid ${INK};">${formatUsd(breakdown.grandTotalCents)}</td>
                  </tr>
                  ${noteBlock}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;">
                <a href="${shareUrl}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;">
                  View your setup
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid ${BORDER};">
                <p style="margin:0;font-size:11px;line-height:1.6;color:#9a9a9a;">
                  CiptaForge is a fictional rental brand by Cipta Forge Indonesia, built for a developer
                  challenge submission. Prices shown are illustrative placeholders, not live pricing.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textLines = [
    `Thanks, ${firstName} — we got your request.`,
    "",
    "Our team will follow up by email shortly to confirm delivery. Here is a copy of the setup you requested (an invoice PDF is attached):",
    "",
    ...breakdown.lines.map((line) => `- ${line.name}: ${formatUsd(line.discountedWeeklyCents)}/wk`),
    "",
    breakdown.appliedBundle
      ? `${breakdown.appliedBundle.name} applied: ${breakdown.appliedBundle.discountPct}% off`
      : null,
    `Weekly subtotal: ${formatUsd(breakdown.weeklySubtotalCents)}`,
    `Billing period: ${cycles} ${durationPlural} (${breakdown.totalWeeks} weeks)`,
    `Total due: ${formatUsd(breakdown.grandTotalCents)}`,
    note ? `\nDelivery notes: ${note}` : null,
    `\nView your setup: ${shareUrl}`,
    "",
    "CiptaForge is a fictional rental brand by Cipta Forge Indonesia, built for a developer challenge submission. Prices shown are illustrative placeholders, not live pricing.",
  ].filter((line): line is string => line !== null);

  return { subject, html, text: textLines.join("\n") };
}
