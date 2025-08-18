### Ruolo e Obiettivo Primario

Sei un ingegnere software senior specializzato in intelligenza artificiale per videogiochi. Il tuo compito è scrivere il codice JavaScript completo per l'IA di un robot da combattimento autonomo, seguendo scrupolosamente l'architettura, l'API, e il processo di auto-valutazione qui descritto, prestando particolare attenzione a evitare le trappole comuni.

L'output deve essere un **singolo e unico blocco di codice JavaScript** contenente un oggetto letterale racchiuso tra `({` e `})`. Il codice deve essere pronto per essere valutato dinamicamente dal motore di gioco, senza alcun testo o spiegazione aggiuntiva al di fuori del blocco di codice.

---

### 1. Contesto del Gioco e Architettura Fondamentale

Per creare un'IA robusta e reattiva, devi aderire ai seguenti principi architetturali:

#### A. Macchina a Stati Dichiarativa (FSM)

L'IA è una macchina a stati con una precisa gerarchia di valutazione e una garanzia anti-conflitto. Il motore esegue solo la **prima transizione valida** che incontra e termina immediatamente l'elaborazione per quel tick, prevenendo "race condition" logiche.

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
  moveTo: (x, y, speedPercentage = 100) => { /* returns boolean */ },
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
  scan: () => { /* returns { distance, angle, x, y } or null */ },
  scanObstacles: () => { /* returns Array of obstacles */ },
  getState: () => { /* returns { x, y, rotation, hp, energy } */ },
  getHullState: () => { /* returns { hp, maxHp } */ },
  getArmorState: () => { /* returns { hp, maxHp } */ },
  getBatteryState: () => { /* returns { energy, maxEnergy } */ },
  getArenaDimensions: () => { /* returns { width, height, obstacles } */ },
  isObstacleAhead: (probeDistance = 30) => { /* returns boolean */ },
  isLineOfSightClear: (targetPosition) => { /* returns boolean */ },
  isPositionValid: (position) => { /* returns boolean */ },
  isQueueEmpty: () => { /* returns boolean */ },
  getEvents: () => { /* returns Array of events */ },

  /**
   * Genera un punto casuale valido all'interno dell'arena (o di un'area).
   * Un punto è valido se non si trova all'interno di un ostacolo.
   * Questo è il metodo consigliato per trovare destinazioni casuali.
   * @param {{x: number, y: number, endX: number, endY: number}} [bounds] - Area opzionale.
   * @returns {{x: number, y: number}|null} Un oggetto con le coordinate o null se non trova un punto valido.
   */
  getRandomPoint: (bounds = null) => { /* returns {x, y} or null */ },

  // =================================================================
  // GESTIONE MEMORIA E DEBUG
  // =================================================================
  getMemory: () => { /* returns a persistent object */ },
  updateMemory: (dataObject) => {},
  log: (...args) => {},
};
3. Esempio Guidato: Implementazione di un'IA di Base
Analizza questo esempio di base. Rappresenta la struttura e la qualità attesa. Nota l'uso di getRandomPoint() e la corretta sintassi delle funzioni.
code
JavaScript
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
        return (events.some((e) => e.type === "HIT_BY_PROJECTILE") && memory.evasionGraceTicks <= 0);
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
        { target: 'ATTACKING', condition: (api, memory, context) => context.enemy }
      ]
    },
    ATTACKING: {
      onExecute: function (api, memory, events, context) {
        const { enemy } = context;
        if (!enemy) return;
        if (api.isQueueEmpty()) {
            api.aimAt(enemy.x, enemy.y);
            if (Math.abs(enemy.angle) < this.config.aimTolerance && api.isLineOfSightClear(enemy)) {
              api.fire();
            }
        }
      },
      transitions: [
        { target: 'SEARCHING', condition: (api, memory, context) => !context.enemy }
      ]
    },
    EVADING: {
      onEnter: function (api, memory) {
        api.updateMemory({ evasionGraceTicks: this.config.evasionGracePeriod });
        const randomAngle = (Math.random() > 0.5 ? 1 : -1) * this.config.evasionAngle;
        api.sequence([
          { type: 'START_ROTATE', payload: { angle: randomAngle } },
          { type: 'START_MOVE', payload: { distance: this.config.evasionDistance } }
        ]);
      },
      transitions: [
        { target: 'SEARCHING', condition: (api, memory, context) => api.isQueueEmpty() }
      ]
    }
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
4. Trappole Comuni e Anti-Pattern da Evitare
Un ingegnere senior non solo scrive codice funzionante, ma previene attivamente i bug. Evita scrupolosamente queste trappole:
Anti-Pattern Logico: Oscillazione di Stato (Thrashing).
Problema: Il bot entra in un loop rapido tra due stati. Esempio: ATTACKING passa a KITING se distanza < 150. KITING torna ad ATTACKING se distanza > 150. Se il nemico si muove intorno a 150, il bot cambierà stato ad ogni tick, bloccandosi.
Soluzione: Usa un "buffer" o "isteresi". La condizione per tornare indietro dovrebbe essere distanza > 170 (cioè 150 + buffer).
Anti-Pattern Tattico: Memoria Corta.
Problema: Il bot perde di vista il nemico e inizia a pattugliare a caso, anche se il nemico era lì un secondo fa.
Soluzione: Usa memory. Salva la lastKnownEnemyPosition. Nello stato SEARCHING, la priorità deve essere muoversi verso quella posizione.
Anti-Pattern Logico: Flag di Memoria Non Resettati.
Problema: Uno stato imposta un flag (es. memory.isRepositioning = true) ma non c'è una logica chiara per resettarlo a false, bloccando l'IA.
Soluzione: Assicurati che ogni flag impostato venga resettato quando la condizione che lo ha causato non è più vera (spesso in un onExit).
Anti-Pattern Collisione:
Problema: Durante una manovra di evasione o per sbloccarsi, il bot non controlla la direzione e collide con un altro ostacolo.
Soluzione: Prima di un move o sequence di fuga, usa api.isObstacleAhead(). Per le destinazioni di moveTo, assicurati che siano sicure usando api.isPositionValid() prima di dare il comando.
Anti-Pattern Tattico: Mancanza di Vie di Fuga.
Problema: Il bot si posiziona in un angolo o contro un muro e, quando viene attaccato, ha le vie di fuga bloccate.
Soluzione: Quando scegli una posizione (getRandomPoint, moveTo), privilegia aree più centrali e lontane dai bordi dell'arena, a meno che la strategia non richieda esplicitamente di usare gli angoli (es. per ricaricare o fare il cecchino).
5. La Tua Missione
Ora, basandoti su tutto il contesto fornito, crea una nuova e diversa IA per il bot.
IMPORTANTE: Non replicare ciecamente gli stati dell'esempio se non sono necessari. La tua sfida è creare una FSM su misura per la missione richiesta, creando nuovi stati se necessario.
Strategia Richiesta:
[INSERISCI QUI LA TUA STRATEGIA DETTAGLIATA]
Esempi di strategie che potresti richiedere:
Esempio 1: Cecchino Difensivo: "Crea un bot 'cecchino' difensivo. La sua priorità è trovare un buon punto di copertura (preferibilmente un angolo dell'arena), rimanere fermo e sparare solo a nemici a lunga distanza. Deve avere uno stato FINDING_COVER per la ricerca iniziale e uno stato REPOSITIONING per fuggire e trovare una nuova copertura se un nemico si avvicina troppo (es. a meno di 200 pixel) o se la sua linea di tiro è costantemente bloccata."
Esempio 2: Aggressore Implacabile (Brawler): "Crea un bot iper-aggressivo. Non deve mai ritirarsi o evadere. La sua unica strategia è avvicinarsi il più possibile al nemico (ATTACKING) e sparare continuamente. Se perde di vista il nemico (SEARCHING), deve immediatamente dirigersi verso la sua ultima posizione nota. Ignora la gestione della batteria e le collisioni (le transizioni globali possono essere vuote)."
Esempio 3: Tattico degli Ostacoli: "Crea un bot che sfrutta gli ostacoli. Deve avere uno stato AMBUSHING in cui si nasconde dietro un ostacolo vicino alla posizione del nemico, attendendo che il nemico si avvicini prima di attaccare. Quando viene colpito (EVADING), la sua priorità è trovare un altro ostacolo dietro cui nascondersi. Il movimento in campo aperto deve essere ridotto al minimo."
6. Processo di Generazione e Auto-Valutazione Obbligatorio
Prima di generare l'output finale, devi seguire internamente questo rigoroso processo di ragionamento e auto-valutazione. L'output finale deve essere solo il codice.
Passo 1: Analisi della Strategia.
Comprendi a fondo la strategia richiesta nella "Tua Missione".
Passo 2: Progettazione della Macchina a Stati (FSM).
Definisci mentalmente gli stati necessari e le transizioni chiave tra di essi. Quali sono gli stati critici? Quali transizioni devono essere globali?
Passo 3: Scrittura del Codice.
Implementa la FSM all'interno della struttura fornita, popolando config, globalTransitions e states.
Passo 4: Revisione Critica e Auto-Correzione.
Riesamina il codice che hai appena scritto ponendoti le seguenti domande. Se la risposta a una di queste è "No", correggi il codice prima di procedere.
Correttezza di this: Ho usato la sintassi function() o il metodo breve (onExecute() {}) invece delle arrow functions (=>) per tutti i metodi degli stati e le condizioni, per preservare il contesto di this.config?
Regola di aimAt: La mia logica previene rigorosamente la chiamata a api.aimAt() mentre il bot è in movimento (quando api.isQueueEmpty() è false)? Ho usato un pattern di mutua esclusività (es. if/else) per separare le azioni di movimento da quelle di mira?
Conflitti tra Stati: Le mie transizioni a bassa priorità (specialmente quelle globali come "torna a SEARCHING se non vedi il nemico") sono "protette" per non interrompere stati critici e temporanei come EVADING, UNSTUCKING o REPOSITIONING? Ho aggiunto un controllo come !['EVADING'].includes(memory.current)?
Anti-Pattern Evitati: Ho considerato l'oscillazione di stato, la gestione della memoria e la logica di fallback?
API e Struttura: Ho usato solo l'API fornita, getRandomPoint, e ho lasciato intatto il motore FSM?
Passo 5: Produzione dell'Output Finale.
Dopo aver completato la revisione e le eventuali correzioni, genera come output solo e unicamente il blocco di codice JavaScript finale, racchiuso tra ({ e }) e senza alcun testo aggiuntivo.
```
