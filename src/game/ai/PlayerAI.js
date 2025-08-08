import DefaultAIBase from "./DefaultAIBase.js";

/**
 * Funzione ricorsiva per stringificare un oggetto, gestendo correttamente
 * funzioni e oggetti annidati.
 * @param {object} obj - L'oggetto da stringificare.
 * @param {string} indent - La stringa di indentazione corrente.
 * @returns {string}
 */
function stringifyObjectRecursive(obj, indent) {
  const parts = [];
  const nextIndent = indent + "  ";

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      let valueStr;

      if (typeof value === "function") {
        // Converte la funzione in stringa e la indenta correttamente.
        valueStr = value.toString().replace(/\n/g, `\n${nextIndent}`);
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Chiamata ricorsiva per oggetti annidati.
        valueStr = stringifyObjectRecursive(value, nextIndent);
      } else {
        // Usa JSON.stringify per tutti gli altri tipi (array, primitivi).
        valueStr = JSON.stringify(value, null, 2);
      }

      parts.push(`${nextIndent}${key}: ${valueStr}`);
    }
  }

  return `{\n${parts.join(",\n")}\n${indent}}`;
}

/**
 * Converte un oggetto AI in una stringa di codice sorgente che può essere valutata.
 * Gestisce correttamente oggetti annidati e funzioni.
 * @param {object} aiObject - L'oggetto AI da stringificare.
 * @returns {string}
 */
export const stringifyAI = (aiObject) => {
  // Le parentesi esterne sono cruciali per l'interpretazione come espressione oggetto.
  return `(${stringifyObjectRecursive(aiObject, "")})`;
};

// Converte l'oggetto AI di default in una stringa di codice sorgente.
// Questo assicura che il codice di partenza del giocatore sia sempre
// sincronizzato con l'IA di default, senza bisogno di copia-incolla manuale.
// const initialPlayerCode = stringifyAI(DefaultAIBase);

const initialPlayerCode = `({

  run: function (api) {
    // Qui inseriremo la logica della nostra macchina a stati.
  },
})`;

export default initialPlayerCode;
