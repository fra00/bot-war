# Prompt per la Generazione di IA per Bot da Combattimento

Questo documento serve come modello di prompt per un Large Language Model (LLM) con l'obiettivo di generare codice JavaScript per l'intelligenza artificiale di un robot da combattimento.

---

## Contesto e Obiettivo

Sei un ingegnere software senior specializzato in intelligenza artificiale per videogiochi. Il tuo compito è scrivere il codice JavaScript per l'IA di un robot da combattimento autonomo.

L'output deve essere un **singolo blocco di codice JavaScript** contenente un oggetto letterale. Questo oggetto verrà valutato dinamicamente dal motore di gioco. Deve avere una struttura specifica e utilizzare un'API ben definita per interagire con il mondo di gioco.

---

## 1. API di Riferimento (Funzioni Disponibili)

Questa è l'API completa che l'IA può utilizzare tramite l'oggetto `api`.

### Regole Strette per l'Uso dell'API

- **NON** inventare funzioni che non sono in questa lista.
- **NON** assumere che le funzioni accettino parametri non documentati.
- Presta attenzione ai tipi di ritorno e gestisci i casi in cui una funzione restituisce `null` o `undefined`.

```javascript
/**
 * API del Robot - Funzioni disponibili per l'IA
 */
const api = {
  // === AZIONI DI DEBUG ===
  log: (...args) => {
    /* Scrive un messaggio nei log del bot. */
  },

  // === AZIONI ASINCRONE (avviano un'operazione che dura nel tempo) ===
  move: (distance, speedPercentage = 100) => {
    /* Muove il bot in avanti (distanza > 0) o indietro (distanza < 0). L'unità è in pixel. */
  },
  moveTo: (targetX, targetY, speedPercentage = 100) => {
    /* Muove il bot verso una coordinata, evitando ostacoli. Restituisce `true` se un percorso è stato trovato, `false` altrimenti. */
  },
  aimAt: (targetX, targetY, speedPercentage = 100) => {
    /* Comando "continuo" per mirare a una destinazione. Se chiamato ad ogni tick, il bot correggerà la sua mira verso il bersaglio. Interrompe altre azioni per dare priorità alla mira. */
  },
  stop: (source = "AI_REQUEST") => {
    /* Interrompe immediatamente qualsiasi azione in corso (movimento/rotazione). */
  },
  sequence: (actions) => {
    /* Esegue una sequenza di azioni (es. [{ type: 'START_MOVE', payload: { distance: 50 } }]) una dopo l'altra. */
  },

  // === AZIONI SINCRONE (effetto immediato) ===
  fire: () => {
    /* Spara un proiettile se il cannone non è in cooldown. */
  },

  // === AZIONI DI PERCEZIONE ===
  scan: () => {
    /* Restituisce un oggetto con informazioni sul nemico se è nel raggio del radar e in linea di vista, altrimenti restituisce `null`. Struttura oggetto: { id, x, y, distance, angle } */
  },
  scanObstacles: () => {
    /* Restituisce un array di ostacoli visibili. Struttura oggetto: { id, x, y, width, height, distance } */
  },
  isLineOfSightClear: (targetPosition) => {
    /* Restituisce `true` se non ci sono ostacoli tra il bot e la posizione target. `targetPosition` è un oggetto {x, y}. */
  },
  isPositionValid: (position) => {
    /* Restituisce `true` se la posizione {x, y} è dentro l'arena e non dentro un ostacolo. */
  },
  isObstacleAhead: (probeDistance = 30) => {
    /* Restituisce `true` se c'è un ostacolo direttamente di fronte al bot entro la distanza specificata. */
  },

  // === INFORMAZIONI DI STATO ===
  getState: () => {
    /* Restituisce lo stato base del proprio bot. Struttura oggetto: { x, y, rotation, hp, energy } */
  },
  getBatteryState: () => {
    /* Restituisce lo stato della batteria. Struttura oggetto: { energy, maxEnergy } */
  },
  getArenaDimensions: () => {
    /* Restituisce le dimensioni dell'arena. Struttura oggetto: { width, height } */
  },
  isQueueEmpty: () => {
    /* Restituisce `true` se il bot non sta eseguendo nessuna azione asincrona (è inattivo). */
  },

  // === MEMORIA PERSISTENTE ===
  getMemory: () => {
    /* Restituisce un oggetto che persiste tra i tick. Puoi usarlo per salvare dati (es. { lastKnownPosition: ... }). */
  },
  updateMemory: (propertiesToUpdate) => {
    /* Aggiorna l'oggetto di memoria, eseguendo un merge delle nuove proprietà. */
  },

  // === EVENTI ===
  getEvents: () => {
    /* Restituisce un array di eventi accaduti nell'ultimo tick. Tipi di evento possibili: 'HIT_BY_PROJECTILE', 'ENEMY_DETECTED', 'SEQUENCE_COMPLETED', 'ACTION_STOPPED' (con una `reason` come 'COLLISION'), 'ENEMY_HIT'. */
  },
};
```

---

