import { v4 as uuid } from "uuid";
import type { Errand, ErrandFrequency } from "@/types/domain";

const COLORS = ["#2ecc71", "#3498db", "#9b59b6", "#e67e22", "#e74c3c", "#1abc9c"];

export interface ErrandsSlice {
  errands: Errand[];
  addErrand: (input: {
    title: string;
    frequency?: ErrandFrequency;
    color?: string;
  }) => void;
  toggleErrandToday: (id: string) => void;
  deleteErrand: (id: string) => void;
  updateErrand: (id: string, patch: Partial<Errand>) => void;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.floor(ms / 86400000);
}

function periodDays(freq: ErrandFrequency) {
  switch (freq) {
    case "daily":
      return 1;
    case "every_2_days":
      return 2;
    case "every_3_days":
      return 3;
    case "weekly":
      return 7;
  }
}

/** Whether this errand still needs doing in the current period */
export function isErrandDue(errand: Errand, today = todayStr()): boolean {
  if (errand.archived) return false;
  if (!errand.lastCompletedAt) return true;
  return daysBetween(errand.lastCompletedAt, today) >= periodDays(errand.frequency);
}

export function isErrandDoneToday(errand: Errand, today = todayStr()): boolean {
  return errand.lastCompletedAt === today;
}

export const createErrandsSlice = (
  set: (fn: (state: ErrandsSlice) => Partial<ErrandsSlice>) => void,
): ErrandsSlice => ({
  errands: [],

  addErrand: ({ title, frequency = "daily", color }) =>
    set((state) => ({
      errands: [
        ...state.errands,
        {
          id: uuid(),
          title: title.trim(),
          frequency,
          streak: 0,
          color: color ?? COLORS[state.errands.length % COLORS.length],
          order: state.errands.length,
          archived: false,
          updatedAt: new Date().toISOString(),
        },
      ],
    })),

  toggleErrandToday: (id) =>
    set((state) => {
      const today = todayStr();
      return {
        errands: state.errands.map((e) => {
          if (e.id !== id) return e;
          if (e.lastCompletedAt === today) {
            // undo today's completion
            return {
              ...e,
              lastCompletedAt: undefined,
              streak: Math.max(0, e.streak - 1),
              updatedAt: new Date().toISOString(),
            };
          }
          const wasDue = isErrandDue(e, today);
          return {
            ...e,
            lastCompletedAt: today,
            streak: wasDue ? e.streak + 1 : e.streak,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }),

  deleteErrand: (id) =>
    set((state) => ({
      errands: state.errands.filter((e) => e.id !== id),
    })),

  updateErrand: (id, patch) =>
    set((state) => ({
      errands: state.errands.map((e) =>
        e.id === id
          ? { ...e, ...patch, updatedAt: new Date().toISOString() }
          : e,
      ),
    })),
});
