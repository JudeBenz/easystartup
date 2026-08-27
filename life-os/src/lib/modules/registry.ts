"use client";

import type { ComponentType } from "react";
import { MazeBankApp } from "./components/MazeBankApp";
import { CalendarApp } from "./components/CalendarApp";
import { DynastyProjectsApp } from "./components/DynastyProjectsApp";
import { LifeInvaderApp } from "./components/LifeInvaderApp";
import { SettingsApp } from "./components/SettingsApp";

export interface LifeModule {
  id: string;
  name: string;
  subtitle: string;
  /** Short label for taskbar */
  shortName: string;
  color: string;
  /** Tailwind bg class for icon tile */
  iconBg: string;
  /** Emoji or single-char icon for desktop */
  glyph: string;
  defaultSize: { w: number; h: number };
  component: ComponentType;
}

export const MODULES: LifeModule[] = [
  {
    id: "maze-bank",
    name: "Maze Bank",
    subtitle: "Budget & Finance",
    shortName: "Bank",
    color: "#1a6b3c",
    iconBg: "bg-emerald-700",
    glyph: "🏦",
    defaultSize: { w: 720, h: 520 },
    component: MazeBankApp,
  },
  {
    id: "calendar",
    name: "Life Calendar",
    subtitle: "Schedule & Events",
    shortName: "Calendar",
    color: "#1e5a8a",
    iconBg: "bg-sky-700",
    glyph: "📅",
    defaultSize: { w: 680, h: 540 },
    component: CalendarApp,
  },
  {
    id: "dynasty-projects",
    name: "Dynasty Projects",
    subtitle: "Goals & Tasks",
    shortName: "Projects",
    color: "#8b6914",
    iconBg: "bg-amber-700",
    glyph: "🏗️",
    defaultSize: { w: 760, h: 560 },
    component: DynastyProjectsApp,
  },
  {
    id: "lifeinvader",
    name: "LifeInvader",
    subtitle: "AI Assistant",
    shortName: "Social",
    color: "#c0392b",
    iconBg: "bg-red-700",
    glyph: "📱",
    defaultSize: { w: 520, h: 580 },
    component: LifeInvaderApp,
  },
  {
    id: "settings",
    name: "System",
    subtitle: "Sync & Backup",
    shortName: "System",
    color: "#4a5568",
    iconBg: "bg-slate-600",
    glyph: "⚙️",
    defaultSize: { w: 480, h: 560 },
    component: SettingsApp,
  },
];

export function getModule(id: string): LifeModule | undefined {
  return MODULES.find((m) => m.id === id);
}
