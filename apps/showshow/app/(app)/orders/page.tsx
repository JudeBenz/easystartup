import Link from "next/link";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { formatCents } from "@/lib/format";
import { shipOrderAction } from "@/lib/actions-more";
import { requireSessionUser } from "@/lib/auth/guards";
import { getArtistIdForUser } from "@/lib/store";
import { isPostgresEnabled } from "@/lib/db/client";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await requireSessionUser();
  if (!isPostgresEnabled()) {
    return (
      <div>
        <PageHeader title="Orders" description="Order history requires Postgres." />
      </div>
    );
  }

  const { pgListOrdersForBuyer, pgListOrdersForArtist } = await import("@/lib/store/pg-social");
  const purchases = await pgListOrdersForBuyer(user.id);
  const artistId = await getArtistIdForUser(user.id);
  const sales = artistId ? await pgListOrdersForArtist(artistId) : [];

  return (
    <div>
      <PageHeader title="Orders" description="Purchases and store sales (Stripe-backed)." />

      <div className="grid gap-8 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display text-lg font-bold">Your purchases</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {purchases.map(({ order, product }) => (
              <li key={order.id} className="border-b border-[var(--line)] pb-2">
                {product?.title ?? "Product"} · {formatCents(order.totalCents)} ·{" "}
                <Badge>{order.status}</Badge>
              </li>
            ))}
            {!purchases.length ? <li className="text-[var(--muted)]">No purchases yet</li> : null}
          </ul>
        </Panel>

        {artistId ? (
          <Panel>
            <h2 className="font-display text-lg font-bold">Store sales</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {sales.map(({ order, product }) => (
                <li key={order.id} className="border-b border-[var(--line)] pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {product?.title ?? "Product"} · qty {order.quantity} ·{" "}
                      {formatCents(order.totalCents)} · <Badge>{order.status}</Badge>
                    </span>
                    {order.status === "paid" ? (
                      <form action={shipOrderAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <button type="submit" className="ss-btn ss-btn-secondary text-sm">
                          Mark shipped
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
              {!sales.length ? <li className="text-[var(--muted)]">No sales yet</li> : null}
            </ul>
          </Panel>
        ) : null}
      </div>

      <p className="mt-6 text-base text-[var(--muted)]">
        <Link href="/settings" className="underline">
          Settings
        </Link>{" "}
        · Payments reconcile via Stripe webhooks and the ledger.
      </p>
    </div>
  );
}