## 2. Struttura e Esempio di Codice (DefaultAIBase.js)

L'IA deve essere un oggetto JavaScript con una struttura specifica. L'approccio consigliato è una **macchina a stati finiti (FSM)**.

L'oggetto deve contenere:

- `states`: Un oggetto dove ogni chiave è il nome di uno stato (es. `SEARCHING`) e il valore è un oggetto con metodi `onEnter`, `onExecute`, `onExit`.
- `setCurrentState`: Una funzione per gestire la transizione tra stati.
- `run`: La funzione principale, chiamata ad ogni tick del gioco, che orchestra la logica e le transizioni.

Ecco un esempio completo e funzionante. **Usa questo come riferimento per la struttura del codice e per capire come combinare le chiamate API.**

```javascript
const DefaultAIBase = {
  states: {
    SEARCHING: {
      onEnter: (api, memory) => {
        api.log("Inizio pattugliamento...");
      },
      onExecute: (api, memory, events) => {
        const potentialTarget = api.scan();
        if (potentialTarget) {
          return "ATTACKING";
        }
        if (
          memory.lastKnownEnemyPosition &&
          events.some(
            (e) =>
              e.type === "SEQUENCE_COMPLETED" ||
              (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
          )
        ) {
          api.updateMemory({ lastKnownEnemyPosition: null });
        }
        if (api.isQueueEmpty()) {
          if (memory.lastKnownEnemyPosition) {
            api.log("Inseguo il nemico all'ultima posizione nota...");
            const moveSuccessful = api.moveTo(
              memory.lastKnownEnemyPosition.x,
              memory.lastKnownEnemyPosition.y,
              70
            );
            if (!moveSuccessful) {
              api.updateMemory({ lastKnownEnemyPosition: null });
            }
          } else {
            api.log("Inizio pattugliamento casuale...");
            const arena = api.getArenaDimensions();
            const randomX = Math.random() * arena.width;
            const randomY = Math.random() * arena.height;
            api.moveTo(randomX, randomY, 70);
          }
        }
      },
    },
    ATTACKING: {
      onExecute: (api, memory, events) => {
        const enemy = api.scan();
        if (!enemy) {
          return "SEARCHING";
        }
        api.updateMemory({
          lastKnownEnemyPosition: { x: enemy.x, y: enemy.y },
        });

        if (Math.abs(enemy.angle) < 5 && api.isLineOfSightClear(enemy)) {
          api.fire();
        }

        // Con la nuova logica, chiamiamo `aimAt` ad ogni tick per correggere
        // continuamente la mira verso il nemico.
        api.aimAt(enemy.x, enemy.y);

        // La logica di movimento viene eseguita solo se non siamo già impegnati in un'azione.
        if (api.isQueueEmpty()) {
          if (!api.isLineOfSightClear(enemy)) return "FLANKING";
          if (enemy.distance < 150) return "KITING";
          if (enemy.distance > 300) {
            api.log("Nemico troppo lontano, mi avvicino...");
            api.move(80);
          }
        }
      },
    },
    // ... (altri stati come KITING, FLANKING, EVADING, ecc. sono presenti nell'esempio completo)
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
  run: function (api) {
    const memory = api.getMemory();
    if (typeof memory.current === "undefined") {
      this.setCurrentState("SEARCHING", api);
    }
    const events = api.getEvents();
    // ... (logica di transizione ad alta priorità per eventi come HIT_BY_PROJECTILE, COLLISION, ecc.)
    const currentStateName = memory.current;
    const currentState = this.states[currentStateName];
    if (currentState) {
      const nextStateName = currentState.onExecute?.(api, memory, events, {});
      if (nextStateName && nextStateName !== currentStateName) {
        this.setCurrentState(nextStateName, api);
      }
    }
  },
};
```

---

## 3. La Tua Missione

Ora, basandoti sull'API fornita e prendendo spunto dalla struttura dell'esempio, crea una **nuova** IA per il bot.

**Strategia richiesta:**

> **Crea un bot 'cecchino' difensivo.** La sua priorità è trovare un buon punto di copertura (preferibilmente un angolo dell'arena), rimanere fermo e sparare solo a nemici a lunga distanza. Deve avere uno stato `REPOSITIONING` per fuggire e trovare una nuova copertura se un nemico si avvicina troppo (es. a meno di 150 pixel) o se la sua linea di tiro è costantemente bloccata.

### Criteri di Successo

- [ ] Il codice fornito è un singolo oggetto JavaScript valido, racchiuso tra `({` e `})`.
- [ ] Il codice utilizza **solo** le funzioni definite nella sezione "API di Riferimento".
- [ ] La macchina a stati è robusta, con uno stato di default (es. `SEARCHING_COVER`) e gestisce correttamente le transizioni.
- [ ] La logica gestisce il caso in cui `api.scan()` restituisce `null` (nemico non visibile).
- [ ] Non vengono definite funzioni o variabili al di fuori dell'oggetto principale.
- [ ] Il codice è ben commentato per spiegare le decisioni strategiche più importanti.
