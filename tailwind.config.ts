import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1280px", /* Design Bible max width */
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "IBM Plex Sans", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Source Serif 4", "serif"],
      },
      fontSize: {
        /* Design Bible Typography */
        "display": ["3.5rem", { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.02em" }],
        "h1": ["3rem", { lineHeight: "1.15", fontWeight: "700", letterSpacing: "-0.02em" }],
        "h2": ["2.25rem", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "-0.01em" }],
        "h3": ["1.75rem", { lineHeight: "1.3", fontWeight: "600" }],
        "body": ["1rem", { lineHeight: "1.65" }],
        "body-lg": ["1.125rem", { lineHeight: "1.7" }],
        "caption": ["0.8125rem", { lineHeight: "1.5" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        /* Design Bible Named Colors */
        taskive: {
          navy: "hsl(var(--taskive-navy))",
          slate: "hsl(var(--taskive-slate))",
          teal: "hsl(var(--taskive-teal))",
          amber: "hsl(var(--taskive-amber))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.75rem", /* 12px max for cards */
      },
      spacing: {
        /* Design Bible section padding */
        "section": "5rem",      /* 80px */
        "section-lg": "7.5rem", /* 120px */
      },
      boxShadow: {
        "taskive-sm": "var(--shadow-sm)",
        "taskive-md": "var(--shadow-md)",
        "taskive-lg": "var(--shadow-lg)",
        "taskive-xl": "var(--shadow-xl)",
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out forwards",
        "slide-up": "slide-up 0.25s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
