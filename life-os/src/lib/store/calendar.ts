import { v4 as uuid } from "uuid";
import type { CalendarEvent } from "@/types/domain";

const today = new Date();
const y = today.getFullYear();
const m = String(today.getMonth() + 1).padStart(2, "0");
const d = String(today.getDate()).padStart(2, "0");

export const SEED_EVENTS: CalendarEvent[] = [
  {
    id: uuid(),
    title: "Team standup",
    start: `${y}-${m}-${d}T09:00:00`,
    end: `${y}-${m}-${d}T09:30:00`,
    allDay: false,
    color: "#3498db",
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuid(),
    title: "Gym",
    start: `${y}-${m}-${d}T18:00:00`,
    end: `${y}-${m}-${d}T19:30:00`,
    allDay: false,
    color: "#e74c3c",
    recurrence: "weekly",
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuid(),
    title: "Pay rent",
    start: `${y}-${m}-01T00:00:00`,
    end: `${y}-${m}-01T23:59:59`,
    allDay: true,
    color: "#2ecc71",
    recurrence: "monthly",
    updatedAt: new Date().toISOString(),
  },
];

export interface CalendarSlice {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, "id" | "updatedAt">) => void;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
}

export const createCalendarSlice = (
  set: (fn: (state: CalendarSlice) => Partial<CalendarSlice>) => void,
): CalendarSlice => ({
  events: SEED_EVENTS,

  addEvent: (event) =>
    set((state) => ({
      events: [
        ...state.events,
        { ...event, id: uuid(), updatedAt: new Date().toISOString() },
      ],
    })),

  updateEvent: (id, patch) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id
          ? { ...e, ...patch, updatedAt: new Date().toISOString() }
          : e,
      ),
    })),

  deleteEvent: (id) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    })),
});
