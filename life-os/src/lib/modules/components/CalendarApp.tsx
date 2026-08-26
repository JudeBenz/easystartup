"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useLifeStore } from "@/lib/store";

const COLORS = ["#3498db", "#e74c3c", "#2ecc71", "#9b59b6", "#f39c12"];

export function CalendarApp() {
  const events = useLifeStore((s) => s.events);
  const addEvent = useLifeStore((s) => s.addEvent);
  const deleteEvent = useLifeStore((s) => s.deleteEvent);

  const [current, setCurrent] = useState(new Date());
  const [title, setTitle] = useState("");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

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
    <div className="flex h-full flex-col bg-[#eef3f8] text-sm text-gray-900">
      <header className="flex items-center justify-between border-b border-sky-800/20 bg-gradient-to-r from-sky-800 to-sky-600 px-4 py-2 text-white">
        <div>
          <h2 className="text-base font-bold">Life Calendar</h2>
          <p className="text-xs text-sky-200">Schedule Manager</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrent(addMonths(current, -1))}
            className="rounded px-2 py-0.5 hover:bg-white/20"
          >
            ◀
          </button>
          <span className="min-w-32 text-center font-semibold">
            {format(current, "MMMM yyyy")}
          </span>
          <button
            type="button"
            onClick={() => setCurrent(addMonths(current, 1))}
            className="rounded px-2 py-0.5 hover:bg-white/20"
          >
            ▶
          </button>
          <button
            type="button"
            onClick={() => setCurrent(new Date())}
            className="ml-2 rounded border border-white/40 px-2 py-0.5 text-xs hover:bg-white/20"
          >
            Today
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col p-3">
          <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold text-gray-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-7 grid-rows-6 gap-px rounded border border-gray-300 bg-gray-300">
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
                  className={`flex flex-col bg-white p-1 text-left text-xs transition-colors hover:bg-sky-50 ${
                    !inMonth ? "text-gray-300" : ""
                  } ${selected ? "ring-2 ring-inset ring-sky-500" : ""}`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      isToday(day)
                        ? "bg-sky-600 font-bold text-white"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-0.5 space-y-0.5 overflow-hidden">
                    {dayEvts.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="truncate rounded px-0.5 text-[10px] text-white"
                        style={{ backgroundColor: ev.color }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvts.length > 2 && (
                      <div className="text-[10px] text-gray-400">
                        +{dayEvts.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="w-52 shrink-0 border-l border-gray-300 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            {selectedDay ? format(selectedDay, "MMM d, yyyy") : "Select a day"}
          </p>
          {selectedDay && (
            <>
              <form onSubmit={handleAdd} className="mb-3 flex gap-1">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="New event"
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                />
                <button
                  type="submit"
                  className="rounded bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-700"
                >
                  +
                </button>
              </form>
              <div className="space-y-2">
                {dayEvents.length === 0 && (
                  <p className="text-xs text-gray-400">No events</p>
                )}
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded border border-gray-200 p-2"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full mt-1"
                        style={{ backgroundColor: ev.color }}
                      />
                      <span className="flex-1 text-xs font-medium">{ev.title}</span>
                      <button
                        type="button"
                        onClick={() => deleteEvent(ev.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                    {!ev.allDay && (
                      <p className="mt-0.5 pl-3 text-[10px] text-gray-500">
                        {format(new Date(ev.start), "h:mm a")} –{" "}
                        {format(new Date(ev.end), "h:mm a")}
                      </p>
                    )}
                    {ev.recurrence && (
                      <p className="pl-3 text-[10px] text-gray-400">
                        Repeats {ev.recurrence}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
