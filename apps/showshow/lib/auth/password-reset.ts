import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { requirePostgres } from "@/lib/db/client";
import { users, verificationTokens } from "@/lib/db/schema";
import { isEmailConfigured, sendEmail } from "@/lib/email/resend";

const RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function appOrigin() {
  return (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: true as const };

  const db = requirePostgres();
  const user = await db.query.users.findFirst({ where: eq(users.email, normalized) });
  if (!user) return { ok: true as const };

  const rawToken = randomBytes(32).toString("hex");
  const token = hashToken(rawToken);
  const expires = new Date(Date.now() + RESET_TTL_MS);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, `reset:${normalized}`));
  await db.insert(verificationTokens).values({
    identifier: `reset:${normalized}`,
    token,
    expires,
  });

  const resetUrl = `${appOrigin()}/reset-password?email=${encodeURIComponent(normalized)}&token=${rawToken}`;
  const subject = "Reset your ShowShow password";
  const text = `Hi ${user.name},\n\nReset your password: ${resetUrl}\n\nThis link expires in one hour. If you did not request this, ignore this email.\n`;
  const html = `<p>Hi ${user.name},</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in one hour. If you did not request this, ignore this email.</p>`;

  if (isEmailConfigured()) {
    await sendEmail({ to: normalized, subject, text, html });
  }

  return { ok: true as const, previewUrl: isEmailConfigured() ? undefined : resetUrl };
}

export async function resetPasswordWithToken(input: {
  email: string;
  token: string;
  password: string;
}) {
  const normalized = input.email.trim().toLowerCase();
  const password = input.password;
  if (!normalized || !input.token || password.length < 8) {
    throw new Error("Email, token, and password (8+ chars) are required.");
  }

  const db = requirePostgres();
  const row = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.identifier, `reset:${normalized}`),
  });
  if (!row || row.expires < new Date()) {
    throw new Error("Reset link is invalid or expired.");
  }
  if (row.token !== hashToken(input.token)) {
    throw new Error("Reset link is invalid or expired.");
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, normalized) });
  if (!user) throw new Error("Account not found.");

  const passwordHash = await hash(password, 10);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, `reset:${normalized}`));

  return { ok: true as const };
}
