import { useLifeStore } from "@/lib/store";
import type { AppContextSnapshot } from "@/types/ai";

export function buildContextSnapshot(): AppContextSnapshot {
  const state = useLifeStore.getState();
  const today = new Date().toISOString().slice(0, 10);

  const upcomingEvents = [...state.events]
    .filter((e) => e.start.slice(0, 10) >= today)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 20)
    .map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
    }));

  const openTasks = state.tasks
    .filter((t) => !t.done)
    .slice(0, 30)
    .map((t) => ({
      id: t.id,
      projectId: t.projectId,
      title: t.title,
      done: t.done,
      dueDate: t.dueDate,
    }));

  return {
    today,
    accounts: state.accounts.map((a) => ({
      id: a.id,
      name: a.name,
      balance: a.balance,
      type: a.type,
    })),
    recentTransactions: state.transactions.slice(0, 15).map((t) => ({
      id: t.id,
      amount: t.amount,
      category: t.category,
      note: t.note,
      date: t.date,
      type: t.type,
    })),
    budgetCategories: state.budgetCategories.map((c) => ({
      name: c.name,
      spent: c.spent,
      limit: c.limit,
      month: c.month,
    })),
    upcomingEvents,
    projects: state.projects.map((p) => {
      const pTasks = state.tasks.filter((t) => t.projectId === p.id);
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        taskCount: pTasks.length,
        doneCount: pTasks.filter((t) => t.done).length,
      };
    }),
    openTasks,
  };
}

export function formatContextForPrompt(context: AppContextSnapshot): string {
  return `Current app state (JSON):
${JSON.stringify(context, null, 2)}`;
}
