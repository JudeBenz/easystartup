"use client";

import { useEffect, useRef } from "react";
import { isSameDay, isAfter, subMinutes } from "date-fns";
import { useLifeStore } from "@/lib/store";
import { isErrandDue } from "@/lib/store/errands";

/**
 * Browser notifications for today's upcoming events + due errands.
 * Requires user to enable in Settings (permission prompt).
 */
export function NotificationWatcher() {
  const enabled = useLifeStore((s) => s.phonePrefs.notificationsEnabled);
  const events = useLifeStore((s) => s.events);
  const errands = useLifeStore((s) => s.errands);
  const fired = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const tick = () => {
      const now = new Date();
      for (const ev of events) {
        const start = new Date(ev.start);
        if (!isSameDay(start, now)) continue;
        const key = `ev-${ev.id}-${ev.start}`;
        if (fired.current.has(key)) continue;
        // notify within 15 min before start, or if all-day in the morning
        const windowStart = subMinutes(start, 15);
        if (ev.allDay) {
          if (now.getHours() === 8 && now.getMinutes() < 5) {
            fired.current.add(key);
            new Notification("Life OS Calendar", {
              body: `Today: ${ev.title}`,
              icon: "/icons/icon-192.png",
            });
          }
          continue;
        }
        if (isAfter(now, windowStart) && !isAfter(now, start)) {
          fired.current.add(key);
          new Notification("Upcoming event", {
            body: ev.title,
            icon: "/icons/icon-192.png",
          });
        }
      }

      const due = errands.filter((e) => !e.archived && isErrandDue(e));
      if (due.length > 0 && now.getHours() === 9 && now.getMinutes() < 5) {
        const key = `errands-${now.toISOString().slice(0, 10)}`;
        if (!fired.current.has(key)) {
          fired.current.add(key);
          new Notification("Errands due", {
            body: `${due.length} checklist item${due.length === 1 ? "" : "s"} waiting`,
            icon: "/icons/icon-192.png",
          });
        }
      }
    };

    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [enabled, events, errands]);

  return null;
}
