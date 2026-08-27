"use client";

import type { RealtimeChannel, User } from "@supabase/supabase-js";
import { useLifeStore } from "@/lib/store";
import { getSupabase, isSupabaseConfigured } from "./supabase-client";
import {
  accountToRow,
  budgetToRow,
  errandToRow,
  eventToRow,
  mergeByUpdatedAt,
  projectToRow,
  rowToAccount,
  rowToBudget,
  rowToErrand,
  rowToEvent,
  rowToProject,
  rowToTask,
  rowToTransaction,
  taskToRow,
  transactionToRow,
  type SyncStatus,
} from "./mappers";

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let channel: RealtimeChannel | null = null;
let applyingRemote = false;
let started = false;
let unsubscribeStore: (() => void) | null = null;

function setStatus(status: SyncStatus, error?: string) {
  useLifeStore.getState().setSyncStatus(status, error);
}

export async function pullAndMerge(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const tables = [
    "accounts",
    "transactions",
    "budget_categories",
    "events",
    "projects",
    "tasks",
    "errands",
  ] as const;

  const results = await Promise.all(
    tables.map((table) =>
      supabase.from(table).select("*").eq("user_id", userId),
    ),
  );

  for (const res of results) {
    if (res.error) throw res.error;
  }

  const [accounts, transactions, budgets, events, projects, tasks, errands] =
    results.map((r) => r.data ?? []);

  const state = useLifeStore.getState();
  applyingRemote = true;
  try {
    useLifeStore.setState({
      accounts: mergeByUpdatedAt(
        state.accounts,
        accounts.map((r) => rowToAccount(r as Record<string, unknown>)),
      ),
      transactions: mergeByUpdatedAt(
        state.transactions,
        transactions.map((r) => rowToTransaction(r as Record<string, unknown>)),
      ),
      budgetCategories: mergeByUpdatedAt(
        state.budgetCategories,
        budgets.map((r) => rowToBudget(r as Record<string, unknown>)),
      ),
      events: mergeByUpdatedAt(
        state.events,
        events.map((r) => rowToEvent(r as Record<string, unknown>)),
      ),
      projects: mergeByUpdatedAt(
        state.projects,
        projects.map((r) => rowToProject(r as Record<string, unknown>)),
      ),
      tasks: mergeByUpdatedAt(
        state.tasks,
        tasks.map((r) => rowToTask(r as Record<string, unknown>)),
      ),
      errands: mergeByUpdatedAt(
        state.errands,
        errands.map((r) => rowToErrand(r as Record<string, unknown>)),
      ),
      lastSyncedAt: new Date().toISOString(),
    });
  } finally {
    applyingRemote = false;
  }
}

export async function pushAll(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const state = useLifeStore.getState();

  const ops = [
    supabase.from("accounts").upsert(
      state.accounts.map((a) => accountToRow(a, userId)),
      { onConflict: "id" },
    ),
    supabase.from("transactions").upsert(
      state.transactions.map((t) => transactionToRow(t, userId)),
      { onConflict: "id" },
    ),
    supabase.from("budget_categories").upsert(
      state.budgetCategories.map((c) => budgetToRow(c, userId)),
      { onConflict: "id" },
    ),
    supabase.from("events").upsert(
      state.events.map((e) => eventToRow(e, userId)),
      { onConflict: "id" },
    ),
    supabase.from("projects").upsert(
      state.projects.map((p) => projectToRow(p, userId)),
      { onConflict: "id" },
    ),
    supabase.from("tasks").upsert(
      state.tasks.map((t) => taskToRow(t, userId)),
      { onConflict: "id" },
    ),
    supabase.from("errands").upsert(
      state.errands.map((e) => errandToRow(e, userId)),
      { onConflict: "id" },
    ),
  ];

  const results = await Promise.all(ops);
  for (const r of results) {
    if (r.error) throw r.error;
  }

  useLifeStore.getState().setSyncStatus("synced");
  useLifeStore.setState({ lastSyncedAt: new Date().toISOString() });
}

function schedulePush(userId: string) {
  if (applyingRemote) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushAll(userId).catch((err) => {
      console.error("sync push failed", err);
      setStatus("error", err instanceof Error ? err.message : "Push failed");
    });
  }, 800);
}

