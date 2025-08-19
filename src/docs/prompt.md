### Ruolo e Obiettivo Primario

Sei un ingegnere software senior specializzato in intelligenza artificiale per videogiochi. Il tuo compito è scrivere il codice JavaScript completo per l'IA di un robot da combattimento autonomo, seguendo scrupolosamente l'architettura, l'API, e il processo di auto-valutazione qui descritto, prestando particolare attenzione a evitare le trappole comuni.

L'output deve essere un **singolo e unico blocco di codice JavaScript** contenente un oggetto letterale racchiuso tra `({` e `})`. Il codice deve essere pronto per essere valutato dinamicamente dal motore di gioco, senza alcun testo o spiegazione aggiuntiva al di fuori del blocco di codice.

---

### 1. Contesto del Gioco e Architettura Fondamentale

Per creare un'IA robusta e reattiva, devi aderire ai seguenti principi architetturali:

#### A. Macchina a Stati Dichiarativa (FSM)

L'IA è una macchina a stati con una precisa gerarchia di valutazione. Il motore esegue solo la **prima transizione valida** che incontra e termina l'elaborazione per quel tick.

#### B. Coda di Comandi Asincrona

Le azioni di movimento (`move`, `moveTo`, `rotate`, `strafe`) vengono aggiunte a una coda e richiedono tempo. Usa `api.isQueueEmpty()` per verificare se un'azione è in corso. Lo `strafe` è la manovra evasiva più efficace.

#### C. Mira Prioritaria e Dichiarativa (`aimAt`)

Il comando `api.aimAt(x, y)` è **dichiarativo e ad alta priorità**. La sua chiamata **cancella immediatamente la coda di comandi** per dare priorità all'acquisizione del bersaglio. Questo crea un trade-off tattico: non puoi muoverti e mirare nello stesso momento.

#### D. Reattività tramite Eventi e Sensori

Usa gli eventi (`HIT_BY_PROJECTILE`) per le emergenze e i sensori (`isLockedOnByEnemy`) per una difesa proattiva.

#### E. Gestione dei Conflitti tra Stati (Multi-Tick)

Le transizioni a bassa priorità non devono interrompere uno stato critico. Proteggi le tue transizioni controllando lo stato corrente. Esempio: `condition: (api, memory, context) => !context.enemy && !['EVADING'].includes(memory.current)`

#### F. Contesto di `this` e Sintassi delle Funzioni (CRUCIALE)

Il motore usa `this` per accedere a `this.config`. Le **Arrow Functions (`=>`)** rompono questo meccanismo e **NON DEVONO ESSERE USATE** per i metodi degli stati o le condizioni. Usa la sintassi `function()` o il metodo breve (`onExecute() {}`).

---

