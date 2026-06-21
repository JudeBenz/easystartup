"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { PenLine, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { sendMessageAction } from "@/app/actions/messaging";
import type { Crew, User } from "@/types/domain";
import type { MessageScope } from "@/types/domain";

interface Props {
  isManager: boolean;
  crews:     Crew[];
  users:     User[];
  actorId:   string;
}

type ScopeKey = "all" | `crew:${string}` | `user:${string}`;

function parseScopeKey(key: ScopeKey): MessageScope {
  if (key === "all") return { type: "all" };
  const [type, id] = key.split(":") as ["crew" | "user", string];
  return { type, id };
}

export function ComposeDialog({ isManager, crews, users, actorId }: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [scopeKey, setScopeKey] = useState<ScopeKey>("all");
  const [isInstruction, setIsInstruction] = useState(false);
  const [pending, start] = useTransition();

  const canSend = body.trim().length > 0;

  function reset() {
    setBody("");
    setScopeKey("all");
    setIsInstruction(false);
  }

  function handleSend() {
    if (!canSend) return;
    const scope = parseScopeKey(scopeKey);
    start(async () => {
      await sendMessageAction({ scope, body, isInstruction: isInstruction || undefined });
      reset();
      setOpen(false);
      toast.success("Message sent");
    });
  }

  // Recipients: owner/trainer can message everyone; employees can only message all or crews they're in
  const scopeOptions: Array<{ key: ScopeKey; label: string }> = [
    { key: "all", label: "Everyone" },
    ...crews.map((c) => ({ key: `crew:${c.id}` as ScopeKey, label: c.name })),
    ...(isManager
      ? users
          .filter((u) => u.id !== actorId)
          .map((u) => ({ key: `user:${u.id}` as ScopeKey, label: u.name }))
      : []),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          className="flex min-h-[44px] items-center gap-2 rounded-lg bg-navy px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          aria-label="Compose new message"
        >
          <PenLine className="h-4 w-4" aria-hidden="true" />
          Compose
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold text-ink">
            New message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient */}
          <div>
            <label
              htmlFor="compose-scope"
              className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
            >
              To
            </label>
            <select
              id="compose-scope"
              value={scopeKey}
              onChange={(e) => setScopeKey(e.target.value as ScopeKey)}
              className="h-10 w-full rounded-lg border border-input bg-panel px-3 font-mono text-sm text-ink focus:outline-none focus:ring-1 focus:ring-navy"
            >
              {scopeOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Message body */}
          <div>
            <label
              htmlFor="compose-body"
              className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-faint"
            >
              Message
            </label>
            <Textarea
              id="compose-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              className="min-h-[100px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
              }}
            />
          </div>

          {/* Instruction toggle — managers only */}
          {isManager && (
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isInstruction}
                onChange={(e) => setIsInstruction(e.target.checked)}
                className="h-4 w-4 rounded border-rule accent-navy"
              />
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-soft">
                Mark as daily instruction
              </span>
            </label>
          )}
        </div>

        <DialogFooter className="mt-2 flex gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 items-center rounded-lg border border-rule px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-soft transition-colors hover:bg-paper"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || pending}
            className="flex min-h-[40px] items-center gap-2 rounded-lg bg-navy px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Send
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
