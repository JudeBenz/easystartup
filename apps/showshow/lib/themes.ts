export const THEME_COOKIE = "ss_theme";

export type ThemeId =
  | "rust-turquoise"
  | "fair-crimson"
  | "spruce-copper"
  | "indigo-sand"
  | "midnight-sea";

export interface ThemePreset {
  id: ThemeId;
  name: string;
  blurb: string;
  /** Swatch chips shown in Settings: paper, accent, good, ink */
  swatches: [string, string, string, string];
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "rust-turquoise",
    name: "Rust & turquoise",
    blurb: "Warm booth metal with cool water-glass accents. Default.",
    swatches: ["#F2F6F5", "#B54A2A", "#0F7F7B", "#1A1F1E"],
  },
  {
    id: "fair-crimson",
    name: "Fair catalog",
    blurb: "Cool paper with a ribbon-red primary.",
    swatches: ["#F0F2F4", "#B91C1C", "#0F5C45", "#0E1116"],
  },
  {
    id: "spruce-copper",
    name: "Spruce & copper",
    blurb: "Deep green field and copper hardware.",
    swatches: ["#EEF3F0", "#C46B3A", "#1F5C45", "#14201A"],
  },
  {
    id: "indigo-sand",
    name: "Indigo & sand",
    blurb: "Quiet sand ground with indigo ink accents.",
    swatches: ["#F3F0E8", "#2F3A8F", "#3F6B5A", "#1A1A18"],
  },
  {
    id: "midnight-sea",
    name: "Midnight sea",
    blurb: "Dark working mode for evening packing.",
    swatches: ["#0F1716", "#E07A4B", "#3DBDB5", "#E8EFED"],
  },
];

export const DEFAULT_THEME: ThemeId = "rust-turquoise";

export function isThemeId(value: string | undefined | null): value is ThemeId {
  return THEME_PRESETS.some((t) => t.id === value);
}

export function resolveThemeId(value: string | undefined | null): ThemeId {
  return isThemeId(value) ? value : DEFAULT_THEME;
}

export function getThemePreset(id: ThemeId): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0];
}