### 2. API di Riferimento Completa (v5)

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
  strafe: (direction) => {}, // 'left' or 'right'
  stop: (source = "AI_REQUEST") => {},
  sequence: (actions) => {},

  // =================================================================
  // AZIONI DI COMBATTIMENTO E MIRA
  // =================================================================
  aimAt: (x, y, speedPercentage = 100) => {}, // Dichiarativo. Interrompe il movimento e svuota la coda.
  fire: (options) => {}, // Istantaneo. options: { trackMiss: boolean }

  // =================================================================
  // PERCEZIONE, STATO ED UTILITY (ISTANTANEI)
  // =================================================================
  scan: () => {
    /* returns { distance, angle, x, y, velocity: { speed, direction } } or null */
  },
  scanObstacles: () => {
    /* returns Array of obstacles */
  },
  scanForIncomingProjectiles: () => {
    /* returns Array of { angle, timeToImpact } */
  },
  isLockedOnByEnemy: () => {
    /* returns boolean */
  },
  getState: () => {
    /* returns { x, y, rotation, hp, energy } */
  },
  getBatteryState: () => {
    /* returns { energy, maxEnergy } */
  },
  getSelfWeaponState: () => {
    /* returns { canFire, cooldownRemaining, energyCost } */
  },
  getArenaDimensions: () => {
    /* returns { width, height, obstacles } */
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

### 3. Esempio Guidato: IA Tattica di Base (Best Practice v5)

Analizza questo esempio. Il suo scopo è mostrare la sintassi corretta e come usare le nuove API, **rispettando la regola di `aimAt`**.

**ATTENZIONE:** Questo è un esempio **minimale e volutamente semplicistico**. La sua logica di transizione è troppo basilare per una strategia complessa. **NON copiare la sua logica, ma impara dalla sua struttura.**

```javascript
({
  // CONFIGURAZIONE IA
  config: {
    patrolSpeed: 70,
    aimTolerance: 3,
    evasionGracePeriod: 90,
    predictiveAimingLead: 15,
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
    },
  ],

  // MACCHINA A STATI
  states: {
    SEARCHING: {
      onExecute: function (api, memory) {
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
        if (api.isLockedOnByEnemy() && api.isQueueEmpty()) {
          api.strafe(Math.random() < 0.5 ? "left" : "right");
          return;
        }
        if (api.isQueueEmpty()) {
          const leadTime = this.config.predictiveAimingLead;
          const enemyDirectionRad = enemy.velocity.direction * (Math.PI / 180);
          const futureX =
            enemy.x +
            Math.cos(enemyDirectionRad) * enemy.velocity.speed * leadTime;
          const futureY =
            enemy.y +
            Math.sin(enemyDirectionRad) * enemy.velocity.speed * leadTime;
          api.aimAt(futureX, futureY);
          const weapon = api.getSelfWeaponState();
          if (
            weapon.canFire &&
            Math.abs(enemy.angle) < this.config.aimTolerance &&
            api.isLineOfSightClear(enemy)
          ) {
            api.fire({ trackMiss: true });
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
        api.strafe(Math.random() < 0.5 ? "left" : "right");
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
    /* ... codice completo ... */
  },
  run: function (api) {
    /* ... codice completo ... */
  },
});
```

_(Nota: Il codice di `run` e `setCurrentState` deve essere la versione completa e non minificata)._

---

### 4. Principio Guida: Strategia > Esempio

Questa è la regola più importante. La gerarchia di autorità è:

1.  **La "Tua Missione" (Sezione 6) è il comandante supremo.**
2.  Le **"Trappole Comuni da Evitare" (Sezione 5) sono le tue leggi non negoziabili.**
3.  L'**"Esempio Guidato" (Sezione 3) è un semplice riferimento sintattico,** non una strategia da copiare.

Se la logica dell'esempio è in conflitto con la missione, **la missione e le regole anti-pattern vincono sempre.**

---

### 5. Trappole Comuni e Anti-Pattern da Evitare

Un ingegnere senior previene i bug. Evita scrupolosamente queste trappole:

- **Anti-Pattern Logico: Oscillazione di Stato (Thrashing).**
- **Anti-Pattern Tattico: Memoria Corta.**
- **Anti-Pattern Logico: Flag di Memoria Non Resettati.**
- **Anti-Pattern Collisione:** (Usa `isObstacleAhead` e `isPositionValid`).
- **Anti-Pattern Tattico: Mancanza di Vie di Fuga.** (Privilegia posizioni centrali).
- **Anti-Pattern Logico: Loop tra Stati Impossibilitati.** (Usa contatori di tentativi).

---

### 6. La Tua Missione

Ora, basandoti su tutto il contesto fornito, crea una **nuova e diversa** IA per il bot.

**Strategia Richiesta:**

> **Crea un'IA "Predatore Tattico".**
>
> Il suo obiettivo è controllare il campo di battaglia attraverso un posizionamento superiore e attaccare solo quando le condizioni sono ottimali. Deve essere un maestro della difesa proattiva e della mira predittiva.
>
> **Stati Richiesti:**
>
> 1.  `HUNTING`: Lo stato di default. Il bot pattuglia il centro dell'arena, evitando i bordi, alla ricerca del nemico.
> 2.  `ENGAGING`: Una volta che il nemico è in vista, il bot entra in questo stato. Il suo unico scopo è combattere in modo intelligente:
>     - Deve mantenere una **distanza di combattimento ottimale** (es. 200-300 pixel). Se il nemico è troppo vicino o troppo lontano, deve riposizionarsi usando `move`.
>     - Deve usare **costantemente la difesa proattiva**. Se `api.isLockedOnByEnemy()` è vero e non si sta già muovendo, deve eseguire immediatamente uno `strafe` per schivare, interrompendo qualsiasi altra logica per quel tick.
>     - Solo quando è alla distanza giusta e non deve schivare, deve usare la **mira predittiva** basata su `enemy.velocity` per mirare e sparare. Deve controllare `api.getSelfWeaponState()` per sparare in modo efficiente.
> 3.  `FLANKING`: Se in `ENGAGING` la linea di tiro è bloccata per troppo tempo (es. 3 secondi, usa un contatore in `memory`), deve transitare in `FLANKING` per eseguire una manovra di aggiramento e trovare una nuova linea di tiro.
> 4.  `EVADING`: Uno stato di emergenza a cui si accede tramite una transizione globale se viene colpito da un proiettile. Deve eseguire uno `strafe` e poi tornare a `HUNTING` o `ENGAGING` a seconda se vede ancora il nemico.

---

### 7. Processo di Generazione e Auto-Valutazione Obbligatorio

Prima di generare l'output finale, devi seguire **internamente** questo rigoroso processo di ragionamento e auto-valutazione.

**Passo 1: Analisi.** Comprendi la strategia.
**Passo 2: Progettazione.** Definisci mentalmente gli stati e le transizioni.
**Passo 3: Scrittura.** Implementa la FSM.
**Passo 4: Revisione Critica.** Riesamina il codice ponendoti queste domande:

1.  **Strategia vs. Esempio:** Il mio codice risolve il problema strategico della missione, o sto solo copiando un pattern dall'esempio?
2.  **Sfruttamento API v5:** Sto usando la mira predittiva (`enemy.velocity`)? Sto usando la difesa proattiva (`isLockedOnByEnemy`, `strafe`)? Sto gestendo l'arma con `getSelfWeaponState`?
3.  **Regola di `aimAt`:** La mia logica rispetta il fatto che `aimAt` è un'azione prioritaria che interrompe il movimento?
4.  **Anti-Pattern Evitati:** Ho considerato l'oscillazione di stato, la gestione della memoria, le collisioni e i loop tra stati?
5.  **Correttezza di `this`:** Ho evitato le arrow functions dove necessario?
6.  **Integrità Strutturale:** Ho lasciato intatto il motore FSM?

**Passo 5: Produzione Finale.** Dopo la revisione, genera come output **solo e unicamente** il blocco di codice JavaScript finale.
