import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripe) {
    stripe = new Stripe(key, {
      apiVersion: "2026-08-26.dahlia",
      typescript: true,
      appInfo: { name: "ShowShow", version: "0.1.0" },
    });
  }
  return stripe;
}

export function requireStripe(): Stripe {
  const s = getStripe();
  if (!s) throw new Error("STRIPE_SECRET_KEY is required");
  return s;
}

export function platformFeeBps() {
  const raw = Number(process.env.SHOWSHOW_PLATFORM_FEE_BPS ?? "500");
  if (!Number.isFinite(raw) || raw < 0 || raw > 3000) return 500;
  return Math.round(raw);
}

export function feeCentsFromGross(grossCents: number) {
  return Math.round((grossCents * platformFeeBps()) / 10_000);
}

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
  );
}
