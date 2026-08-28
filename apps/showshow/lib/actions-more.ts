"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import {
  requireAdmin,
  requireArtistId,
  requireArtistOwner,
  requireSessionUser,
} from "@/lib/auth/guards";
import { flashUrl } from "@/lib/flash";

export async function toggleFollowArtistAction(formData: FormData) {
  const user = await requireSessionUser();
  const artistId = String(formData.get("artistId"));
  const slug = String(formData.get("artistSlug"));
  const { isPostgresEnabled } = await import("@/lib/db/client");
  if (!isPostgresEnabled()) throw new Error("Follow requires Postgres");
  const { pgToggleFollowArtist } = await import("@/lib/store/pg-social");
  await pgToggleFollowArtist(user.id, artistId);
  revalidatePath(`/artists/${slug}`);
}

export async function toggleFavoriteShowAction(formData: FormData) {
  const user = await requireSessionUser();
  const showId = String(formData.get("showId"));
  const slug = String(formData.get("showSlug"));
  const { isPostgresEnabled } = await import("@/lib/db/client");
  if (!isPostgresEnabled()) throw new Error("Favorites require Postgres");
  const { pgToggleFavoriteShow } = await import("@/lib/store/pg-social");
  await pgToggleFavoriteShow(user.id, showId);
  revalidatePath(`/shows/${slug}/weekend`);
}

export async function createPostAction(formData: FormData) {
  try {
    const user = await requireSessionUser();
    const body = String(formData.get("body") || "").trim();
    if (!body) {
      redirect(flashUrl("/feed", { error: "Write something before posting." }));
    }
    const { isPostgresEnabled } = await import("@/lib/db/client");
    if (!isPostgresEnabled()) {
      redirect(flashUrl("/feed", { error: "Posts require Postgres." }));
    }
    const { pgCreatePost } = await import("@/lib/store/pg-social");
    let artistId: string | undefined;
    if (user.roles.includes("artist")) {
      const { getArtistIdForUser } = await import("@/lib/store");
      artistId = (await getArtistIdForUser(user.id)) ?? undefined;
    }
    await pgCreatePost({ authorUserId: user.id, body, artistId });
    revalidatePath("/feed");
    redirect("/feed?posted=1");
  } catch (err) {
    unstable_rethrow(err);
    const msg = err instanceof Error ? err.message : "Could not post.";
    redirect(flashUrl("/feed", { error: msg }));
  }
}

export async function saveProductAction(formData: FormData) {
  const artistId = String(formData.get("artistId"));
  await requireArtistOwner(artistId);
  const { isPostgresEnabled } = await import("@/lib/db/client");
  if (!isPostgresEnabled()) throw new Error("Products require Postgres");
  const { pgUpsertProduct } = await import("@/lib/store/pg-social");
  const productId = String(formData.get("productId") || "") || undefined;
  const slug = String(formData.get("artistSlug"));
  await pgUpsertProduct({
    artistId,
    productId,
    title: String(formData.get("title")),
    description: String(formData.get("description") || ""),
    priceCents: Math.max(100, Number(formData.get("priceCents") || 0)),
    inventory: Math.max(0, Number(formData.get("inventory") || 0)),
    medium: String(formData.get("medium") || "other"),
    active: formData.get("active") !== "off",
  });
  revalidatePath(`/artists/${slug}/store`);
  revalidatePath(`/artists/${slug}/store/manage`);
}

export async function saveSponsorshipTierAction(formData: FormData) {
  const artistId = String(formData.get("artistId"));
  await requireArtistOwner(artistId);
  const { isPostgresEnabled } = await import("@/lib/db/client");
  if (!isPostgresEnabled()) throw new Error("Tiers require Postgres");
  const { pgUpsertSponsorshipTier } = await import("@/lib/store/pg-social");
  const perks = String(formData.get("perks") || "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  const slug = String(formData.get("artistSlug"));
  await pgUpsertSponsorshipTier({
    artistId,
    tierId: String(formData.get("tierId") || "") || undefined,
    name: String(formData.get("name")),
    monthlyPriceCents: Math.max(500, Number(formData.get("monthlyPriceCents") || 0)),
    perks,
  });
  revalidatePath(`/artists/${slug}/sponsor`);
  revalidatePath(`/artists/${slug}/store/manage`);
}

export async function shipOrderAction(formData: FormData) {
  const { artistId } = await requireArtistId();
  const { isPostgresEnabled } = await import("@/lib/db/client");
  if (!isPostgresEnabled()) throw new Error("Orders require Postgres");
  const { pgUpdateOrderStatus } = await import("@/lib/store/pg-social");
  await pgUpdateOrderStatus(String(formData.get("orderId")), artistId, "shipped");
  revalidatePath("/orders");
}

export async function verifyDirectorAction(formData: FormData) {
  const admin = await requireAdmin();
  const { isPostgresEnabled } = await import("@/lib/db/client");
  if (!isPostgresEnabled()) throw new Error("Admin requires Postgres");
  const { pgVerifyDirector } = await import("@/lib/store/pg-social");
  const directorId = String(formData.get("directorId"));
  await pgVerifyDirector(directorId, admin.id);
  revalidatePath("/admin/directors");
}
