/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0A2D6F",
          800: "#0A2D6F",
          700: "#0F4DB8",
        },
        gold: {
          500: "#F4B400",
          700: "#C99000",
        },
        green: {
          500: "#2E9E44",
          // Same hue as 500, darkened until text on white/cream clears WCAG
          // AA's 4.5:1 (500 alone is only ~3.4:1) — use this whenever
          // green is the actual TEXT color, not a background/accent.
          700: "#257E36",
        },
        cream: {
          50: "#F8F7F4",
        },
        status: {
          success: "#2E9E44",
          warning: "#C77A2E",
          danger: "#B23B3B",
        },
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(15,33,71,0.08)",
      },
    },
  },
  plugins: [],
};
