"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { THEME_COOKIE, resolveThemeId } from "@/lib/themes";
import {
  addComment,
  claimShow,
  createAnnouncement,
  createBoothOffer,
  createBoothRequest,
  createJuryFeedback,
  createRoiReport,
  openWaitlistBooth,
  resetDb,
  upsertApplication,
} from "@/lib/store";
import type { ApplicationStatus } from "@/types/domain";
import type { Medium } from "@/types/domain";
import {
  requireArtistId,
  requireArtistOwner,
  requireSessionUser,
  requireVerifiedDirector,
} from "@/lib/auth/guards";
import { flashUrl } from "@/lib/flash";

export async function switchUserAction(formData: FormData) {
  if (process.env.SHOWSHOW_DEMO_PERSONAS !== "1" && process.env.DATABASE_URL?.trim()) {
    throw new Error("Demo personas disabled");
  }
  const userId = String(formData.get("userId") || "user_aria");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, { path: "/" });
  revalidatePath("/", "layout");
}

export async function setThemeAction(formData: FormData) {
  const theme = resolveThemeId(String(formData.get("theme") || ""));
  const jar = await cookies();
  jar.set(THEME_COOKIE, theme, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

export async function resetDemoAction() {
  if (process.env.SHOWSHOW_DEMO_PERSONAS !== "1" && process.env.DATABASE_URL?.trim()) {
    throw new Error("Demo reset disabled");
  }
  await resetDb();
  revalidatePath("/", "layout");
}

export async function saveRoiAction(formData: FormData) {
  const { artistId } = await requireArtistId();
  const formArtistId = String(formData.get("artistId"));
  if (formArtistId !== artistId) throw new Error("Not authorized");
  const editionId = String(formData.get("editionId"));
  const boothFee = Number(formData.get("boothFee") || 0);
  const travel = Number(formData.get("travel") || 0);
  const lodging = Number(formData.get("lodging") || 0);
  const otherExpenses = Number(formData.get("otherExpenses") || 0);
  const grossSales = Number(formData.get("grossSales") || 0);
  const hoursWorked = Number(formData.get("hoursWorked") || 0) || undefined;
  const optInAggregate = formData.get("optInAggregate") === "on";
  const notes = String(formData.get("notes") || "") || undefined;
  const medium = String(formData.get("medium") || "other") as Medium;
  const unitsSold = Number(formData.get("unitsSold") || 0);
  const medium2 = String(formData.get("medium2") || "") as Medium | "";
  const sales2 = Number(formData.get("sales2") || 0);
  const units2 = Number(formData.get("units2") || 0);

  const breakdowns: { medium: Medium; sales: number; unitsSold: number }[] = [];
  if (grossSales) {
    const primarySales = medium2 && sales2 > 0 ? Math.max(grossSales - sales2, 0) : grossSales;
    breakdowns.push({ medium, sales: primarySales, unitsSold: unitsSold || 1 });
    if (medium2 && sales2 > 0) {
      breakdowns.push({ medium: medium2 as Medium, sales: sales2, unitsSold: units2 || 1 });
    }
  }

  await createRoiReport({
    artistId,
    editionId,
    boothFee,
    travel,
    lodging,
    otherExpenses,
    grossSales,
    hoursWorked,
    optInAggregate,
    notes,
    breakdowns,
  });
  revalidatePath("/roi");
  revalidatePath("/shows/ranked");
}

export async function updateApplicationAction(formData: FormData) {
  const { artistId } = await requireArtistId();
  await upsertApplication({
    artistId,
    editionId: String(formData.get("editionId")),
    status: String(formData.get("status")) as ApplicationStatus,
    officialApplyUrl: String(formData.get("officialApplyUrl") || ""),
    notes: String(formData.get("notes") || "") || undefined,
  });
  revalidatePath("/applications");
  revalidatePath("/calendar");
  revalidatePath("/alerts");
}

export async function claimShowAction(formData: FormData) {
  const user = await requireSessionUser();
  await claimShow({
    userId: user.id,
    showId: String(formData.get("showId")),
    contactEmail: String(formData.get("contactEmail")),
  });
  revalidatePath("/director");
  revalidatePath("/", "layout");
}

export async function addCommentAction(formData: FormData) {
  const user = await requireSessionUser();
  await addComment(
    String(formData.get("editionId")),
    user.id,
    String(formData.get("body")),
  );
  revalidatePath(`/shows/${String(formData.get("showSlug"))}`);
}

export async function createAnnouncementAction(formData: FormData) {
  const user = await requireVerifiedDirector();
  await createAnnouncement({
    editionId: String(formData.get("editionId")),
    directorUserId: user.id,
    title: String(formData.get("title")),
    body: String(formData.get("body")),
    kind: String(formData.get("kind")) as "opening" | "deadline_extension" | "cancellation" | "general",
  });
  revalidatePath("/director");
}

export async function openWaitlistAction(formData: FormData) {
  await requireVerifiedDirector();
  await openWaitlistBooth(
    String(formData.get("editionId")),
    String(formData.get("boothLabel") || "") || undefined,
  );
  revalidatePath("/director");
}

export async function createJuryFeedbackAction(formData: FormData) {
  const { artistId } = await requireArtistId();
  await createJuryFeedback({
    artistId,
    editionId: String(formData.get("editionId")),
    outcome: String(formData.get("outcome")) as "accepted" | "waitlisted" | "declined",
    notes: String(formData.get("notes") || "") || undefined,
  });
  revalidatePath("/jury");
}

export async function createBoothOfferAction(formData: FormData) {
  const { artistId } = await requireArtistId();
  await createBoothOffer({
    artistId,
    editionId: String(formData.get("editionId")),
    availableWindows: String(formData.get("availableWindows")),
    notes: String(formData.get("notes") || "") || undefined,
  });
  revalidatePath("/booth-sit");
}

export async function createBoothRequestAction(formData: FormData) {
  const { artistId } = await requireArtistId();
  await createBoothRequest({
    artistId,
    editionId: String(formData.get("editionId")),
    neededWindow: String(formData.get("neededWindow")),
  });
  revalidatePath("/booth-sit");
}

export async function checkoutProductAction(formData: FormData) {
  const { redirect } = await import("next/navigation");
  const { isPostgresEnabled } = await import("@/lib/db/client");
  const { isStripeConfigured } = await import("@/lib/payments/stripe");
  const { createProductCheckout } = await import("@/lib/payments/ledger");
  const { getSessionUser } = await import("@/lib/session-data");
  const { eq } = await import("drizzle-orm");
  const { requirePostgres } = await import("@/lib/db/client");
  const { products, artists, orders } = await import("@/lib/db/schema");
  const { nanoid } = await import("nanoid");

  if (!isPostgresEnabled() || !isStripeConfigured()) {
    throw new Error(
      "Checkout requires DATABASE_URL and Stripe keys. See docs/ARCHITECTURE.md.",
    );
  }

  const productId = String(formData.get("productId"));
  const quantity = Math.max(1, Number(formData.get("quantity") || 1));
  const user = await getSessionUser();
  const db = requirePostgres();
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)
    .then((r) => r[0]);
  if (!product || !product.active) throw new Error("Product not found");
  if (product.inventory < quantity) throw new Error("Insufficient inventory");
  const artist = await db
    .select()
    .from(artists)
    .where(eq(artists.id, product.artistId))
    .limit(1)
    .then((r) => r[0]);
  if (!artist?.stripeConnectAccountId || !artist.stripeConnectReady) {
    throw new Error("Artist Connect account is not ready");
  }

  const orderId = `ord_${nanoid(10)}`;
  const totalCents = product.priceCents * quantity;
  await db.insert(orders).values({
    id: orderId,
    productId: product.id,
    buyerUserId: user.id,
    artistId: artist.id,
    quantity,
    totalCents,
    status: "pending",
  });

  const origin = process.env.AUTH_URL ?? "http://localhost:3000";
  const session = await createProductCheckout({
    orderId,
    productTitle: product.title,
    quantity,
    unitAmountCents: product.priceCents,
    buyerEmail: user.email,
    artistConnectAccountId: artist.stripeConnectAccountId,
    successUrl: `${origin}/artists/${artist.slug}/store?paid=1`,
    cancelUrl: `${origin}/artists/${artist.slug}/store?cancelled=1`,
    buyerUserId: user.id,
    artistId: artist.id,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

export async function startArtistConnectAction(formData: FormData) {
  const { redirect } = await import("next/navigation");
  const { isPostgresEnabled } = await import("@/lib/db/client");
  const { isStripeConfigured } = await import("@/lib/payments/stripe");
  const { createArtistConnectOnboarding } = await import("@/lib/payments/ledger");

  if (!isPostgresEnabled() || !isStripeConfigured()) {
    throw new Error("Connect onboarding requires DATABASE_URL and Stripe keys.");
  }
  const artistId = String(formData.get("artistId"));
  await requireArtistOwner(artistId);
  const origin = process.env.AUTH_URL ?? "http://localhost:3000";
  const slug = String(formData.get("artistSlug"));
  const { url } = await createArtistConnectOnboarding(
    artistId,
    `${origin}/artists/${slug}/store?connect=return`,
    `${origin}/artists/${slug}/store?connect=refresh`,
  );
  redirect(url);
}

export async function checkoutSponsorshipAction(formData: FormData) {
  const { redirect } = await import("next/navigation");
  const { eq } = await import("drizzle-orm");
  const { nanoid } = await import("nanoid");
  const { isPostgresEnabled, requirePostgres } = await import("@/lib/db/client");
  const { isStripeConfigured } = await import("@/lib/payments/stripe");
  const { createSponsorshipCheckout } = await import("@/lib/payments/ledger");
  const { getSessionUser } = await import("@/lib/session-data");
  const { artists, patronageSubscriptions, sponsorshipTiers } = await import(
    "@/lib/db/schema"
  );

  if (!isPostgresEnabled() || !isStripeConfigured()) {
    throw new Error("Sponsorship requires DATABASE_URL and Stripe keys.");
  }

  const tierId = String(formData.get("tierId"));
  const user = await getSessionUser();
  const db = requirePostgres();
  const tier = await db
    .select()
    .from(sponsorshipTiers)
    .where(eq(sponsorshipTiers.id, tierId))
    .limit(1)
    .then((r) => r[0]);
  if (!tier?.active) throw new Error("Tier not found");
  const artist = await db
    .select()
    .from(artists)
    .where(eq(artists.id, tier.artistId))
    .limit(1)
    .then((r) => r[0]);
  if (!artist?.stripeConnectAccountId || !artist.stripeConnectReady) {
    throw new Error("Artist Connect account is not ready");
  }

  const subscriptionId = `sub_${nanoid(10)}`;
  await db.insert(patronageSubscriptions).values({
    id: subscriptionId,
    tierId: tier.id,
    patronUserId: user.id,
    artistId: artist.id,
    status: "pending",
  });

  const origin = process.env.AUTH_URL ?? "http://localhost:3000";
  const session = await createSponsorshipCheckout({
    subscriptionId,
    tierName: tier.name,
    monthlyPriceCents: tier.monthlyPriceCents,
    patronEmail: user.email,
    patronUserId: user.id,
    artistId: artist.id,
    artistConnectAccountId: artist.stripeConnectAccountId,
    successUrl: `${origin}/artists/${artist.slug}/sponsor?subscribed=1`,
    cancelUrl: `${origin}/artists/${artist.slug}/sponsor?cancelled=1`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

export async function checkoutPromotionAction(formData: FormData) {
  await requireVerifiedDirector();
  const { redirect } = await import("next/navigation");
  const { eq } = await import("drizzle-orm");
  const { nanoid } = await import("nanoid");
  const { isPostgresEnabled, requirePostgres } = await import("@/lib/db/client");
  const { isStripeConfigured } = await import("@/lib/payments/stripe");
  const { createPromotionCheckout } = await import("@/lib/payments/ledger");
  const { getSessionUser } = await import("@/lib/session-data");
  const { promotions, shows } = await import("@/lib/db/schema");

  if (!isPostgresEnabled() || !isStripeConfigured()) {
    throw new Error("Promotions require DATABASE_URL and Stripe keys.");
  }

  const showId = String(formData.get("showId"));
  const budgetCents = Math.max(2500, Number(formData.get("budgetCents") || 5000));
  const days = Math.min(30, Math.max(7, Number(formData.get("days") || 14)));
  const user = await getSessionUser();
  const db = requirePostgres();
  const show = await db
    .select()
    .from(shows)
    .where(eq(shows.id, showId))
    .limit(1)
    .then((r) => r[0]);
  if (!show) throw new Error("Show not found");

  const startsAt = new Date();
  const endsAt = new Date(Date.now() + days * 86400000);
  const promotionId = `promo_${nanoid(10)}`;
  await db.insert(promotions).values({
    id: promotionId,
    showId,
    directorUserId: user.id,
    startsAt,
    endsAt,
    budgetCents,
    status: "pending",
  });

  const origin = process.env.AUTH_URL ?? "http://localhost:3000";
  const session = await createPromotionCheckout({
    promotionId,
    showName: show.name,
    budgetCents,
    payerEmail: user.email,
    payerUserId: user.id,
    successUrl: `${origin}/director?promoted=1`,
    cancelUrl: `${origin}/director?cancelled=1`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

export async function signInAction(formData: FormData) {
  const { redirect } = await import("next/navigation");
  const { AuthError } = await import("next-auth");
  const { signIn } = await import("@/lib/auth");

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/settings");

  if (!email || !password) {
    redirect(flashUrl("/settings", { error: "Email and password are required.", next }));
  }

  try {
    await signIn("credentials", { email, password, redirectTo: next });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect(flashUrl("/settings", { error: "Invalid email or password.", next }));
    }
    throw err;
  }
}

export async function registerAccountAction(formData: FormData) {
  const { redirect } = await import("next/navigation");
  const { isPostgresEnabled } = await import("@/lib/db/client");
  const { signIn } = await import("@/lib/auth");
  const { pgRegisterUser } = await import("@/lib/store/pg-repo");

  if (!isPostgresEnabled()) {
    redirect(flashUrl("/settings", { error: "Signup requires DATABASE_URL (Postgres)." }));
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const roleRaw = String(formData.get("role") || "artist");
  const roles =
    roleRaw === "director"
      ? (["director", "showgoer"] as const)
      : roleRaw === "showgoer"
        ? (["showgoer"] as const)
        : (["artist", "showgoer"] as const);

  if (!name || !email || password.length < 8) {
    redirect(
      flashUrl("/settings", {
        error: "Name, email, and password (8+ characters) are required.",
      }),
    );
  }

  try {
    await pgRegisterUser({
      name,
      email,
      password,
      roles: [...roles],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not create account.";
    redirect(flashUrl("/settings", { error: msg }));
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/settings" });
  } catch {
    redirect(flashUrl("/settings", { success: "Account created. Sign in with your email." }));
  }
}

export async function requestPasswordResetAction(formData: FormData) {
  const { redirect } = await import("next/navigation");
  const { isPostgresEnabled } = await import("@/lib/db/client");
  const { requestPasswordReset } = await import("@/lib/auth/password-reset");

  if (!isPostgresEnabled()) {
    throw new Error("Password reset requires DATABASE_URL (Postgres).");
  }

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (!email) throw new Error("Email is required.");

  const result = await requestPasswordReset(email);
  const params = new URLSearchParams({ sent: "1" });
  if (result.previewUrl) params.set("preview", result.previewUrl);
  redirect(`/forgot-password?${params.toString()}`);
}

export async function resetPasswordAction(formData: FormData) {
  const { redirect } = await import("next/navigation");
  const { isPostgresEnabled } = await import("@/lib/db/client");
  const { resetPasswordWithToken } = await import("@/lib/auth/password-reset");

  if (!isPostgresEnabled()) {
    throw new Error("Password reset requires DATABASE_URL (Postgres).");
  }

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password !== confirm) {
    redirect(flashUrl("/reset-password", { error: "Passwords do not match.", email, token }));
  }
  try {
    await resetPasswordWithToken({ email, token, password });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not reset password.";
    redirect(flashUrl("/reset-password", { error: msg, email, token }));
  }
  redirect("/settings?reset=1");
}
