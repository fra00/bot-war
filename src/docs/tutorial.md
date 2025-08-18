----
## Tutorial: Creare il Tuo Primo Bot

Benvenuto! Questo tutorial ti guiderà passo dopo passo nella creazione di un'intelligenza artificiale (IA) per il tuo primo robot. Imparerai a implementare una logica di base che permette al tuo bot di cercare il nemico, attaccarlo quando lo trova e schivare i colpi.

Utilizzeremo i concetti fondamentali dell'API, come la **coda di comandi**, gli **eventi** e l'architettura a **macchina a stati dichiarativa**.

---

## Passo 1: La Struttura di Base (Il "Motore" dell'IA)

Ogni IA è un oggetto JavaScript che deve avere una funzione `run(api)`. Il modo migliore per organizzare la logica è usare una macchina a stati.

Copia questo scheletro nell'editor. Definisce la struttura base con una mappa `states`, una lista di `globalTransitions` per le emergenze, e una funzione `run` che agisce come motore della nostra macchina a stati. Contiene anche la funzione `setCurrentState`, che non dovrai modificare.

```javascript
({
  // =================================================================
  // CONFIGURAZIONE (opzionale)
  // =================================================================
  config: {
    // Qui puoi definire costanti per il tuo bot
    patrolSpeed: 70,
    aimTolerance: 5,
    evasionGracePeriod: 120, // Tick di "invulnerabilità" dopo un'evasione
  },

  // =================================================================
  // TRANSIZIONI GLOBALI (Massima Priorità)
  // =================================================================
  globalTransitions: [
    {
      target: "EVADING",
      condition: function (api, memory, context, events) {
        // Se veniamo colpiti e non siamo già in un periodo di grazia, evadiamo.
        return (
          events.some((e) => e.type === "HIT_BY_PROJECTILE") &&
          memory.evasionGraceTicks <= 0
        );
      },
      description: "Colpiti da un proiettile, evasione ha la priorità.",
    },
  ],

  // =================================================================
  // MACCHINA A STATI
  // =================================================================
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
      api.updateMemory({ evasionGraceTicks: 0 });
      this.setCurrentState("SEARCHING", api);
      return; // Esce per questo tick, la logica inizierà dal prossimo.
    }

    // Decrementa il contatore del periodo di grazia per l'evasione ad ogni tick.
    if (memory.evasionGraceTicks > 0) {
      api.updateMemory({ evasionGraceTicks: memory.evasionGraceTicks - 1 });
    }

    const events = api.getEvents();
    const enemy = api.scan();
    const context = { enemy, config: this.config }; // Passiamo dati utili agli stati

    // --- Gestione Transizioni ad Alta Priorità ---
    for (const transition of this.globalTransitions) {
      if (transition.condition.call(this, api, memory, context, events)) {
        this.setCurrentState(transition.target, api, context);
        return;
      }
    }

    // --- Esecuzione dello Stato Corrente ---
    const currentStateName = memory.current;
    const currentState = this.states[currentStateName];

    // 1. Controlla le transizioni locali dello stato
    if (currentState?.transitions) {
      for (const transition of currentState.transitions) {
        if (transition.condition.call(this, api, memory, context, events)) {
          this.setCurrentState(transition.target, api, context);
          return;
        }
      }
    }

    // 2. Se nessuna transizione è scattata, esegui la logica dello stato
    if (currentState?.onExecute) {
      const nextStateName = currentState.onExecute.call(
        this,
        api,
        memory,
        events,
        context
      );
      if (nextStateName && nextStateName !== currentStateName) {
        this.setCurrentState(nextStateName, api);
      }
    }
  },

  // --- Motore della Macchina a Stati (non modificare) ---
  setCurrentState: function (newState, api, context = {}) {
    const memory = api.getMemory();
    const oldState = memory.current;

    if (oldState !== newState) {
      if (oldState && this.states[oldState]?.onExit) {
        this.states[oldState].onExit.call(this, api, memory);
      }

      api.stop("STATE_TRANSITION");
      api.log(`Stato: ${oldState || "undefined"} -> ${newState}`);
      api.updateMemory({ current: newState });

      if (this.states[newState]?.onEnter) {
        this.states[newState].onEnter.call(this, api, memory, context);
      }
    }
  },
});
```

---

## Passo 2: Implementare lo Stato `SEARCHING`

