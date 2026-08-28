import { and, eq, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requirePostgres } from "@/lib/db/client";
import {
  artists,
  ledgerEntries,
  orders,
  patronageSubscriptions,
  products,
  promotions,
  shows,
  stripeEvents,
} from "@/lib/db/schema";
import {
  feeCentsFromGross,
  platformFeeBps,
  requireStripe,
} from "@/lib/payments/stripe";

export async function recordStripeEvent(input: {
  id: string;
  type: string;
  livemode: boolean;
  payload: Record<string, unknown>;
}) {
  const db = requirePostgres();
  const existing = await db
    .select()
    .from(stripeEvents)
    .where(eq(stripeEvents.id, input.id))
    .limit(1)
    .then((r) => r[0]);
  if (existing?.processedAt) {
    return { duplicate: true as const, event: existing };
  }
  if (!existing) {
    await db.insert(stripeEvents).values({
      id: input.id,
      type: input.type,
      livemode: input.livemode,
      payload: input.payload,
    });
  }
  return { duplicate: false as const, event: existing };
}

export async function markStripeEventProcessed(id: string, error?: string) {
  const db = requirePostgres();
  await db
    .update(stripeEvents)
    .set({
      processedAt: new Date(),
      error: error ?? null,
    })
    .where(eq(stripeEvents.id, id));
}

export async function createArtistConnectOnboarding(
  artistId: string,
  returnUrl: string,
  refreshUrl: string,
) {
  const db = requirePostgres();
  const stripe = requireStripe();
  const artist = await db
    .select()
    .from(artists)
    .where(eq(artists.id, artistId))
    .limit(1)
    .then((r) => r[0]);
  if (!artist) throw new Error("Artist not found");

  let accountId = artist.stripeConnectAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: { showshowArtistId: artistId },
    });
    accountId = account.id;
    await db
      .update(artists)
      .set({ stripeConnectAccountId: accountId })
      .where(eq(artists.id, artistId));
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return { accountId, url: link.url };
}

export async function createProductCheckout(input: {
  orderId: string;
  productTitle: string;
  quantity: number;
  unitAmountCents: number;
  buyerEmail: string;
  artistConnectAccountId: string;
  successUrl: string;
  cancelUrl: string;
  buyerUserId: string;
  artistId: string;
}) {
  const stripe = requireStripe();
  const db = requirePostgres();
  const total = input.unitAmountCents * input.quantity;
  const platformFee = feeCentsFromGross(total);
  const idempotencyKey = `order_checkout_${input.orderId}`;

  const existingLed = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.idempotencyKey, idempotencyKey))
    .limit(1)
    .then((r) => r[0]);
  if (!existingLed) {
    await db.insert(ledgerEntries).values({
      id: `led_${nanoid(12)}`,
      kind: "store_sale",
      status: "pending",
      amountCents: total,
      platformFeeCents: platformFee,
      currency: "USD",
      payerUserId: input.buyerUserId,
      payeeArtistId: input.artistId,
      orderId: input.orderId,
      idempotencyKey,
      metadata: { productTitle: input.productTitle, quantity: input.quantity },
    });
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: input.buyerEmail,
      line_items: [
        {
          quantity: input.quantity,
          price_data: {
            currency: "usd",
            unit_amount: input.unitAmountCents,
            product_data: { name: input.productTitle },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: { destination: input.artistConnectAccountId },
        metadata: {
          showshowOrderId: input.orderId,
          showshowArtistId: input.artistId,
        },
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        showshowOrderId: input.orderId,
        showshowKind: "store_sale",
      },
    },
    { idempotencyKey },
  );

  await db
    .update(orders)
    .set({
      stripeCheckoutSessionId: session.id,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, input.orderId));

  await db
    .update(ledgerEntries)
    .set({
      stripeCheckoutSessionId: session.id,
      updatedAt: new Date(),
    })
    .where(eq(ledgerEntries.idempotencyKey, idempotencyKey));

  return session;
}

export async function createSponsorshipCheckout(input: {
  subscriptionId: string;
  tierName: string;
  monthlyPriceCents: number;
  patronEmail: string;
  patronUserId: string;
  artistId: string;
  artistConnectAccountId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = requireStripe();
  const db = requirePostgres();
  const platformFee = feeCentsFromGross(input.monthlyPriceCents);
  const idempotencyKey = `sponsor_checkout_${input.subscriptionId}`;

  const existingLed = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.idempotencyKey, idempotencyKey))
    .limit(1)
    .then((r) => r[0]);
  if (!existingLed) {
    await db.insert(ledgerEntries).values({
      id: `led_${nanoid(12)}`,
      kind: "sponsorship",
      status: "pending",
      amountCents: input.monthlyPriceCents,
      platformFeeCents: platformFee,
      currency: "USD",
      payerUserId: input.patronUserId,
      payeeArtistId: input.artistId,
      idempotencyKey,
      metadata: {
        subscriptionId: input.subscriptionId,
        tierName: input.tierName,
      },
    });
  }

  const feePercent = Math.min(platformFeeBps() / 100, 30);
  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      customer_email: input.patronEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: input.monthlyPriceCents,
            recurring: { interval: "month" },
            product_data: { name: `Sponsor · ${input.tierName}` },
          },
        },
      ],
      subscription_data: {
        application_fee_percent: feePercent,
        transfer_data: { destination: input.artistConnectAccountId },
        metadata: {
          showshowSubscriptionId: input.subscriptionId,
          showshowArtistId: input.artistId,
          showshowKind: "sponsorship",
        },
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        showshowSubscriptionId: input.subscriptionId,
        showshowKind: "sponsorship",
      },
    },
    { idempotencyKey },
  );

  await db
    .update(patronageSubscriptions)
    .set({
      stripeCheckoutSessionId: session.id,
      updatedAt: new Date(),
    })
    .where(eq(patronageSubscriptions.id, input.subscriptionId));

  await db
    .update(ledgerEntries)
    .set({
      stripeCheckoutSessionId: session.id,
      updatedAt: new Date(),
    })
    .where(eq(ledgerEntries.idempotencyKey, idempotencyKey));

  return session;
}

