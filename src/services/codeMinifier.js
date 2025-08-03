/**
 * Esegue una semplice minificazione di una stringa di codice JavaScript.
 * Rimuove i commenti, le nuove righe e gli spazi multipli.
 * @param {string} code - Il codice sorgente da minificare.
 * @returns {string} Il codice minificato.
 */
export function minifyScript(code) {
  if (!code) return "";

  return code
    .replace(/\/\*[\s\S]*?\*\//g, "") // Rimuove commenti multi-linea
    .replace(/\/\/(.*)/g, "") // Rimuove commenti a riga singola
    .replace(/\n/g, " ") // Sostituisce le nuove righe con spazi
    .replace(/\s{2,}/g, " ") // Collassa spazi multipli in uno singolo
    .trim(); // Rimuove spazi iniziali e finali
}