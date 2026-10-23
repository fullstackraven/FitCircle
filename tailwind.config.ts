import type { Config } from "tailwindcss";

export default {
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['var(--font-interface)'],
        'mono': ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        "action-solid": "hsl(var(--action-solid) / <alpha-value>)",
        overlay: 'var(--overlay)',
        danger: 'hsl(var(--danger))',
        'danger-hover': 'hsl(var(--danger-hover))',
        'danger-text': 'hsl(var(--danger-text))',
        'danger-tint': 'hsl(var(--danger-tint))',
        "canvas": "hsl(var(--canvas) / <alpha-value>)",
        "canvas-deep": "hsl(var(--canvas-deep) / <alpha-value>)",
        "control-strong": "hsl(var(--control-strong) / <alpha-value>)",
        "separator": "hsl(var(--separator) / <alpha-value>)",
        "accent-soft": "hsl(var(--accent-soft) / <alpha-value>)",
        "action": "hsl(var(--action) / <alpha-value>)",
        "action-hover": "hsl(var(--action-hover) / <alpha-value>)",
        "action-selected": "hsl(var(--action-selected) / <alpha-value>)",
        "on-action": "hsl(var(--on-action) / <alpha-value>)",
        "on-bright": "hsl(var(--on-bright) / <alpha-value>)",
        "accent-bright": "hsl(var(--accent-bright) / <alpha-value>)",
        "accent-bright-hover": "hsl(var(--accent-bright-hover) / <alpha-value>)",
        "focus": "hsl(var(--focus) / <alpha-value>)",
        "warning": "hsl(var(--warning) / <alpha-value>)",
        "feature-blue": "hsl(var(--feature-blue) / <alpha-value>)",
        "feature-purple": "hsl(var(--feature-purple) / <alpha-value>)",
        "feature-red": "hsl(var(--feature-red) / <alpha-value>)",
        "feature-amber": "hsl(var(--feature-amber) / <alpha-value>)",
        "feature-yellow": "hsl(var(--feature-yellow) / <alpha-value>)",
        "feature-orange": "hsl(var(--feature-orange) / <alpha-value>)",
        "feature-cyan": "hsl(var(--feature-cyan) / <alpha-value>)",
        "feature-teal": "hsl(var(--feature-teal) / <alpha-value>)",
        "strong": "hsl(var(--text-strong) / <alpha-value>)",
        "soft": "hsl(var(--text-soft) / <alpha-value>)",
        "subtle": "hsl(var(--text-subtle) / <alpha-value>)",
        "dim": "hsl(var(--text-dim) / <alpha-value>)",
        "dim-strong": "hsl(var(--text-dim-strong) / <alpha-value>)",
        "control": "hsl(var(--control-border) / <alpha-value>)",
        "control-muted": "hsl(var(--control-muted) / <alpha-value>)",
        "control-muted-border": "hsl(var(--control-border-muted) / <alpha-value>)",

        supporting: "hsl(var(--text-secondary) / <alpha-value>)",
        surface: {
          DEFAULT: "hsl(var(--surface) / <alpha-value>)",
          secondary: "hsl(var(--surface-secondary) / <alpha-value>)",
          elevated: "hsl(var(--surface-elevated) / <alpha-value>)",
        },
        "progress-track": "hsl(var(--progress-track) / <alpha-value>)",
        "accent-text": "hsl(var(--accent-text) / <alpha-value>)",
        "accent-fill": "hsl(var(--accent-fill) / <alpha-value>)",
        "on-accent": "hsl(var(--on-accent) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          primary: "hsl(var(--sidebar-primary) / <alpha-value>)",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          accent: "hsl(var(--sidebar-accent) / <alpha-value>)",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