export async function createPromotionCheckout(input: {
  promotionId: string;
  showName: string;
  budgetCents: number;
  payerEmail: string;
  payerUserId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = requireStripe();
  const db = requirePostgres();
  const idempotencyKey = `promo_checkout_${input.promotionId}`;

  const existingLed = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.idempotencyKey, idempotencyKey))
    .limit(1)
    .then((r) => r[0]);
  if (!existingLed) {
    await db.insert(ledgerEntries).values({
      id: `led_${nanoid(12)}`,
      kind: "promotion",
      status: "pending",
      amountCents: input.budgetCents,
      platformFeeCents: input.budgetCents,
      currency: "USD",
      payerUserId: input.payerUserId,
      promotionId: input.promotionId,
      idempotencyKey,
      metadata: { showName: input.showName },
    });
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: input.payerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: input.budgetCents,
            product_data: {
              name: `ShowShow promoted listing — ${input.showName}`,
            },
          },
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        showshowPromotionId: input.promotionId,
        showshowKind: "promotion",
      },
    },
    { idempotencyKey },
  );

  await db
    .update(promotions)
    .set({ stripeCheckoutSessionId: session.id })
    .where(eq(promotions.id, input.promotionId));

  return session;
}

export async function handleCheckoutCompleted(session: {
  id: string;
  payment_intent?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
  metadata?: Record<string, string> | null;
}) {
  const db = requirePostgres();
  const kind = session.metadata?.showshowKind;
  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  const subId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  if (kind === "store_sale" && session.metadata?.showshowOrderId) {
    const orderId = session.metadata.showshowOrderId;
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)
      .then((r) => r[0]);
    await db
      .update(orders)
      .set({
        status: "paid",
        stripePaymentIntentId: pi ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    if (order) {
      await db
        .update(products)
        .set({
          inventory: sql`greatest(${products.inventory} - ${order.quantity}, 0)`,
        })
        .where(eq(products.id, order.productId));
    }
    await db
      .update(ledgerEntries)
      .set({
        status: "succeeded",
        stripePaymentIntentId: pi ?? undefined,
        stripeCheckoutSessionId: session.id,
        updatedAt: new Date(),
      })
      .where(eq(ledgerEntries.orderId, orderId));
  }

  if (kind === "promotion" && session.metadata?.showshowPromotionId) {
    const promotionId = session.metadata.showshowPromotionId;
    const promo = await db
      .select()
      .from(promotions)
      .where(eq(promotions.id, promotionId))
      .limit(1)
      .then((r) => r[0]);
    await db
      .update(promotions)
      .set({
        status: "active",
        stripePaymentIntentId: pi ?? undefined,
      })
      .where(eq(promotions.id, promotionId));
    if (promo) {
      await db
        .update(shows)
        .set({ promotedUntil: promo.endsAt })
        .where(eq(shows.id, promo.showId));
    }
    await db
      .update(ledgerEntries)
      .set({
        status: "succeeded",
        stripePaymentIntentId: pi ?? undefined,
        stripeCheckoutSessionId: session.id,
        updatedAt: new Date(),
      })
      .where(eq(ledgerEntries.promotionId, promotionId));
  }

  if (kind === "sponsorship" && session.metadata?.showshowSubscriptionId) {
    const subscriptionId = session.metadata.showshowSubscriptionId;
    await db
      .update(patronageSubscriptions)
      .set({
        status: "active",
        stripeSubscriptionId: subId ?? undefined,
        stripeCheckoutSessionId: session.id,
        updatedAt: new Date(),
      })
      .where(eq(patronageSubscriptions.id, subscriptionId));
    await db
      .update(ledgerEntries)
      .set({
        status: "succeeded",
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: pi ?? undefined,
        updatedAt: new Date(),
        metadata: { subscriptionId, stripeSubscriptionId: subId },
      })
      .where(eq(ledgerEntries.idempotencyKey, `sponsor_checkout_${subscriptionId}`));
  }
}

export async function syncConnectAccountReady(accountId: string, chargesEnabled: boolean) {
  const db = requirePostgres();
  await db
    .update(artists)
    .set({ stripeConnectReady: chargesEnabled })
    .where(eq(artists.stripeConnectAccountId, accountId));
}

export async function handleSubscriptionDeleted(subscriptionId: string) {
  const db = requirePostgres();
  await db
    .update(patronageSubscriptions)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(patronageSubscriptions.stripeSubscriptionId, subscriptionId));
}

export async function handleChargeRefunded(paymentIntentId: string) {
  const db = requirePostgres();
  await db
    .update(orders)
    .set({ status: "refunded", updatedAt: new Date() })
    .where(eq(orders.stripePaymentIntentId, paymentIntentId));
  await db
    .update(ledgerEntries)
    .set({ status: "refunded", updatedAt: new Date() })
    .where(eq(ledgerEntries.stripePaymentIntentId, paymentIntentId));
}

/** Pending ledger rows older than N hours — ops reconciliation hook. */
export async function listStalePendingLedger(hours = 24) {
  const db = requirePostgres();
  const cutoff = new Date(Date.now() - hours * 3600 * 1000);
  return db
    .select()
    .from(ledgerEntries)
    .where(and(eq(ledgerEntries.status, "pending"), isNull(ledgerEntries.stripePaymentIntentId)))
    .then((rows) => rows.filter((r) => r.createdAt < cutoff));
}
