/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",        // crisp deep slate ink
        "ink-muted": "#4B5563", // secondary text
        violet: "#4B21C4",     // logo's deep violet
        "violet-dark": "#371796",
        "violet-light": "#7C3AED",
        magenta: "#D91C82",    // logo's pink/magenta
        flare: "#F5821F",      // logo's warm orange
        parchment: "#FAF9F6",  // clean warm off-white canvas
        mist: "#F3F0FC",       // soft radiant lavender
        clay: "#DC2626",       // urgent alert
        emerald: {
          DEFAULT: "#059669",
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4B21C4 0%, #7C3AED 40%, #D91C82 75%, #F5821F 100%)',
        'brand-soft': 'linear-gradient(135deg, rgba(75, 33, 196, 0.08) 0%, rgba(217, 28, 130, 0.08) 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(17, 24, 39, 0.06), 0 2px 6px -1px rgba(17, 24, 39, 0.04)',
        'card-hover': '0 20px 30px -8px rgba(75, 33, 196, 0.12), 0 8px 16px -4px rgba(17, 24, 39, 0.06)',
        'glow': '0 0 25px rgba(124, 58, 237, 0.25)',
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
}