Nello stato `SEARCHING`, il nostro bot deve pattugliare l'arena. La sua logica è:

1.  **`transitions`**: Definiamo una regola di transizione per passare allo stato `ATTACKING` quando `api.scan()` rileva un nemico.
2.  **`onExecute`**: Se il bot è inattivo (`api.isQueueEmpty()`), avvia un pattugliamento verso un punto casuale.

Aggiungi questo oggetto all'interno della mappa `states` del tuo codice. Nota come usiamo `api.getRandomPoint()`: questa funzione è molto più intelligente di `Math.random()`, perché ci garantisce di ottenere un punto **valido e raggiungibile**, evitando di scegliere destinazioni all'interno degli ostacoli.

```javascript
SEARCHING: {
  onEnter: (api, memory) => {
    api.log("Inizio pattugliamento...");
  },
  onExecute: function (api, memory, events) {
    // Se il bot è inattivo, decide la prossima mossa di pattugliamento.
    if (api.isQueueEmpty()) {
      // Usiamo la nuova funzione per ottenere un punto valido,
      // evitando di scegliere destinazioni dentro gli ostacoli.
      const randomPoint = api.getRandomPoint();
      if (randomPoint) {
        api.moveTo(randomPoint.x, randomPoint.y, this.config.patrolSpeed);
      }
    }
  },
  transitions: [
    {
      target: 'ATTACKING',
      // La condizione per la transizione è che `context.enemy` non sia nullo.
      // Il `context` viene preparato per noi nella funzione `run`.
      condition: (api, memory, context) => context.enemy,
      description: "Passa ad attaccare se un nemico è visibile."
    }
  ]
},
```

---

## Passo 3: Implementare lo Stato `ATTACKING`

Quando siamo in `ATTACKING`, la nostra logica è:

1.  **`transitions`**: Definiamo una regola per tornare a `SEARCHING` se `api.scan()` restituisce `null`.
2.  **`onExecute`**: Ad ogni tick, dichiara l'intento di mirare al nemico e spara se la mira è buona.

Aggiungi questo oggetto all'interno di `states`:

```javascript
ATTACKING: {
  onExecute: function (api, memory, events, context) {
    const { enemy } = context;
    if (!enemy) return; // Guardia di sicurezza

    // Azione continua: spara se la mira è buona.
    if (Math.abs(enemy.angle) < this.config.aimTolerance && api.isLineOfSightClear(enemy)) {
      api.fire();
    }

    // Azione continua: dichiariamo il nostro intento di mirare al nemico.
    // Il motore di gioco si occuperà di correggere la mira in modo efficiente.
    api.aimAt(enemy.x, enemy.y);
  },
  transitions: [
    {
      target: 'SEARCHING',
      condition: (api, memory, context) => !context.enemy,
      description: "Passa a cercare se il nemico non è più visibile."
    }
  ]
},
```

---

## Passo 4: Implementare lo Stato `EVADING`

La transizione a `EVADING` avviene automaticamente quando veniamo colpiti, grazie alla regola che abbiamo definito in `globalTransitions`. Il nostro compito è definire cosa fare una volta entrati in questo stato.

1.  **`onEnter`**: Avvia una manovra evasiva (gira e muoviti) e imposta un "periodo di grazia" per non essere interrotti subito da un altro colpo.
2.  **`transitions`**: Definiamo una regola per tornare a `SEARCHING` quando la manovra è finita.

Aggiungi questo oggetto all'interno di `states`:

```javascript
EVADING: {
  onEnter: function (api, memory, context) {
    api.log("Colpito! Eseguo manovra evasiva...");
    // Imposta un periodo di grazia per non entrare in questo stato ad ogni colpo.
    api.updateMemory({ evasionGraceTicks: this.config.evasionGracePeriod });

    // Gira di un angolo casuale e scatta in avanti.
    const randomAngle = (Math.random() > 0.5 ? 90 : -90);
    api.sequence([
      { type: 'START_ROTATE', payload: { angle: randomAngle } },
      { type: 'START_MOVE', payload: { distance: 150 } }
    ]);
  },
  transitions: [
    {
      target: 'SEARCHING',
      // Torniamo a cercare non appena la manovra evasiva è terminata.
      condition: (api, memory, context) => api.isQueueEmpty(),
      description: "Torna a cercare dopo aver completato la manovra evasiva."
    }
  ]
},
```
