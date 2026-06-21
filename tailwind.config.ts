import type { Config } from "tailwindcss";

/**
 * EasyStartUp design system — light-money palette with deep-green header.
 * CSS vars are space-separated RGB triplets so Tailwind opacity modifiers work.
 * NAMES are intentionally stable; values changed in globals.css.
 */
function rgb(varName: string) {
  return `rgb(var(${varName}) / <alpha-value>)`;
}

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono:    ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // shadcn semantic tokens
        border:      rgb("--border"),
        input:       rgb("--input"),
        ring:        rgb("--ring"),
        background:  rgb("--background"),
        foreground:  rgb("--foreground"),
        primary: {
          DEFAULT:    rgb("--primary"),
          foreground: rgb("--primary-foreground"),
        },
        secondary: {
          DEFAULT:    rgb("--secondary"),
          foreground: rgb("--secondary-foreground"),
        },
        destructive: {
          DEFAULT:    rgb("--destructive"),
          foreground: rgb("--destructive-foreground"),
        },
        muted: {
          DEFAULT:    rgb("--muted"),
          foreground: rgb("--muted-foreground"),
        },
        accent: {
          DEFAULT:    rgb("--accent"),
          foreground: rgb("--accent-foreground"),
        },
        popover: {
          DEFAULT:    rgb("--popover"),
          foreground: rgb("--popover-foreground"),
        },
        card: {
          DEFAULT:    rgb("--card"),
          foreground: rgb("--card-foreground"),
        },

        // ── EasyStartUp surface tokens ─────────────────────────────
        paper:  rgb("--paper"),   // page bg (#F1F4F0)
        panel:  rgb("--panel"),   // card/surface (#FFFFFF)
        ink:    rgb("--ink"),     // primary text
        soft:   rgb("--soft"),    // secondary text
        faint:  rgb("--faint"),   // metadata / muted labels

        rule:   rgb("--rule"),    // hairline borders
        rule2:  rgb("--rule-2"),  // stronger dividers

        // ── Signature green (named "navy" for backward compat) ─────
        navy: {
          DEFAULT: rgb("--navy"),
          hover:   rgb("--navy-hover"),
          tint:    rgb("--navy-tint"),
        },
        // Explicit green aliases for new code
        green: {
          DEFAULT: rgb("--green"),
          deep:    rgb("--green-deep"),
          tint:    rgb("--navy-tint"),
          bg:      rgb("--green-bg"),
        },

        // ── Attention ─────────────────────────────────────────────
        amber: {
          DEFAULT: rgb("--amber"),
          strong:  rgb("--amber-strong"),
          bg:      rgb("--amber-bg"),
          border:  rgb("--amber-border"),
        },
        gold: rgb("--gold"),

        // ── Branded header ─────────────────────────────────────────
        header: {
          DEFAULT: rgb("--header"),
          soft:    rgb("--header-soft"),
          mint:    rgb("--header-mint"),
          gold:    rgb("--header-gold"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "3px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
