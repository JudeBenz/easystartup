"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase-client";
import { startSync, stopSync } from "./engine";
import { useLifeStore } from "@/lib/store";

/**
 * Boots auth session + realtime sync when Supabase is configured.
 * Place once in the app shell.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const setSyncUserEmail = useLifeStore((s) => s.setSyncUserEmail);
  const setSyncStatus = useLifeStore((s) => s.setSyncStatus);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSyncStatus("unconfigured");
      setReady(true);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }

    let active = true;

    async function boot(user: User | null) {
      if (!active) return;
      if (user) {
        setSyncUserEmail(user.email ?? user.id);
        await startSync(user);
      } else {
        setSyncUserEmail(null);
        await stopSync();
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      boot(data.session?.user ?? null).finally(() => {
        if (active) setReady(true);
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      boot(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      stopSync();
    };
  }, [setSyncStatus, setSyncUserEmail]);

  // Don't block UI — sync boots in background
  void ready;
  return <>{children}</>;
}

export async function signInWithMagicLink(email: string): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo:
        typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  if (error) throw error;
  return "Check your email for the magic link — open it on this device.";
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await stopSync();
  await supabase.auth.signOut();
}
