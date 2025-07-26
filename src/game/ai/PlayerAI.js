import DefaultAI from "./DefaultAI.js";

// Converte l'oggetto AI di default in una stringa di codice sorgente.
// Questo assicura che il codice di partenza del giocatore sia sempre
// sincronizzato con l'IA di default, senza bisogno di copia-incolla manuale.
//run: ${DefaultAI.run.toString()}
//run: () => {
//    // Inserisci qui la tua logica di gioco.
//  }
const initialPlayerCode = `({
  state: ${JSON.stringify(DefaultAI.state, null, 2)},
  run: ${DefaultAI.run.toString()}
})`;

export default initialPlayerCode;
