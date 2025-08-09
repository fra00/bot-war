# Tutorial: Creare il Tuo Primo Bot

Benvenuto! Questo tutorial ti guiderà passo dopo passo nella creazione di un'intelligenza artificiale (IA) per il tuo primo robot. Imparerai a implementare una logica di base che permette al tuo bot di cercare il nemico, attaccarlo quando lo trova e tentare di schivare i colpi.

Utilizzeremo i concetti fondamentali dell'API, come la **coda di comandi**, gli **eventi** e l'architettura a **macchina a stati** basata sul pattern `Enter/Execute/Exit`.

---

## Passo 1: La Struttura di Base (Il "Motore" dell'IA)

Ogni IA è un oggetto JavaScript che deve avere una funzione `run(api)`. Il modo migliore per organizzare la logica è usare una mappa di stati.

Copia questo scheletro nell'editor. Definisce la struttura base con una mappa `states` e una funzione `run` che agisce come motore della nostra macchina a stati. Contiene anche la funzione `setCurrentState`, che non dovrai modificare.

```javascript
({
  // La mappa degli stati definisce la logica per ogni stato dell'IA.
  states: {
    // Qui definiremo i nostri stati: SEARCHING, ATTACKING, EVADING
  },

  /**
   * La funzione run viene chiamata ad ogni tick del gioco.
   * @param {Object} api - L'API per controllare il tuo bot.
   */
  run: function (api) {
    // Inizializzazione al primo tick.
    const memory = api.getMemory();
    if (typeof memory.current === "undefined") {
      api.updateMemory({
        // Inizializza qui le variabili di memoria.
        lastKnownEnemyPosition: null,
      });
      this.setCurrentState("SEARCHING", api);
      return; // Esce per questo tick, la logica inizierà dal prossimo.
    }

    const events = api.getEvents();

    // --- Gestione Transizioni ad Alta Priorità ---
    // Se veniamo colpiti, passiamo sempre allo stato di evasione.
    if (events.some((e) => e.type === "HIT_BY_PROJECTILE")) {
      this.setCurrentState("EVADING", api);
      return; // Interrompi il tick per dare priorità alla nuova azione evasiva.
    }

    // --- Esecuzione dello Stato Corrente ---
    const currentStateName = memory.current;
    const currentState = this.states[currentStateName];

    if (currentState && currentState.onExecute) {
      const nextStateName = currentState.onExecute(api, memory, events);
      if (nextStateName && nextStateName !== currentStateName) {
        this.setCurrentState(nextStateName, api);
      }
    }
  },

  // --- Motore della Macchina a Stati (non modificare) ---
  setCurrentState: function (newState, api) {
    const memory = api.getMemory();
    const oldState = memory.current;

    if (oldState !== newState) {
      if (oldState && this.states[oldState]?.onExit) {
        this.states[oldState].onExit(api, memory);
      }

      api.stop("STATE_TRANSITION");

      api.log(`Stato: ${oldState || "undefined"} -> ${newState}`);
      api.updateMemory({ current: newState });

      if (this.states[newState]?.onEnter) {
        this.states[newState].onEnter(api, memory);
      }
    }
  },
});
```

---

## Passo 2: Implementare lo Stato `SEARCHING`

Nello stato `SEARCHING`, il nostro bot deve pattugliare l'arena. La sua logica è:
1.  **`onExecute`**: Controlla se il nemico è visibile. Se sì, richiede di passare allo stato `ATTACKING`.
2.  **`onExecute`**: Se il bot è inattivo (`api.isQueueEmpty()`), avvia un pattugliamento verso un punto casuale.

Aggiungi questo oggetto all'interno della mappa `states` del tuo codice:

```javascript
// Aggiungi questo oggetto all'interno di `states: { ... }`
SEARCHING: {
  onEnter: (api, memory) => {
    api.log("Inizio pattugliamento...");
  },
  onExecute: (api, memory, events) => {
    // Condizione di uscita: se vediamo un nemico, attacchiamo.
    if (api.scan()) {
      return "ATTACKING";
    }

    // Se il bot è inattivo, decide la prossima mossa di pattugliamento.
    if (api.isQueueEmpty()) {
      const arena = api.getArenaDimensions();
      const randomX = Math.random() * arena.width;
      const randomY = Math.random() * arena.height;
      api.moveTo(randomX, randomY, 70); // Pattuglia a velocità ridotta
    }
  },
},
```

---

## Passo 3: Implementare lo Stato `ATTACKING`

Quando siamo in `ATTACKING`, la nostra logica è:
1.  **`onExecute`**: Controlla se il nemico è ancora visibile. Se no, torna a `SEARCHING`.
2.  **`onExecute`**: Spara continuamente se la mira è buona e la linea di tiro è libera.
3.  **`onExecute`**: Ad ogni tick, dichiara l'intento di mirare al nemico. Il motore di gioco si occuperà di avviare o correggere la rotazione.

Aggiungi questo oggetto all'interno di `states`:

