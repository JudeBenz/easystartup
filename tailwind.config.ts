import type { Config } from "tailwindcss";

/**
 * EasyStartUp design language — "operations instrument".
 * Warm paper palette, hairline rules, sharp corners. Color = meaning only.
 * CSS vars are space-separated RGB triplets so Tailwind opacity modifiers
 * (e.g. bg-primary/90) work. Defined in app/globals.css. FROZEN after foundation.
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
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // shadcn semantic tokens (mapped to the warm palette)
        border: rgb("--border"),
        input: rgb("--input"),
        ring: rgb("--ring"),
        background: rgb("--background"),
        foreground: rgb("--foreground"),
        primary: {
          DEFAULT: rgb("--primary"),
          foreground: rgb("--primary-foreground"),
        },
        secondary: {
          DEFAULT: rgb("--secondary"),
          foreground: rgb("--secondary-foreground"),
        },
        destructive: {
          DEFAULT: rgb("--destructive"),
          foreground: rgb("--destructive-foreground"),
        },
        muted: {
          DEFAULT: rgb("--muted"),
          foreground: rgb("--muted-foreground"),
        },
        accent: {
          DEFAULT: rgb("--accent"),
          foreground: rgb("--accent-foreground"),
        },
        popover: {
          DEFAULT: rgb("--popover"),
          foreground: rgb("--popover-foreground"),
        },
        card: {
          DEFAULT: rgb("--card"),
          foreground: rgb("--card-foreground"),
        },
        // EasyStartUp named tokens (use these for the operations-instrument look)
        paper: rgb("--paper"),
        panel: rgb("--panel"),
        ink: rgb("--ink"),
        soft: rgb("--soft"),
        faint: rgb("--faint"),
        rule: rgb("--rule"),
        rule2: rgb("--rule-2"),
        navy: {
          DEFAULT: rgb("--navy"),
          hover: rgb("--navy-hover"),
          tint: rgb("--navy-tint"),
        },
        amber: {
          DEFAULT: rgb("--amber"),
          bg: rgb("--amber-bg"),
        },
        green: {
          DEFAULT: rgb("--green"),
          bg: rgb("--green-bg"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 1px)",
        sm: "1px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
