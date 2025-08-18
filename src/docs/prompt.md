### Ruolo e Obiettivo Primario

Sei un ingegnere software senior specializzato in intelligenza artificiale per videogiochi. Il tuo compito è scrivere il codice JavaScript completo per l'IA di un robot da combattimento autonomo, seguendo scrupolosamente l'architettura, l'API, e il processo di auto-valutazione qui descritto, prestando particolare attenzione a evitare le trappole comuni.

L'output deve essere un **singolo e unico blocco di codice JavaScript** contenente un oggetto letterale racchiuso tra `({` e `})`. Il codice deve essere pronto per essere valutato dinamicamente dal motore di gioco, senza alcun testo o spiegazione aggiuntiva al di fuori del blocco di codice.

---

### 1. Contesto del Gioco e Architettura Fondamentale

Per creare un'IA robusta e reattiva, devi aderire ai seguenti principi architetturali:

#### A. Macchina a Stati Dichiarativa (FSM)

L'IA è una macchina a stati con una precisa gerarchia di valutazione e una garanzia anti-conflitto. Il motore esegue solo la **prima transizione valida** che incontra e termina immediatamente l'elaborazione per quel tick.

#### B. Coda di Comandi Asincrona

Le azioni di movimento (`move`, `moveTo`) vengono aggiunte a una coda e richiedono tempo. Usa `api.isQueueEmpty()` per verificare se il bot è inattivo.

#### C. Mira Prioritaria (`aimAt`)

`api.aimAt()` **cancella la coda di comandi**. Non puoi muoverti e mirare contemporaneamente con `aimAt`. Separa le fasi di movimento da quelle di mira/fuoco.

#### D. Reattività tramite Eventi (`api.getEvents()`)

Usa gli eventi (`HIT_BY_PROJECTILE`) come trigger per le transizioni.

#### E. Gestione dei Conflitti tra Stati (Multi-Tick)

Le transizioni a bassa priorità non devono interrompere uno stato critico. Proteggi le tue transizioni controllando lo stato corrente. Esempio: `condition: (api, memory, context) => !context.enemy && !['EVADING'].includes(memory.current)`

#### F. Contesto di `this` e Sintassi delle Funzioni (CRUCIALE)

Il motore usa `this` per accedere a `this.config`. Le **Arrow Functions (`=>`)** rompono questo meccanismo e **NON DEVONO ESSERE USATE** per i metodi degli stati o le condizioni. Usa la sintassi `function()` o il metodo breve (`onExecute() {}`).

---

### 2. API di Riferimento Completa (v4.1)

**Devi usare ESCLUSIVAMENTE le funzioni definite in questa API.**

```javascript
const api = {
  // =================================================================
  // AZIONI DI MOVIMENTO E NAVIGAZIONE (ASINCRONE, IN CODA)
  // =================================================================
  move: (distance, speedPercentage = 100) => {},
  rotate: (angle, speedPercentage = 100) => {},
  moveTo: (x, y, speedPercentage = 100) => {
    /* returns boolean */
  },
  stop: (source = "AI_REQUEST") => {},
  sequence: (actions) => {},

  // =================================================================
  // AZIONI DI COMBATTIMENTO E MIRA
  // =================================================================
  aimAt: (x, y, speedPercentage = 100) => {}, // ATTENZIONE: Interrompe il movimento e svuota la coda di comandi.
  fire: () => {}, // Istantaneo

  // =================================================================
  // PERCEZIONE, STATO ED UTILITY (ISTANTANEI)
  // =================================================================
  scan: () => {
    /* returns { distance, angle, x, y } or null */
  },
  scanObstacles: () => {
    /* returns Array of obstacles */
  },
  getState: () => {
    /* returns { x, y, rotation, hp, energy } */
  },
  getHullState: () => {
    /* returns { hp, maxHp } */
  },
  getArmorState: () => {
    /* returns { hp, maxHp } */
  },
  getBatteryState: () => {
    /* returns { energy, maxEnergy } */
  },
  getArenaDimensions: () => {
    /* returns { width, height, obstacles } */
  },
  isObstacleAhead: (probeDistance = 30) => {
    /* returns boolean */
  },
  isLineOfSightClear: (targetPosition) => {
    /* returns boolean */
  },
  isPositionValid: (position) => {
    /* returns boolean */
  },
  isQueueEmpty: () => {
    /* returns boolean */
  },
  getEvents: () => {
    /* returns Array of events */
  },

  /**
   * Genera un punto casuale valido all'interno dell'arena (o di un'area).
   * @param {{x: number, y: number, endX: number, endY: number}} [bounds] - Area opzionale.
   * @returns {{x: number, y: number}|null} Un oggetto con le coordinate o null.
   */
  getRandomPoint: (bounds = null) => {
    /* returns {x, y} or null */
  },

  // =================================================================
  // GESTIONE MEMORIA E DEBUG
  // =================================================================
  getMemory: () => {
    /* returns a persistent object */
  },
  updateMemory: (dataObject) => {},
  log: (...args) => {},
};
```

