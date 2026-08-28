import { Resend } from "resend";

let client: Resend | null = null;

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export function emailFrom() {
  return process.env.EMAIL_FROM?.trim() || "ShowShow <onboarding@resend.dev>";
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const resend = getResend();
  if (!resend) {
    return { ok: false as const, skipped: true as const, id: null };
  }
  const result = await resend.emails.send({
    from: emailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
  return { ok: true as const, skipped: false as const, id: result.data?.id ?? null };
}
