import DefaultAIBase from "./DefaultAIBase.js";

/**
 * Funzione ricorsiva per stringificare un oggetto, gestendo correttamente
 * oggetti, array, funzioni e primitivi in una stringa di codice formattata.
 * @param {*} value - Il valore da stringificare.
 * @param {string} indent - La stringa di indentazione corrente.
 * @returns {string}
 */
function stringifyRecursive(value, indent) {
  const nextIndent = indent + "  ";

  // Gestione dei tipi primitivi e delle funzioni non in oggetti
  if (value === null) return "null";
  if (typeof value !== "object") {
    if (typeof value === "function") {
      return value.toString().replace(/\n/g, `\n${indent}`);
    }
    return JSON.stringify(value);
  }

  // Gestione degli Array
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const arrayParts = value.map((item) =>
      `${nextIndent}${stringifyRecursive(item, nextIndent)}`
    );
    return `[\n${arrayParts.join(",\n")}\n${indent}]`;
  }

  // Gestione degli Oggetti
  const keys = Object.keys(value);
  if (keys.length === 0) return "{}";

  const parts = [];
  for (const key of keys) {
    const propValue = value[key];

    if (typeof propValue === "function") {
      const funcStr = propValue.toString().replace(/\n/g, `\n${nextIndent}`);
      // Gestisce la differenza tra `myMethod() {}` e `myFunc: function() {}`
      if (funcStr.startsWith("function") || funcStr.startsWith("(")) {
        parts.push(`${nextIndent}${key}: ${funcStr}`);
      } else {
        parts.push(`${nextIndent}${funcStr}`);
      }
    } else {
      const valueStr = stringifyRecursive(propValue, nextIndent);
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
  return `(${stringifyRecursive(aiObject, "")})`;
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
