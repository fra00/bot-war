/**
 * Configurazione per i passi del tutorial interattivo.
 * Ogni oggetto definisce un passo del tutorial.
 */
export const tutorialSteps = [
  {
    elementSelector: '[data-tutorial-id="game-settings-button"]',
    title: "Benvenuto in Bot-War!",
    content:
      "Questo tutorial ti guiderà attraverso le basi. Iniziamo aprendo il menu delle 'impostazioni' della partita.",
    placement: "bottom",
    waitForUserAction: true,
  },
  {
    elementSelector: '[data-tutorial-id="open-editor-button"]',
    title: "Apri l'Editor AI",
    content:
      "Ottimo! Da qui puoi accedere a tutte le funzionalità. Clicca su 'Editor AI' per iniziare a programmare il tuo primo bot.",
    placement: "right",
    waitForUserAction: true,
  },
  {
    elementSelector: '[data-tutorial-id="new-bot-button"]',
    title: "Crea il tuo primo Bot",
    content:
      "Perfetto. Ora sei nell'editor. Per iniziare, crea il tuo primo script per un bot cliccando su questo pulsante.",
    placement: "right",
    waitForUserAction: true,
  },
  {
    elementSelector: '[data-tutorial-id="script-name-input"]',
    title: "Dai un nome al tuo Bot",
    content:
      "Ogni grande guerriero ha un nome. Scegline uno per il tuo bot e premi il pulsante 'Conferma'.",
    placement: "bottom",
    waitForUserAction: true,
  },
  {
    elementSelector: '[data-tutorial-id="code-editor"]',
    title: "Scrivi il codice",
    content:
      "Questo è il cervello del tuo bot. Scrivi qui la sua logica in JavaScript. Per ora, puoi lasciare il codice di esempio. Clicca 'Avanti' per continuare.",
    placement: "top",
    // L'utente clicca "Avanti" qui, quindi non c'è waitForUserAction
  },
  {
    elementSelector: '[data-tutorial-id="bot-settings-button"]',
    title: "Impostazioni del Bot",
    content:
      "Bene! Se vuoi rendere il tuo bot disponibile per le battaglie online, apri le impostazioni specifiche di questo bot.",
    placement: "top",
    waitForUserAction: true,
  },
  {
    elementSelector: '[data-tutorial-id="multiplayer-toggle"]',
    title: "Abilita per il Multiplayer",
    content:
      "Attiva questo interruttore per rendere il tuo bot eleggibile per le sfide multiplayer.",
    placement: "right",
  },
  {
    elementSelector: '[data-tutorial-id="save-settings-button"]',
    title: "Salva le Impostazioni",
    content:
      "Perfetto. Ora salva le impostazioni per tornare all'editor principale.",
    placement: "top",
    waitForUserAction: true,
  },
  {
    elementSelector: '[data-tutorial-id="apply-and-restart-button"]',
    title: "Avvia la battaglia!",
    content:
      "Fantastico! Ora sei pronto. Clicca qui per applicare lo script e avviare la simulazione. Questo chiuderà l'editor.",
    placement: "top",
    waitForUserAction: true,
  },
  {
    // No elementSelector for a final, centered message
    title: "Tutorial Completato!",
    content:
      "Hai completato il tutorial! Ora sei pronto a dominare l'arena. Buona fortuna!",
    placement: "center", // Special placement for centering
  },
];
