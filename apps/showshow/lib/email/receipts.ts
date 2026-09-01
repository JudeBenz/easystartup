import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requirePostgres } from "@/lib/db/client";
import { artists, emailDeliveries, orders, products, users } from "@/lib/db/schema";
import { formatMoney } from "@/lib/format";
import { isEmailConfigured, sendEmail } from "./resend";

function appOrigin() {
  return (process.env.AUTH_URL ?? "https://showshow.vercel.app").replace(/\/$/, "");
}

export async function sendPurchaseReceipt(orderId: string) {
  if (!isEmailConfigured()) return { ok: false as const, skipped: true as const };

  const db = requirePostgres();
  const row = await db
    .select({
      order: orders,
      product: products,
      buyer: users,
      artist: artists,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(users, eq(orders.buyerUserId, users.id))
    .innerJoin(artists, eq(orders.artistId, artists.id))
    .where(eq(orders.id, orderId))
    .limit(1)
    .then((r) => r[0]);

  if (!row) return { ok: false as const, skipped: true as const };

  const existing = await db
    .select()
    .from(emailDeliveries)
    .where(
      and(
        eq(emailDeliveries.kind, "purchase_receipt"),
        eq(emailDeliveries.entityId, orderId),
        eq(emailDeliveries.toEmail, row.buyer.email),
      ),
    )
    .limit(1)
    .then((r) => r[0]);
  if (existing) return { ok: true as const, skipped: true as const };

  const total = formatMoney(row.order.totalCents / 100, row.order.currency);
  const subject = `ShowShow receipt — ${row.product.title}`;
  const text = `Hi ${row.buyer.name},\n\nThanks for your purchase from ${row.artist.displayName}.\n\n${row.product.title} × ${row.order.quantity}\nTotal: ${total}\n\nView orders: ${appOrigin()}/orders\n`;
  const html = `<p>Hi ${row.buyer.name},</p><p>Thanks for your purchase from <strong>${row.artist.displayName}</strong>.</p><p><strong>${row.product.title}</strong> × ${row.order.quantity}<br/>Total: <strong>${total}</strong></p><p><a href="${appOrigin()}/orders">View orders</a></p>`;

  const sent = await sendEmail({
    to: row.buyer.email,
    subject,
    text,
    html,
  });

  if (sent.ok) {
    await db.insert(emailDeliveries).values({
      id: `em_${nanoid(10)}`,
      kind: "purchase_receipt",
      toEmail: row.buyer.email,
      entityId: orderId,
      providerId: sent.id,
    });
  }

  return sent;
}
