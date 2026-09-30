import { getResendClient, getFromAddress } from "./resend-client";
import { buildRequestConfirmationEmail } from "./request-confirmation-template";
import { renderInvoicePdf, type InvoiceData } from "./invoice-pdf";

export interface SendRequestConfirmationInput extends InvoiceData {}

/**
 * Sends the "Request This Setup" confirmation: a branded HTML email with
 * the item list and totals inline, plus the same numbers as a downloadable
 * PDF invoice attached. Callers should treat a thrown error here as
 * non-fatal to the request itself, the lead is already saved in the
 * database by the time this runs (see src/app/api/requests/route.ts).
 */
export async function sendRequestConfirmationEmail(input: SendRequestConfirmationInput) {
  const resend = getResendClient();
  const { subject, html, text } = buildRequestConfirmationEmail(input);
  const pdfBuffer = await renderInvoicePdf(input);

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: input.contactEmail,
    subject,
    html,
    text,
    attachments: [
      {
        filename: `ciptaforge-invoice-${input.requestId}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(`Resend rejected the email: ${error.message}`);
  }
}
