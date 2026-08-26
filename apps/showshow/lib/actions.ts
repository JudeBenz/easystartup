"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import {
  addComment,
  createAnnouncement,
  createRoiReport,
  openWaitlistBooth,
  resetDb,
  upsertApplication,
} from "@/lib/store";
import type { ApplicationStatus } from "@/types/domain";
import type { Medium } from "@/types/domain";

export async function switchUserAction(formData: FormData) {
  const userId = String(formData.get("userId") || "user_aria");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, { path: "/" });
  revalidatePath("/", "layout");
}

export async function resetDemoAction() {
  await resetDb();
  revalidatePath("/", "layout");
}

export async function saveRoiAction(formData: FormData) {
  const artistId = String(formData.get("artistId"));
  const editionId = String(formData.get("editionId"));
  const boothFee = Number(formData.get("boothFee") || 0);
  const travel = Number(formData.get("travel") || 0);
  const lodging = Number(formData.get("lodging") || 0);
  const otherExpenses = Number(formData.get("otherExpenses") || 0);
  const grossSales = Number(formData.get("grossSales") || 0);
  const optInAggregate = formData.get("optInAggregate") === "on";
  const notes = String(formData.get("notes") || "") || undefined;
  const medium = String(formData.get("medium") || "other") as Medium;
  const unitsSold = Number(formData.get("unitsSold") || 0);

  await createRoiReport({
    artistId,
    editionId,
    boothFee,
    travel,
    lodging,
    otherExpenses,
    grossSales,
    optInAggregate,
    notes,
    breakdowns: grossSales
      ? [{ medium, sales: grossSales, unitsSold: unitsSold || 1 }]
      : [],
  });
  revalidatePath("/roi");
  revalidatePath("/shows/ranked");
}

export async function updateApplicationAction(formData: FormData) {
  await upsertApplication({
    artistId: String(formData.get("artistId")),
    editionId: String(formData.get("editionId")),
    status: String(formData.get("status")) as ApplicationStatus,
    officialApplyUrl: String(formData.get("officialApplyUrl")),
    notes: String(formData.get("notes") || "") || undefined,
  });
  revalidatePath("/applications");
  revalidatePath("/calendar");
}

export async function addCommentAction(formData: FormData) {
  await addComment(
    String(formData.get("editionId")),
    String(formData.get("authorUserId")),
    String(formData.get("body")),
  );
  revalidatePath(`/shows/${String(formData.get("showSlug"))}`);
}

export async function createAnnouncementAction(formData: FormData) {
  await createAnnouncement({
    editionId: String(formData.get("editionId")),
    directorUserId: String(formData.get("directorUserId")),
    title: String(formData.get("title")),
    body: String(formData.get("body")),
    kind: String(formData.get("kind")) as "opening" | "deadline_extension" | "cancellation" | "general",
  });
  revalidatePath("/director");
}

export async function openWaitlistAction(formData: FormData) {
  await openWaitlistBooth(
    String(formData.get("editionId")),
    String(formData.get("boothLabel") || "") || undefined,
  );
  revalidatePath("/director");
}
