/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        heading: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
        accent: ['Playfair Display', 'serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '1.5', letterSpacing: '0' }],
        'sm': ['14px', { lineHeight: '1.55', letterSpacing: '-0.006em' }],
        'base': ['15px', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        'lg': ['17px', { lineHeight: '1.5', letterSpacing: '-0.014em' }],
        'xl': ['20px', { lineHeight: '1.4', letterSpacing: '-0.017em' }],
        '2xl': ['24px', { lineHeight: '1.3', letterSpacing: '-0.019em' }],
        '3xl': ['30px', { lineHeight: '1.2', letterSpacing: '-0.021em' }],
        '4xl': ['36px', { lineHeight: '1.15', letterSpacing: '-0.022em' }],
        '5xl': ['48px', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
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
        surface: {
          page: "hsl(var(--surface-page))",
          raised: "hsl(var(--surface-raised))",
          overlay: "hsl(var(--surface-overlay))",
          input: "hsl(var(--surface-input) / <alpha-value>)",
          hover: "hsl(var(--surface-hover) / <alpha-value>)",
          active: "hsl(var(--surface-active) / <alpha-value>)",
        },
        txt: {
          primary: "hsl(var(--text-primary))",
          secondary: "hsl(var(--text-secondary))",
          muted: "hsl(var(--text-muted))",
          placeholder: "hsl(var(--text-placeholder))",
        },
        brd: {
          subtle: "hsl(var(--border-subtle) / <alpha-value>)",
          DEFAULT: "hsl(var(--border-default) / <alpha-value>)",
          strong: "hsl(var(--border-strong) / <alpha-value>)",
        },
        divider: "hsl(var(--divider) / <alpha-value>)",
      },
      boxShadow: {
        'card': '0 1px 3px hsl(var(--shadow-card)), 0 1px 2px hsl(var(--shadow-card))',
        'card-lg': '0 4px 12px hsl(var(--shadow-card)), 0 2px 4px hsl(var(--shadow-card))',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
}