import { v4 as uuid } from "uuid";
import type { CalendarEvent } from "@/types/domain";

/** Fresh account — no mock events */
export const SEED_EVENTS: CalendarEvent[] = [];

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
