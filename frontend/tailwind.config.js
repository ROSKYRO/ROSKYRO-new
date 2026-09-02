/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1523",        // near-black plum, primary text
        violet: "#4B21C4",     // logo's deep violet
        magenta: "#D91C82",    // logo's pink/magenta
        flare: "#F5821F",      // logo's orange
        parchment: "#FBF9F7",  // warm off-white background
        mist: "#F1EEFA",       // soft lavender tint for section backgrounds
        clay: "#C13B3B",       // alert/urgent accent (distinct from magenta)
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #4B21C4 0%, #D91C82 55%, #F5821F 100%)',
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
}