---

### 3. Esempio Guidato e i Suoi Limiti

Analizza questo esempio di base. Il suo scopo è mostrare la **sintassi corretta** e la **struttura di base** di una FSM.

**ATTENZIONE:** Questo è un esempio **minimale e volutamente semplicistico**. La sua logica di transizione (es. `SEARCHING` <-> `ATTACKING`) è troppo basilare per una strategia complessa e, se copiata ciecamente, causerà errori tattici come l'oscillazione di stato. **NON copiare la sua logica, ma impara dalla sua struttura.** La tua missione richiederà una logica di transizione molto più robusta.

```javascript
({
  // CONFIGURAZIONE IA
  config: {
    patrolSpeed: 70,
    aimTolerance: 5,
    evasionGracePeriod: 120,
    evasionDistance: 150,
    evasionAngle: 90,
  },

  // TRANSIZIONI GLOBALI
  globalTransitions: [
    {
      target: "EVADING",
      condition: function (api, memory, context, events) {
        return (
          events.some((e) => e.type === "HIT_BY_PROJECTILE") &&
          memory.evasionGraceTicks <= 0
        );
      },
      description: "Colpiti, evasione ha la priorità.",
    },
  ],

  // MACCHINA A STATI
  states: {
    SEARCHING: {
      onExecute: function (api, memory, events) {
        if (api.isQueueEmpty()) {
          const point = api.getRandomPoint();
          if (point) {
            api.moveTo(point.x, point.y, this.config.patrolSpeed);
          }
        }
      },
      transitions: [
        {
          target: "ATTACKING",
          condition: (api, memory, context) => context.enemy,
        },
      ],
    },
    ATTACKING: {
      onExecute: function (api, memory, events, context) {
        const { enemy } = context;
        if (!enemy) return;
        if (api.isQueueEmpty()) {
          api.aimAt(enemy.x, enemy.y);
          if (
            Math.abs(enemy.angle) < this.config.aimTolerance &&
            api.isLineOfSightClear(enemy)
          ) {
            api.fire();
          }
        }
      },
      transitions: [
        {
          target: "SEARCHING",
          condition: (api, memory, context) => !context.enemy,
        },
      ],
    },
    EVADING: {
      onEnter: function (api, memory) {
        api.updateMemory({ evasionGraceTicks: this.config.evasionGracePeriod });
        const randomAngle =
          (Math.random() > 0.5 ? 1 : -1) * this.config.evasionAngle;
        api.sequence([
          { type: "START_ROTATE", payload: { angle: randomAngle } },
          {
            type: "START_MOVE",
            payload: { distance: this.config.evasionDistance },
          },
        ]);
      },
      transitions: [
        {
          target: "SEARCHING",
          condition: (api, memory, context) => api.isQueueEmpty(),
        },
      ],
    },
  },

  // MOTORE FSM (NON MODIFICARE)
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
  run: function (api) {
    const memory = api.getMemory();
    if (typeof memory.current === "undefined") {
      api.updateMemory({ evasionGraceTicks: 0 });
      this.setCurrentState("SEARCHING", api);
      return;
    }
    if (memory.evasionGraceTicks > 0) {
      api.updateMemory({ evasionGraceTicks: memory.evasionGraceTicks - 1 });
    }
    const events = api.getEvents();
    const enemy = api.scan();
    const battery = api.getBatteryState();
    const batteryPercent = (battery.energy / battery.maxEnergy) * 100;
    const context = { enemy, batteryPercent, config: this.config };
    for (const transition of this.globalTransitions) {
      if (transition.condition.call(this, api, memory, context, events)) {
        this.setCurrentState(transition.target, api, context);
        return;
      }
    }
    const currentState = this.states[memory.current];
    if (currentState?.transitions) {
      for (const transition of currentState.transitions) {
        if (transition.condition.call(this, api, memory, context, events)) {
          this.setCurrentState(transition.target, api, context);
          return;
        }
      }
    }
    if (currentState?.onExecute) {
      currentState.onExecute.call(this, api, memory, events, context);
    }
  },
});
```

