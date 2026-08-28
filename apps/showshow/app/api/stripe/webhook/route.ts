import { NextRequest, NextResponse } from "next/server";
import { requireStripe } from "@/lib/payments/stripe";
import {
  handleCheckoutCompleted,
  handleChargeRefunded,
  handleSubscriptionDeleted,
  markStripeEventProcessed,
  recordStripeEvent,
  syncConnectAccountReady,
} from "@/lib/payments/ledger";
import { isPostgresEnabled } from "@/lib/db/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isPostgresEnabled()) {
    return NextResponse.json(
      { error: "Postgres required for webhooks" },
      { status: 503 },
    );
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET missing" }, { status: 500 });
  }

  const stripe = requireStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const recorded = await recordStripeEvent({
    id: event.id,
    type: event.type,
    livemode: event.livemode,
    payload: event as unknown as Record<string, unknown>,
  });
  if (recorded.duplicate) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          id: string;
          payment_intent?: string | null;
          metadata?: Record<string, string> | null;
        };
        await handleCheckoutCompleted(
          session as {
            id: string;
            payment_intent?: string | null;
            subscription?: string | null;
            metadata?: Record<string, string> | null;
          },
        );
        break;
      }
      case "account.updated": {
        const account = event.data.object as {
          id: string;
          charges_enabled?: boolean;
        };
        await syncConnectAccountReady(account.id, Boolean(account.charges_enabled));
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as { id: string };
        await handleSubscriptionDeleted(sub.id);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as { payment_intent?: string | null };
        if (charge.payment_intent) {
          await handleChargeRefunded(
            typeof charge.payment_intent === "string"
              ? charge.payment_intent
              : String(charge.payment_intent),
          );
        }
        break;
      }
      default:
        break;
    }
    await markStripeEventProcessed(event.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "handler failed";
    await markStripeEventProcessed(event.id, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
