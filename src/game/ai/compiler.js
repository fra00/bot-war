/**
 * Tenta di "compilare" la stringa di codice in un oggetto AI valido.
 * Il codice deve essere un'espressione JavaScript che restituisce un oggetto.
 * NOTA: `new Function()` ha implicazioni di sicurezza. In un'app reale,
 * questo dovrebbe essere eseguito in un Web Worker o in un sandbox più sicuro.
 * @param {string} code - Il codice scritto dal giocatore, che dovrebbe essere un'espressione che restituisce un oggetto.
 * @returns {object} L'oggetto AI con il metodo `run` e uno stato potenziale.
 * @throws {Error} Se il codice non è sintatticamente valido o non restituisce un oggetto AI valido.
 */
export const compileAI = (code) => {
  // Il codice dell'utente deve essere un'espressione che restituisce un oggetto.
  // Lo avvolgiamo in una funzione che lo restituisce.
  // L'uso di `(` e `)` intorno al codice è un trucco per garantire che
  // un oggetto letterale `{...}` venga interpretato come un'espressione e non come un blocco di codice.
  const factory = new Function(`return (${code})`);
  const aiObject = factory();

  // Validazione della struttura dell'oggetto AI compilato
  if (typeof aiObject !== "object" || aiObject === null) {
    throw new Error("AI code must evaluate to an object.");
  }
  if (typeof aiObject.run !== "function") {
    throw new Error("The AI object must have a 'run' method.");
  }

  // Esegue un test di validazione per catturare errori di runtime immediati nel codice dell'IA.
  try {
    // Crea un'API fittizia completa per il test.
    const mockApi = {
      move: (distance, speedPercentage) => {},
      moveTo: (x, y, speedPercentage) => {},
      rotate: (percentage) => {},
      aimAt: (x, y, speedPercentage) => {},
      stop: () => {},
      fire: () => {},
      scan: () => null,
      getArenaDimensions: () => ({ width: 800, height: 600, obstacles: [] }),
      getState: () => ({}),
      getEvents: () => [],
      isLineOfSightClear: (targetPosition) => true,
      isObstacleAhead: () => false,
      isQueueEmpty: () => true,
      log: (level, message) => console.log(`[${level}] ${message}`),
    };
    // Eseguiamo la validazione sull'oggetto appena creato.
    // Questo potrebbe mutarne lo stato, il che è indesiderato per l'oggetto finale.
    aiObject.run(mockApi);
  } catch (e) {
    // Se la chiamata di prova fallisce, l'errore è nel codice dell'IA.
    // Rilanciamo un errore più descrittivo che include il messaggio originale.
    throw new Error(`Error during AI validation: ${e.message}`);
  }
  // Se la validazione ha successo, restituiamo una NUOVA istanza pulita dell'oggetto AI,
  // per assicurarci che lo stato non sia stato mutato dalla chiamata di validazione.
  return factory();
};