---

### 4. Principio Guida: Strategia > Esempio

Questa è la regola più importante da seguire. Quando crei la tua IA, la gerarchia di autorità è la seguente:

1.  **La "Tua Missione" (Sezione 6) è il comandante supremo.** La logica che scrivi deve realizzare quella strategia.
2.  Le **"Trappole Comuni da Evitare" (Sezione 5) sono le tue leggi non negoziabili.** Il tuo codice non deve mai violarle.
3.  L'**"Esempio Guidato" (Sezione 3) è un semplice riferimento sintattico.** Ti mostra _come_ formattare uno stato, non _cosa_ quello stato debba fare.

Se la logica semplice dell'esempio è in conflitto con le necessità complesse della missione, **la missione e le regole anti-pattern vincono sempre.**

---

### 5. Trappole Comuni e Anti-Pattern da Evitare

Un ingegnere senior previene attivamente i bug. Evita scrupolosamente queste trappole:

- **Anti-Pattern Logico: Oscillazione di Stato (Thrashing).**

  - **Problema:** Loop rapido tra due stati a causa di condizioni di transizione troppo sensibili.
  - **Soluzione:** Usa un "buffer" o "isteresi". Se passi a riposizionarti a `distanza < 150`, la condizione per tornare ad attaccare deve essere `distanza > 170`.

- **Anti-Pattern Tattico: Memoria Corta.**

  - **Problema:** Il bot perde il nemico e inizia subito a pattugliare a caso.
  - **Soluzione:** Usa `memory` per salvare la `lastKnownEnemyPosition` e dai priorità a quella posizione in `SEARCHING`.

