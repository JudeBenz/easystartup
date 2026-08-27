import type { PhonePrefs, PhoneThemeId } from "@/types/domain";

export const PHONE_THEMES: Record<
  PhoneThemeId,
  { name: string; background: string; accent: string }
> = {
  "ls-night": {
    name: "LS Night",
    background:
      "radial-gradient(ellipse at 30% 20%, #2a6bb5 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, #0d3a5c 0%, transparent 45%), linear-gradient(165deg, #0a2744 0%, #061a2e 40%, #020b14 100%)",
    accent: "#3b82f6",
  },
  vinewood: {
    name: "Vinewood",
    background:
      "radial-gradient(ellipse at 70% 10%, #c9a227 0%, transparent 40%), linear-gradient(180deg, #1a0a2e 0%, #3d1a5c 45%, #0d0618 100%)",
    accent: "#eab308",
  },
  sandy: {
    name: "Sandy Shores",
    background:
      "radial-gradient(ellipse at 50% 0%, #d4a574 0%, transparent 45%), linear-gradient(165deg, #5c3d1e 0%, #2a1a0c 50%, #0f0a05 100%)",
    accent: "#d97706",
  },
  downtown: {
    name: "Downtown",
    background:
      "radial-gradient(ellipse at 20% 80%, #22c55e33 0%, transparent 40%), linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #020617 100%)",
    accent: "#22c55e",
  },
};

export interface PhonePrefsSlice {
  phonePrefs: PhonePrefs;
  setPhoneTheme: (themeId: PhoneThemeId) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const createPhonePrefsSlice = (
  set: (fn: (state: PhonePrefsSlice) => Partial<PhonePrefsSlice>) => void,
): PhonePrefsSlice => ({
  phonePrefs: {
    themeId: "ls-night",
    notificationsEnabled: false,
  },

  setPhoneTheme: (themeId) =>
    set((s) => ({
      phonePrefs: { ...s.phonePrefs, themeId },
    })),

  setNotificationsEnabled: (enabled) =>
    set((s) => ({
      phonePrefs: { ...s.phonePrefs, notificationsEnabled: enabled },
    })),
});
