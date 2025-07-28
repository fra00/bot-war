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
      // Qui puoi estendere il tema di default di Tailwind
      // (es. colori, font, etc.)
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
