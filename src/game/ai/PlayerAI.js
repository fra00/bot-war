import DefaultAIBase from "./DefaultAIBase.js";

/**
 * Converte un oggetto AI in una stringa di codice sorgente che può essere valutata.
 * Questo assicura che tutti i metodi e le proprietà vengano inclusi.
 * @param {object} aiObject - L'oggetto AI da stringificare.
 * @returns {string}
 */
const stringifyAI = (aiObject) => {
  const parts = [];
  for (const key in aiObject) {
    if (Object.prototype.hasOwnProperty.call(aiObject, key)) {
      const value = aiObject[key];
      if (typeof value === "function") {
        const funcStr = value.toString();
        // Controlla se è una funzione definita con la sintassi shorthand del metodo (es. `myMethod() {}`)
        // o una funzione freccia. Le funzioni tradizionali iniziano con "function".
        if (funcStr.startsWith("function") || funcStr.startsWith("(")) {
          // Funzione tradizionale o freccia: `key: function() {}` o `key: () => {}`
          parts.push(`  ${key}: ${funcStr}`);
        } else {
          // Metodo Shorthand: `myMethod() {}`. La stringa include già la chiave.
          parts.push(`  ${funcStr}`);
        }
      } else {
        // Aggiunge altri valori (come oggetti, stringhe, numeri) come JSON.
        parts.push(`  ${key}: ${JSON.stringify(value, null, 2)}`);
      }
    }
  }
  // Unisce tutte le parti in una singola stringa di oggetto letterale.
  // Le parentesi esterne sono cruciali per far sì che `eval` o `new Function`
  // interpretino `{...}` come un'espressione oggetto e non come un blocco di codice.
  return `({\n${parts.join(",\n")}\n})`;
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
