import type {
  Account,
  BudgetCategory,
  CalendarEvent,
  Errand,
  Project,
  Task,
  Transaction,
} from "@/types/domain";

export type SyncTable =
  | "accounts"
  | "transactions"
  | "budget_categories"
  | "events"
  | "projects"
  | "tasks"
  | "errands";

export interface SyncPayload {
  accounts: Account[];
  transactions: Transaction[];
  budgetCategories: BudgetCategory[];
  events: CalendarEvent[];
  projects: Project[];
  tasks: Task[];
}

export type SyncStatus = "offline" | "connecting" | "synced" | "error" | "unconfigured";

/** Last-write-wins merge by updatedAt */
export function mergeByUpdatedAt<T extends { id: string; updatedAt: string }>(
  local: T[],
  remote: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const existing = map.get(item.id);
    if (!existing || item.updatedAt > existing.updatedAt) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

export function accountToRow(a: Account, userId: string) {
  return {
    id: a.id,
    user_id: userId,
    name: a.name,
    type: a.type,
    balance: a.balance,
    color: a.color,
    updated_at: a.updatedAt,
  };
}

export function rowToAccount(r: Record<string, unknown>): Account {
  return {
    id: String(r.id),
    name: String(r.name),
    type: r.type as Account["type"],
    balance: Number(r.balance),
    color: String(r.color),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export function transactionToRow(t: Transaction, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    account_id: t.accountId,
    amount: t.amount,
    category: t.category,
    note: t.note,
    date: t.date,
    type: t.type,
    updated_at: t.updatedAt,
  };
}

export function rowToTransaction(r: Record<string, unknown>): Transaction {
  return {
    id: String(r.id),
    accountId: String(r.account_id),
    amount: Number(r.amount),
    category: String(r.category),
    note: String(r.note),
    date: String(r.date),
    type: r.type as Transaction["type"],
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export function budgetToRow(c: BudgetCategory, userId: string) {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    limit_amount: c.limit,
    spent: c.spent,
    month: c.month,
    color: c.color,
    updated_at: c.updatedAt,
  };
}

export function rowToBudget(r: Record<string, unknown>): BudgetCategory {
  return {
    id: String(r.id),
    name: String(r.name),
    limit: Number(r.limit_amount),
    spent: Number(r.spent),
    month: String(r.month),
    color: String(r.color),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export function eventToRow(e: CalendarEvent, userId: string) {
  return {
    id: e.id,
    user_id: userId,
    title: e.title,
    start_at: e.start,
    end_at: e.end,
    all_day: e.allDay,
    color: e.color,
    recurrence: e.recurrence ?? null,
    updated_at: e.updatedAt,
  };
}

export function rowToEvent(r: Record<string, unknown>): CalendarEvent {
  return {
    id: String(r.id),
    title: String(r.title),
    start: String(r.start_at),
    end: String(r.end_at),
    allDay: Boolean(r.all_day),
    color: String(r.color),
    recurrence: (r.recurrence as CalendarEvent["recurrence"]) ?? undefined,
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export function projectToRow(p: Project, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    name: p.name,
    description: p.description,
    status: p.status,
    color: p.color,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function rowToProject(r: Record<string, unknown>): Project {
  return {
    id: String(r.id),
    name: String(r.name),
    description: String(r.description),
    status: r.status as Project["status"],
    color: String(r.color),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export function taskToRow(t: Task, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    project_id: t.projectId,
    title: t.title,
    done: t.done,
    due_date: t.dueDate ?? null,
    priority: t.priority,
    sort_order: t.order,
    updated_at: t.updatedAt,
  };
}

export function rowToTask(r: Record<string, unknown>): Task {
  return {
    id: String(r.id),
    projectId: String(r.project_id),
    title: String(r.title),
    done: Boolean(r.done),
    dueDate: r.due_date ? String(r.due_date) : undefined,
    priority: r.priority as Task["priority"],
    order: Number(r.sort_order),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export function errandToRow(e: Errand, userId: string) {
  return {
    id: e.id,
    user_id: userId,
    title: e.title,
    frequency: e.frequency,
    last_completed_at: e.lastCompletedAt ?? null,
    streak: e.streak,
    color: e.color,
    sort_order: e.order,
    archived: e.archived,
    updated_at: e.updatedAt,
  };
}

export function rowToErrand(r: Record<string, unknown>): Errand {
  return {
    id: String(r.id),
    title: String(r.title),
    frequency: r.frequency as Errand["frequency"],
    lastCompletedAt: r.last_completed_at
      ? String(r.last_completed_at)
      : undefined,
    streak: Number(r.streak ?? 0),
    color: String(r.color ?? "#2ecc71"),
    order: Number(r.sort_order ?? 0),
    archived: Boolean(r.archived),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}