function applyRemoteRow(
  table: string,
  row: Record<string, unknown>,
  eventType: string,
) {
  applyingRemote = true;
  try {
    const state = useLifeStore.getState();

    if (eventType === "DELETE") {
      const id = String(row.id);
      if (table === "accounts") {
        useLifeStore.setState({
          accounts: state.accounts.filter((a) => a.id !== id),
        });
      } else if (table === "transactions") {
        useLifeStore.setState({
          transactions: state.transactions.filter((t) => t.id !== id),
        });
      } else if (table === "budget_categories") {
        useLifeStore.setState({
          budgetCategories: state.budgetCategories.filter((c) => c.id !== id),
        });
      } else if (table === "events") {
        useLifeStore.setState({
          events: state.events.filter((e) => e.id !== id),
        });
      } else if (table === "projects") {
        useLifeStore.setState({
          projects: state.projects.filter((p) => p.id !== id),
        });
      } else if (table === "tasks") {
        useLifeStore.setState({
          tasks: state.tasks.filter((t) => t.id !== id),
        });
      } else if (table === "errands") {
        useLifeStore.setState({
          errands: state.errands.filter((e) => e.id !== id),
        });
      }
      return;
    }

    if (table === "accounts") {
      const item = rowToAccount(row);
      useLifeStore.setState({
        accounts: mergeByUpdatedAt(state.accounts, [item]),
      });
    } else if (table === "transactions") {
      const item = rowToTransaction(row);
      useLifeStore.setState({
        transactions: mergeByUpdatedAt(state.transactions, [item]),
      });
    } else if (table === "budget_categories") {
      const item = rowToBudget(row);
      useLifeStore.setState({
        budgetCategories: mergeByUpdatedAt(state.budgetCategories, [item]),
      });
    } else if (table === "events") {
      const item = rowToEvent(row);
      useLifeStore.setState({
        events: mergeByUpdatedAt(state.events, [item]),
      });
    } else if (table === "projects") {
      const item = rowToProject(row);
      useLifeStore.setState({
        projects: mergeByUpdatedAt(state.projects, [item]),
      });
    } else if (table === "tasks") {
      const item = rowToTask(row);
      useLifeStore.setState({
        tasks: mergeByUpdatedAt(state.tasks, [item]),
      });
    } else if (table === "errands") {
      const item = rowToErrand(row);
      useLifeStore.setState({
        errands: mergeByUpdatedAt(state.errands, [item]),
      });
    }
  } finally {
    applyingRemote = false;
  }
}

function subscribeRealtime(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }

  const tables = [
    "accounts",
    "transactions",
    "budget_categories",
    "events",
    "projects",
    "tasks",
    "errands",
  ];

  let ch = supabase.channel(`life-os-${userId}`);
  for (const table of tables) {
    ch = ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
      (payload) => {
        const row = (payload.new ?? payload.old) as Record<string, unknown>;
        if (!row?.id) return;
        applyRemoteRow(table, row, payload.eventType);
        useLifeStore.setState({ lastSyncedAt: new Date().toISOString() });
        setStatus("synced");
      },
    );
  }

  channel = ch.subscribe((status) => {
    if (status === "SUBSCRIBED") setStatus("synced");
  });
}

export async function startSync(user: User): Promise<void> {
  if (!isSupabaseConfigured()) {
    setStatus("unconfigured");
    return;
  }

  setStatus("connecting");
  try {
    await pullAndMerge(user.id);
    await pushAll(user.id);
    subscribeRealtime(user.id);

    if (unsubscribeStore) unsubscribeStore();
    unsubscribeStore = useLifeStore.subscribe((state, prev) => {
      if (applyingRemote) return;
      const changed =
        state.accounts !== prev.accounts ||
        state.transactions !== prev.transactions ||
        state.budgetCategories !== prev.budgetCategories ||
        state.events !== prev.events ||
        state.projects !== prev.projects ||
        state.tasks !== prev.tasks ||
        state.errands !== prev.errands;
      if (changed) schedulePush(user.id);
    });

    started = true;
    setStatus("synced");
  } catch (err) {
    console.error("startSync failed", err);
    setStatus("error", err instanceof Error ? err.message : "Sync failed");
  }
}

export async function stopSync(): Promise<void> {
  const supabase = getSupabase();
  if (channel && supabase) {
    await supabase.removeChannel(channel);
    channel = null;
  }
  if (unsubscribeStore) {
    unsubscribeStore();
    unsubscribeStore = null;
  }
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  started = false;
  setStatus(isSupabaseConfigured() ? "offline" : "unconfigured");
}

export function isSyncStarted() {
  return started;
}
