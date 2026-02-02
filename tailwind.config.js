/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                border: "rgba(255, 255, 255, 0.1)",
                input: "hsl(var(--input))", // Keep if used elsewhere
                ring: "hsl(var(--ring))",   // Keep if used elsewhere
                background: "#0A0A0A", // Deep Black
                surface: "#171717",    // Charcoal
                foreground: "#FFFFFF",
                primary: {
                    DEFAULT: "#FFD84D", // Electric Yellow
                    hover: "#FFC800",
                    foreground: "#0A0A0A",
                    dark: "#002C45", // Keep for backward compat if needed
                },
                secondary: {
                    DEFAULT: "#FFFFFF",
                    foreground: "#0A0A0A",
                },
                muted: {
                    DEFAULT: "#B0B0B0",
                    foreground: "#A3A3A3", // Fixed: Light grey for visibility on dark backgrounds
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                // Brand specific specific object
                brand: {
                    yellow: "#FFD84D",
                    black: "#0A0A0A",
                    charcoal: "#171717",
                    white: "#FFFFFF",
                    gray: "#B0B0B0"
                }
            },
            fontFamily: {
                heading: ["'Inter'", "sans-serif"], // Changed to Inter as requested
                sans: ["'Inter'", "sans-serif"],
                mono: ["'Rubik Mono One'", "monospace"],
            },
            borderRadius: {
                lg: "0.5rem",
                md: "0.375rem",
                sm: "0.25rem",
                xl: "0.75rem",
                '2xl': "1rem",
                '3xl': "1.5rem",
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
                "pulse-green": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.5", transform: "scale(1.05)" },
                }
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "pulse-green": "pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
        },
    },
    plugins: [],
}
