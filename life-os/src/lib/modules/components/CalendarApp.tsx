"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useLifeStore } from "@/lib/store";

const COLORS = ["#3498db", "#e74c3c", "#2ecc71", "#9b59b6", "#f39c12"];

export function CalendarApp() {
  const events = useLifeStore((s) => s.events);
  const addEvent = useLifeStore((s) => s.addEvent);
  const deleteEvent = useLifeStore((s) => s.deleteEvent);

  const [current, setCurrent] = useState(new Date());
  const [title, setTitle] = useState("");
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return events.filter((e) => isSameDay(new Date(e.start), selectedDay));
  }, [events, selectedDay]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !selectedDay) return;
    const d = format(selectedDay, "yyyy-MM-dd");
    addEvent({
      title: title.trim(),
      start: `${d}T09:00:00`,
      end: `${d}T10:00:00`,
      allDay: false,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
    setTitle("");
  }

  return (
    <div className="flex min-h-full flex-col bg-[#eef3f8] text-sm text-gray-900">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-800/20 bg-gradient-to-r from-sky-800 to-sky-600 px-3 py-2 text-white">
        <div>
          <h2 className="text-base font-bold">Calendar</h2>
          <p className="text-[10px] text-sky-200">Your schedule</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrent(addMonths(current, -1))}
            className="rounded px-2 py-1 hover:bg-white/20"
          >
            ‹
          </button>
          <span className="min-w-28 text-center text-xs font-semibold">
            {format(current, "MMM yyyy")}
          </span>
          <button
            type="button"
            onClick={() => setCurrent(addMonths(current, 1))}
            className="rounded px-2 py-1 hover:bg-white/20"
          >
            ›
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-0 md:flex-row">
        <div className="p-2 md:flex-1">
          <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold text-gray-500">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={`${d}-${i}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded border border-gray-300 bg-gray-300">
            {days.map((day) => {
              const dayEvts = events.filter((ev) =>
                isSameDay(new Date(ev.start), day),
              );
              const inMonth = isSameMonth(day, current);
              const selected = selectedDay && isSameDay(day, selectedDay);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`flex min-h-11 flex-col bg-white p-1 text-left text-[10px] sm:min-h-14 ${
                    !inMonth ? "text-gray-300" : ""
                  } ${selected ? "ring-2 ring-inset ring-sky-500" : ""}`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                      isToday(day) ? "bg-sky-600 font-bold text-white" : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {dayEvts.slice(0, 1).map((ev) => (
                    <span
                      key={ev.id}
                      className="mt-0.5 truncate rounded px-0.5 text-[9px] text-white"
                      style={{ backgroundColor: ev.color }}
                    >
                      {ev.title}
                    </span>
                  ))}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="border-t border-gray-200 bg-white p-3 md:w-52 md:border-l md:border-t-0">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            {selectedDay ? format(selectedDay, "MMM d, yyyy") : "Select a day"}
          </p>
          {selectedDay && (
            <>
              <form onSubmit={handleAdd} className="mb-3 flex gap-1">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="New event"
                  className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="rounded bg-sky-600 px-3 py-2 text-xs text-white"
                >
                  +
                </button>
              </form>
              {dayEvents.length === 0 ? (
                <p className="text-xs text-gray-400">No events — add one above</p>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-2 rounded border border-gray-100 p-2"
                    >
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: ev.color }}
                      />
                      <span className="min-w-0 flex-1 text-xs font-medium">
                        {ev.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteEvent(ev.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