```javascript
// Aggiungi questo oggetto all'interno di `states: { ... }`
ATTACKING: {
  onExecute: (api, memory, events) => {
    const enemy = api.scan();

    // Condizione di uscita: se perdiamo il bersaglio, torniamo a cercare.
    if (!enemy) {
      return "SEARCHING";
    }

    // Azione continua: spara se la mira è buona.
    if (Math.abs(enemy.angle) < 5 && api.isLineOfSightClear(enemy)) {
      api.fire();
    }

    // Azione continua: dichiariamo il nostro intento di mirare al nemico.
    // Il motore di gioco si occuperà di correggere la mira in modo efficiente.
    api.aimAt(enemy.x, enemy.y);
  },
},
```

---

## Passo 4: Implementare lo Stato `EVADING`

La transizione a `EVADING` avviene automaticamente quando veniamo colpiti, grazie alla logica che abbiamo inserito in `run`. Il nostro compito è definire cosa fare una volta entrati in questo stato.
1.  **`onEnter`**: Avvia una manovra evasiva (gira e muoviti).
2.  **`onExecute`**: Controlla se la manovra è finita. Se sì, torna a `SEARCHING`.

Aggiungi questo oggetto all'interno di `states`:

```javascript
// Aggiungi questo oggetto all'interno di `states: { ... }`
EVADING: {
  onEnter: (api, memory) => {
    api.log("Eseguo manovra evasiva...");
    // Gira di un angolo casuale e scatta in avanti.
    const randomAngle = (Math.random() < 0.5 ? 90 : -90) + (Math.random() * 30 - 15);
    api.sequence([
      { type: "START_ROTATE", payload: { angle: randomAngle } },
      { type: "START_MOVE", payload: { distance: 100 } },
    ]);
  },
  onExecute: (api, memory, events) => {
    // Condizione di uscita: la manovra è completata.
    // Filtriamo lo stop causato dalla transizione di stato.
    if (events.some(e => e.type === "SEQUENCE_COMPLETED" || (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION"))) {
      return "SEARCHING";
    }
  },
},
```

---

## Passo 5: Codice Completo e Prossimi Passi

Congratulazioni! Hai creato la tua prima IA funzionante. Ora puoi premere "Compile" e "Start" per vederla in azione.

Il codice completo dovrebbe assomigliare a questo. Puoi usarlo come riferimento o per fare copia-incolla se qualcosa non funziona.

```javascript
({
  states: {
    SEARCHING: {
      onEnter: (api, memory) => {
        api.log("Inizio pattugliamento...");
      },
      onExecute: (api, memory, events) => {
        if (api.scan()) {
          return "ATTACKING";
        }
        if (api.isQueueEmpty()) {
          const arena = api.getArenaDimensions();
          api.moveTo(
            Math.random() * arena.width,
            Math.random() * arena.height,
            70
          );
        }
      },
    },
    ATTACKING: {
      onExecute: (api, memory, events) => {
        const enemy = api.scan();
        if (!enemy) {
          return "SEARCHING";
        }
        if (Math.abs(enemy.angle) < 5 && api.isLineOfSightClear(enemy)) {
          api.fire();
        }
        api.aimAt(enemy.x, enemy.y);
      },
    },
    EVADING: {
      onEnter: (api, memory) => {
        api.log("Eseguo manovra evasiva...");
        const randomAngle =
          (Math.random() < 0.5 ? 90 : -90) + (Math.random() * 30 - 15);
        api.sequence([
          { type: "START_ROTATE", payload: { angle: randomAngle } },
          { type: "START_MOVE", payload: { distance: 100 } },
        ]);
      },
      onExecute: (api, memory, events) => {
        if (
          events.some(
            (e) =>
              e.type === "SEQUENCE_COMPLETED" ||
              (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
          )
        ) {
          return "SEARCHING";
        }
      },
    },
  },
  run: function (api) {
    const memory = api.getMemory();
    if (typeof memory.current === "undefined") {
      api.updateMemory({ lastKnownEnemyPosition: null });
      this.setCurrentState("SEARCHING", api);
      return;
    }
    const events = api.getEvents();
    if (events.some((e) => e.type === "HIT_BY_PROJECTILE")) {
      this.setCurrentState("EVADING", api);
      return;
    }
    const currentStateName = memory.current;
    const currentState = this.states[currentStateName];
    if (currentState && currentState.onExecute) {
      const nextStateName = currentState.onExecute(api, memory, events);
      if (nextStateName && nextStateName !== currentStateName) {
        this.setCurrentState(nextStateName, api);
      }
    }
  },
  setCurrentState: function (newState, api) {
    const memory = api.getMemory();
    const oldState = memory.current;
    if (oldState !== newState) {
      if (oldState && this.states[oldState]?.onExit) {
        this.states[oldState].onExit(api, memory);
      }
      api.stop("STATE_TRANSITION");
      api.log(`Stato: ${oldState || "undefined"} -> ${newState}`);
      api.updateMemory({ current: newState });
      if (this.states[newState]?.onEnter) {
        this.states[newState].onEnter(api, memory);
      }
    }
  },
});
```

Ora che hai una base solida, prova a sperimentare! Ecco alcune idee:
- Migliora lo stato `ATTACKING` per far muovere il bot mentre spara (kiting).
- Nello stato `SEARCHING`, se perdi di vista il nemico, vai alla sua ultima posizione nota (`memory.lastKnownEnemyPosition`).
- Crea nuovi stati, come `FLEEING` (scappare se la vita è bassa) o `FLANKING` (aggirare gli ostacoli).

Buon divertimento!