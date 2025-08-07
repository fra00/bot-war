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

  // Abbiamo rimosso il test di validazione "a secco" (dry-run) per essere meno restrittivi.
  // Questo permette all'utente di definire qualsiasi struttura di oggetto AI,
  // purché rispetti il contratto minimo di avere un metodo `run`.
  // Gli errori di runtime verranno ora rilevati durante la simulazione del gioco.

  // Restituiamo l'oggetto AI creato. Non è più necessario creare una nuova istanza
  // perché non eseguiamo una chiamata di test che potrebbe mutarne lo stato.
  return aiObject;
};
