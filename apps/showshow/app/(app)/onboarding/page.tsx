import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { completeOnboardingAction } from "@/lib/actions";
import { getSessionUser, getSessionArtistId } from "@/lib/session-data";
import { MEDIUM_LABELS } from "@/lib/format";
import type { Medium } from "@/types/domain";

export const metadata = { title: "Finish setup" };

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/onboarding");
  const artistId = await getSessionArtistId();
  const isArtist = Boolean(artistId);
  const isDirector = Boolean(user?.roles.includes("director"));

  return (
    <div>
      <PageHeader
        title="A few facts so the app fits you"
        description={
          isArtist
            ? "Medium and home base help the directory and ROI tracker stay useful."
            : isDirector
              ? "You can claim your fair from the director desk next."
              : "Follow artists and open weekend maps whenever you are at a fair."
        }
      />
      <Panel well className="max-w-lg">
        {isArtist ? (
          <form action={completeOnboardingAction} className="grid gap-3">
            <label className="ss-label">
              Home city
              <input name="city" required className="ss-input" />
            </label>
            <label className="ss-label">
              State / region
              <input name="region" required maxLength={2} className="ss-input" placeholder="MI" />
            </label>
            <label className="ss-label">
              One-line practice
              <input name="tagline" className="ss-input" placeholder="Wood-fired tableware" />
            </label>
            <fieldset>
              <legend className="ss-label">Mediums</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.keys(MEDIUM_LABELS) as Medium[]).map((m) => (
                  <label key={m} className="flex min-h-[48px] items-center gap-2 text-base">
                    <input type="checkbox" name="mediums" value={m} />
                    {MEDIUM_LABELS[m]}
                  </label>
                ))}
              </div>
            </fieldset>
            <SubmitButton>Save and continue</SubmitButton>
          </form>
        ) : (
          <div className="grid gap-3">
            <p className="text-[1.05rem] text-[var(--muted)]">
              {isDirector
                ? "Claim your show with the organizer email on the director desk."
                : "Browse shows and follow artists. Your account is ready."}
            </p>
            <Link
              href={isDirector ? "/director" : "/shows"}
              className="ss-btn ss-btn-primary self-start"
            >
              {isDirector ? "Open director desk" : "Browse shows"}
            </Link>
          </div>
        )}
      </Panel>
    </div>
  );
}
