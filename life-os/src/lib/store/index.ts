import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WindowState } from "@/types/domain";
import { createBudgetSlice, type BudgetSlice } from "./budget";
import { createCalendarSlice, type CalendarSlice } from "./calendar";
import { createChatSlice, type ChatSlice } from "./chat";
import { createProjectsSlice, type ProjectsSlice } from "./projects";

interface ShellSlice {
  windows: WindowState[];
  activeModuleId: string | null;
  mobileOpenModule: string | null;
  nextZ: number;
  openModule: (moduleId: string) => void;
  closeModule: (moduleId: string) => void;
  minimizeModule: (moduleId: string) => void;
  maximizeModule: (moduleId: string) => void;
  focusModule: (moduleId: string) => void;
  moveWindow: (moduleId: string, x: number, y: number) => void;
  resizeWindow: (moduleId: string, w: number, h: number) => void;
  setMobileOpenModule: (moduleId: string | null) => void;
  exportData: () => string;
  importData: (json: string) => void;
}

export type LifeStore = BudgetSlice & CalendarSlice & ProjectsSlice & ChatSlice & ShellSlice;

const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  "maze-bank": { w: 720, h: 520 },
  calendar: { w: 680, h: 540 },
  "dynasty-projects": { w: 760, h: 560 },
  lifeinvader: { w: 520, h: 580 },
  settings: { w: 420, h: 380 },
};

export const useLifeStore = create<LifeStore>()(
  persist(
    (set, get) => ({
      ...createBudgetSlice(set as never),
      ...createCalendarSlice(set as never),
      ...createProjectsSlice(set as never),
      ...createChatSlice(set as never),

      windows: [],
      activeModuleId: null,
      mobileOpenModule: null,
      nextZ: 10,

      openModule: (moduleId) => {
        const existing = get().windows.find((w) => w.moduleId === moduleId);
        if (existing) {
          if (existing.minimized) {
            set((s) => ({
              windows: s.windows.map((w) =>
                w.moduleId === moduleId ? { ...w, minimized: false } : w,
              ),
              activeModuleId: moduleId,
              nextZ: s.nextZ + 1,
            }));
            get().focusModule(moduleId);
          } else {
            get().focusModule(moduleId);
          }
          return;
        }
        const size = DEFAULT_SIZES[moduleId] ?? { w: 600, h: 440 };
        const offset = get().windows.length * 28;
        const newZ = get().nextZ + 1;
        set((s) => ({
          windows: [
            ...s.windows,
            {
              moduleId,
              x: 80 + offset,
              y: 40 + offset,
              width: size.w,
              height: size.h,
              minimized: false,
              maximized: false,
              zIndex: newZ,
            },
          ],
          activeModuleId: moduleId,
          nextZ: newZ,
        }));
      },

      closeModule: (moduleId) =>
        set((s) => ({
          windows: s.windows.filter((w) => w.moduleId !== moduleId),
          activeModuleId:
            s.activeModuleId === moduleId ? null : s.activeModuleId,
        })),

      minimizeModule: (moduleId) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.moduleId === moduleId ? { ...w, minimized: true } : w,
          ),
          activeModuleId:
            s.activeModuleId === moduleId ? null : s.activeModuleId,
        })),

      maximizeModule: (moduleId) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.moduleId === moduleId
              ? { ...w, maximized: !w.maximized }
              : w,
          ),
        })),

      focusModule: (moduleId) => {
        const newZ = get().nextZ + 1;
        set((s) => ({
          windows: s.windows.map((w) =>
            w.moduleId === moduleId ? { ...w, zIndex: newZ } : w,
          ),
          activeModuleId: moduleId,
          nextZ: newZ,
        }));
      },

      moveWindow: (moduleId, x, y) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.moduleId === moduleId ? { ...w, x, y } : w,
          ),
        })),

      resizeWindow: (moduleId, width, height) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.moduleId === moduleId ? { ...w, width, height } : w,
          ),
        })),

      setMobileOpenModule: (moduleId) => set({ mobileOpenModule: moduleId }),

      exportData: () => {
        const {
          accounts,
          transactions,
          budgetCategories,
          events,
          projects,
          tasks,
        } = get();
        return JSON.stringify(
          { accounts, transactions, budgetCategories, events, projects, tasks },
          null,
          2,
        );
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            accounts: data.accounts ?? get().accounts,
            transactions: data.transactions ?? get().transactions,
            budgetCategories:
              data.budgetCategories ?? get().budgetCategories,
            events: data.events ?? get().events,
            projects: data.projects ?? get().projects,
            tasks: data.tasks ?? get().tasks,
          });
        } catch {
          console.error("Invalid import JSON");
        }
      },
    }),
    {
      name: "life-os-storage",
      partialize: (state) => ({
        accounts: state.accounts,
        transactions: state.transactions,
        budgetCategories: state.budgetCategories,
        events: state.events,
        projects: state.projects,
        tasks: state.tasks,
        chatMessages: state.chatMessages,
        aiProvider: state.aiProvider,
      }),
    },
  ),
);
