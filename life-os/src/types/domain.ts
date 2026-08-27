export type AccountType = "checking" | "savings" | "cash" | "credit";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  updatedAt: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  type: TransactionType;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  spent: number;
  month: string; // YYYY-MM
  color: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  recurrence?: "daily" | "weekly" | "monthly";
  updatedAt: string;
}

export type ProjectStatus = "planning" | "active" | "paused" | "done";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  done: boolean;
  dueDate?: string;
  priority: TaskPriority;
  order: number;
  updatedAt: string;
}

export interface WindowState {
  moduleId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
}

export interface AppMeta {
  version: string;
  lastSynced?: string;
}

export type ErrandFrequency = "daily" | "every_2_days" | "every_3_days" | "weekly";

export interface Errand {
  id: string;
  title: string;
  frequency: ErrandFrequency;
  /** YYYY-MM-DD of last completion; undefined if never */
  lastCompletedAt?: string;
  /** streak of consecutive periods completed */
  streak: number;
  color: string;
  order: number;
  archived: boolean;
  updatedAt: string;
}

export type PhoneThemeId = "ls-night" | "vinewood" | "sandy" | "downtown";

export interface PhonePrefs {
  themeId: PhoneThemeId;
  notificationsEnabled: boolean;
}
