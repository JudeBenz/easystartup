"use client";

import type { ComponentType } from "react";
import { MazeBankApp } from "./components/MazeBankApp";
import { CalendarApp } from "./components/CalendarApp";
import { DynastyProjectsApp } from "./components/DynastyProjectsApp";
import { LifeInvaderApp } from "./components/LifeInvaderApp";
import { ErrandsApp } from "./components/ErrandsApp";
import { SettingsApp } from "./components/SettingsApp";

export interface LifeModule {
  id: string;
  name: string;
  subtitle: string;
  shortName: string;
  color: string;
  iconBg: string;
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
    name: "Calendar",
    subtitle: "Schedule",
    shortName: "Calendar",
    color: "#1e5a8a",
    iconBg: "bg-sky-700",
    glyph: "📅",
    defaultSize: { w: 680, h: 540 },
    component: CalendarApp,
  },
  {
    id: "errands",
    name: "Errands",
    subtitle: "Daily checklist",
    shortName: "Errands",
    color: "#0e7490",
    iconBg: "bg-cyan-700",
    glyph: "✅",
    defaultSize: { w: 420, h: 560 },
    component: ErrandsApp,
  },
  {
    id: "dynasty-projects",
    name: "Dynasty 8",
    subtitle: "Projects",
    shortName: "Dynasty",
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
    shortName: "LifeInvader",
    color: "#c0392b",
    iconBg: "bg-red-700",
    glyph: "📱",
    defaultSize: { w: 520, h: 580 },
    component: LifeInvaderApp,
  },
  {
    id: "settings",
    name: "Settings",
    subtitle: "Sync · Themes · Alerts",
    shortName: "Settings",
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
