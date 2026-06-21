import Link from "next/link";
import { ChevronRight, Pin } from "lucide-react";
import { getRole, getActingUser } from "@/lib/session";
import {
  getMessagesForUser,
  getJobThread,
  getJobsForDate,
  getCrews,
  getUsers,
  getUser,
  demoToday,
} from "@/lib/store";
import { initialsOf, cn } from "@/lib/utils";
import { ComposeDialog } from "@/components/messages/compose-dialog";
import type { Message } from "@/types/domain";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

function ScopeLabel({ scope }: { scope: Message["scope"] }) {
  const crews = getCrews();
  if (scope.type === "all") {
    return (
      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-faint">
        Everyone
      </span>
    );
  }
  if (scope.type === "crew") {
    const crew = crews.find((c) => c.id === scope.id);
    return (
      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-faint">
        {crew?.name ?? "Crew"}
      </span>
    );
  }
  if (scope.type === "user" && scope.id) {
    const u = getUser(scope.id);
    return (
      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-faint">
        → {u?.name ?? scope.id}
      </span>
    );
  }
  return null;
}

function MessageRow({ msg }: { msg: Message }) {
  const sender = getUser(msg.fromUserId);
  const isInstr = !!msg.isInstruction;

  return (
    <div
      className={cn(
        "flex gap-3 border-b border-rule px-4 py-3.5 last:border-b-0",
        isInstr && "bg-green-bg/40"
      )}
    >
      {/* Avatar */}
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold"
        style={{
          background: isInstr ? "rgb(14 122 78 / 0.15)" : "rgb(228 242 234)",
          color:      isInstr ? "#0B6B43" : "#4C564F",
        }}
        aria-hidden="true"
      >
        {initialsOf(sender?.name ?? "?")}
      </span>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-semibold text-sm text-ink">
            {sender?.name ?? "Unknown"}
          </span>
          <ScopeLabel scope={msg.scope} />
          {isInstr && (
            <span
              className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em]"
              style={{ background: "rgb(14 122 78 / 0.12)", color: "#0B6B43" }}
            >
              <Pin className="h-2.5 w-2.5" aria-hidden="true" />
              Instruction
            </span>
          )}
          <span className="ml-auto font-mono text-[9px] text-faint">
            {fmtTime(msg.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm text-soft leading-snug">{msg.body}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function MessagesPage() {
  const [role, actor] = await Promise.all([getRole(), getActingUser()]);
  const isManager = role === "owner" || role === "trainer";
  const today = demoToday();

  // Messages visible to the acting user
  const messages = getMessagesForUser(actor.id);
  const instructions = messages.filter((m) => m.isInstruction);
  const regular     = messages.filter((m) => !m.isInstruction);

  // Job threads (owner/trainer see all jobs with threads)
  const todayJobs = getJobsForDate(today);
  const jobsWithThreads = todayJobs
    .map((j) => ({ job: j, thread: getJobThread(j.id) }))
    .filter(({ thread }) => thread.length > 0);

  // For compose dialog
  const crews = getCrews();
  const allUsers = getUsers();

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
        <div>
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-navy">
            Comms
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Messages
          </h1>
        </div>
        <ComposeDialog
          isManager={isManager}
          crews={crews}
          users={allUsers}
          actorId={actor.id}
        />
      </div>

      {/* Daily instructions (pinned) */}
      {instructions.length > 0 && (
        <section className="mb-5" aria-label="Daily instructions">
          <div className="mb-3 flex items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Today's instructions
            </p>
            <span className="flex-1 border-t border-rule" />
          </div>
          <div
            className="overflow-hidden rounded-lg border"
            style={{ borderColor: "rgb(14 122 78 / 0.3)" }}
          >
            {instructions.map((m) => (
              <MessageRow key={m.id} msg={m} />
            ))}
          </div>
        </section>
      )}

      {/* Regular messages */}
      {regular.length > 0 && (
        <section className="mb-5" aria-label="Messages">
          <div className="mb-3 flex items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Messages
            </p>
            <span className="flex-1 border-t border-rule" />
          </div>
          <div className="overflow-hidden rounded-lg border border-rule bg-panel">
            {[...regular].reverse().map((m) => (
              <MessageRow key={m.id} msg={m} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="font-display text-lg font-semibold text-soft">
            No messages yet
          </p>
          <p className="font-mono text-[11px] text-faint">
            Broadcasts and instructions will appear here.
          </p>
        </div>
      )}

      {/* Job threads (manager only) */}
      {isManager && jobsWithThreads.length > 0 && (
        <section aria-label="Job threads">
          <div className="mb-3 flex items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Job threads
            </p>
            <span className="flex-1 border-t border-rule" />
          </div>
          <div className="overflow-hidden rounded-lg border border-rule bg-panel">
            {jobsWithThreads.map(({ job, thread }) => {
              const last = thread[thread.length - 1];
              const lastSender = getUser(last.fromUserId);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center gap-3 border-b border-rule px-4 py-3.5 last:border-b-0 transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-navy"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-semibold text-sm text-ink">
                        {job.title}
                      </p>
                      <span className="shrink-0 rounded-full bg-navy px-1.5 py-0.5 font-mono text-[9px] text-white">
                        {thread.length}
                      </span>
                    </div>
                    {last && (
                      <p className="mt-0.5 truncate text-sm text-soft">
                        <span className="font-medium">{lastSender?.name ?? "?"}:</span>{" "}
                        {last.body}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
