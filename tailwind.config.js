/** @type {import('tailwindcss').Config} */

// Nota: Questo file di configurazione è un esempio standard.
// Se hai già un file tailwind.config.js, assicurati che la sezione `content`
// includa i percorsi ai tuoi file sorgente come mostrato di seguito.

export default {
  content: [
    "./index.html",
    // Questa riga è FONDAMENTALE.
    // Dice a Tailwind di analizzare tutti i file .js, .ts, .jsx, e .tsx
    // nella cartella 'src' e in tutte le sue sottocartelle.
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // Abilita il supporto per il tema scuro basato su classe
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-out": "fadeOut 0.5s ease-in-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
