import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requirePostgres } from "@/lib/db/client";
import {
  applications,
  artists,
  editions,
  emailDeliveries,
  shows,
  users,
} from "@/lib/db/schema";
import { isEmailConfigured, sendEmail } from "@/lib/email/resend";

/**
 * Send application deadline reminders for apps with reminderAt in the next window.
 * Idempotent via email_deliveries unique key.
 */
export async function runDeadlineReminders(opts?: { dryRun?: boolean }) {
  const db = requirePostgres();
  const horizon = new Date(Date.now() + 3 * 86400000); // due within 3 days of reminderAt

  const due = await db
    .select({
      app: applications,
      artist: artists,
      edition: editions,
      show: shows,
      user: users,
    })
    .from(applications)
    .innerJoin(artists, eq(applications.artistId, artists.id))
    .innerJoin(users, eq(artists.userId, users.id))
    .innerJoin(editions, eq(applications.editionId, editions.id))
    .innerJoin(shows, eq(editions.showId, shows.id))
    .where(
      and(
        isNotNull(applications.reminderAt),
        lte(applications.reminderAt, horizon),
        gte(applications.reminderAt, new Date(Date.now() - 2 * 86400000)),
        sql`${applications.status} not in ('accepted', 'declined', 'withdrawn')`,
      ),
    );

  const results: { appId: string; email: string; status: string }[] = [];
  const dry = Boolean(opts?.dryRun);

  for (const row of due) {
    const entityId = row.app.id;
    const toEmail = row.user.email;
    const existing = await db
      .select()
      .from(emailDeliveries)
      .where(
        and(
          eq(emailDeliveries.kind, "deadline_reminder"),
          eq(emailDeliveries.entityId, entityId),
          eq(emailDeliveries.toEmail, toEmail),
        ),
      )
      .limit(1)
      .then((r) => r[0]);
    if (existing) {
      results.push({ appId: entityId, email: toEmail, status: "already_sent" });
      continue;
    }

    const deadline = row.edition.applicationDeadline ?? "soon";
    const subject = `ShowShow reminder: ${row.show.name} deadline ${deadline}`;
    const text = `Hi ${row.user.name},\n\nYour application tracker for ${row.show.name} (${row.edition.year}) is “${row.app.status}”. Official deadline: ${deadline}.\n\nUpdate status: ${process.env.AUTH_URL ?? "https://showshow.app"}/applications\n`;
    const html = `<p>Hi ${row.user.name},</p><p>Your application tracker for <strong>${row.show.name}</strong> (${row.edition.year}) is “${row.app.status}”.</p><p>Official deadline: <strong>${deadline}</strong>.</p><p><a href="${process.env.AUTH_URL ?? "https://showshow.app"}/applications">Open applications</a></p>`;

    if (opts?.dryRun || !isEmailConfigured()) {
      results.push({
        appId: entityId,
        email: toEmail,
        status: opts?.dryRun ? "dry_run" : "email_not_configured",
      });
      continue;
    }

    const sent = await sendEmail({ to: toEmail, subject, html, text });
    await db.insert(emailDeliveries).values({
      id: `em_${nanoid(10)}`,
      kind: "deadline_reminder",
      toEmail,
      entityId,
      providerId: sent.id,
    });
    results.push({ appId: entityId, email: toEmail, status: "sent" });
  }

  return { checked: due.length, results };
}
