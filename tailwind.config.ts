import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
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
        // Brand colors from specification
        "brand-blue": "hsl(var(--brand-blue))",
        "brand-blue-dark": "hsl(var(--brand-blue-dark))",
        "brand-blue-light": "hsl(var(--brand-blue-light))",
        // Status colors
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))",
        error: "hsl(var(--error))",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      fontFamily: {
        sans: ["'Gothic A1'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
      },
      fontSize: {
        // Hero title: 48-60px
        hero: ["3rem", { lineHeight: "1.2", fontWeight: "300" }],
        "hero-lg": ["3.75rem", { lineHeight: "1.2", fontWeight: "300" }],
        // Section headings: 30-36px
        "section-heading": ["1.875rem", { lineHeight: "1.2", fontWeight: "600" }],
        "section-heading-lg": ["2.25rem", { lineHeight: "1.2", fontWeight: "600" }],
        // Card titles: 20-24px
        "card-title": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        "card-title-lg": ["1.5rem", { lineHeight: "1.4", fontWeight: "600" }],
        // Subsection: 18px
        subsection: ["1.125rem", { lineHeight: "1.5", fontWeight: "500" }],
        // Metadata: 14px
        metadata: ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
      },
      spacing: {
        // Custom spacing from specification
        "4xl": "6rem", // 96px - Major section separation
        "3xl": "4rem", // 64px - Section padding (desktop)
        "2xl": "3rem", // 48px - Section padding (mobile)
      },
      maxWidth: {
        "reading": "48rem", // 768px - Optimal reading width
        "content": "80rem", // 1280px - Max content width
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
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;