- **Anti-Pattern Logico: Flag di Memoria Non Resettati.**

  - **Problema:** Uno stato imposta un flag (`memory.isRepositioning = true`) ma non lo resetta mai, bloccando l'IA.
  - **Soluzione:** Assicurati che ogni flag venga resettato (spesso in `onExit` o al completamento di un'azione).

- **Anti-Pattern Collisione:**

  - **Problema:** Il bot, evadendo, si schianta contro un muro.
  - **Soluzione:** Usa `api.isObstacleAhead()` prima di un `move` e `api.isPositionValid()` per le destinazioni di `moveTo`.

- **Anti-Pattern Tattico: Mancanza di Vie di Fuga.**

  - **Problema:** Il bot si intrappola da solo negli angoli.
  - **Soluzione:** Privilegia posizioni centrali a meno che la strategia non richieda esplicitamente di usare gli angoli.

- **Anti-Pattern Logico: Loop tra Stati Impossibilitati.**
  - **Problema:** Il bot tenta un'azione (es. `KITING`) ma è bloccato, causando una transizione a `UNSTUCKING`. Subito dopo, la condizione di `KITING` è ancora vera, creando un loop `KITING` -> `UNSTUCKING` -> `KITING`.
  - **Soluzione:** Usa la memoria per implementare un contatore di tentativi (`memory.unstuckAttempts = 0`). Se il contatore supera una soglia, forza una transizione verso uno stato di fallback più drastico (es. `EVADING` verso un punto casuale).

---

### 6. La Tua Missione

Ora, basandoti su tutto il contesto fornito, crea una **nuova e diversa** IA per il bot.

**Strategia Richiesta:**

> **[INSERISCI QUI LA TUA STRATEGIA DETTAGLIATA]**
>
> > **NOTA PER L'UTENTE UMANO:** Gli esempi seguenti servono come ispirazione per scrivere la tua strategia. Sostituisci questo intero blocco di testo, inclusi gli esempi, con la tua strategia specifica prima di inviare il prompt.
> >
> > - **Esempio 1: Cecchino Difensivo:** "Crea un bot 'cecchino' difensivo. La sua priorità è trovare un buon punto di copertura (preferibilmente un angolo dell'arena), rimanere fermo e sparare solo a nemici a lunga distanza. Deve avere uno stato `FINDING_COVER` per la ricerca iniziale e uno stato `REPOSITIONING` per fuggire e trovare una nuova copertura se un nemico si avvicina troppo (es. a meno di 200 pixel) o se la sua linea di tiro è costantemente bloccata."
> >
> > - **Esempio 2: Aggressore Implacabile (Brawler):** "Crea un bot iper-aggressivo. Non deve mai ritirarsi o evadere. La sua unica strategia è avvicinarsi il più possibile al nemico (`ATTACKING`) e sparare continuamente. Se perde di vista il nemico (`SEARCHING`), deve immediatamente dirigersi verso la sua ultima posizione nota. Ignora la gestione della batteria e le collisioni (le transizioni globali possono essere vuote)."
> >
> > - **Esempio 3: Tattico degli Ostacoli:** "Crea un bot che sfrutta gli ostacoli. Deve avere uno stato `AMBUSHING` in cui si nasconde dietro un ostacolo vicino alla posizione del nemico, attendendo che il nemico si avvicini prima di attaccare. Quando viene colpito (`EVADING`), la sua priorità è trovare un altro ostacolo dietro cui nascondersi. Il movimento in campo aperto deve essere ridotto al minimo."

---

### 7. Processo di Generazione e Auto-Valutazione Obbligatorio

Prima di generare l'output finale, devi seguire **internamente** questo rigoroso processo di ragionamento e auto-valutazione.

**Passo 1: Analisi.** Comprendi la strategia.
**Passo 2: Progettazione.** Definisci mentalmente gli stati e le transizioni.
**Passo 3: Scrittura.** Implementa la FSM.
**Passo 4: Revisione Critica.** Riesamina il codice ponendoti queste domande:

1.  **Strategia vs. Esempio:** Il mio codice risolve il problema strategico della missione, o ho semplicemente copiato un pattern dall'esempio che causa un comportamento errato (come l'oscillazione di stato)?
2.  **Correttezza di `this`:** Ho evitato le arrow functions per i metodi che accedono a `this.config`?
3.  **Regola di `aimAt`:** Ho separato chiaramente le fasi di movimento da quelle di mira?
4.  **Conflitti tra Stati:** Le mie transizioni a bassa priorità sono protette per non interrompere stati critici?
5.  **Anti-Pattern Evitati:** Ho considerato l'oscillazione, la gestione della memoria e le collisioni?
6.  **API e Struttura:** Ho usato solo l'API fornita, `getRandomPoint`, e ho lasciato intatto il motore FSM?

**Passo 5: Produzione Finale.** Dopo la revisione, genera come output **solo e unicamente** il blocco di codice JavaScript finale.
