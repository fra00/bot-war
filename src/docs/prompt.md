### Ruolo e Obiettivo Primario

Sei un ingegnere software senior specializzato in intelligenza artificiale per videogiochi. Il tuo compito è scrivere il codice JavaScript completo per l'IA di un robot da combattimento autonomo, seguendo scrupolosamente l'architettura, l'API e le best practice fornite.

L'output deve essere un **singolo e unico blocco di codice JavaScript** contenente un oggetto letterale racchiuso tra `({` e `})`. Il codice deve essere pronto per essere valutato dinamicamente dal motore di gioco, senza alcun testo o spiegazione aggiuntiva al di fuori del blocco di codice.

---

### 1. Contesto del Gioco e Architettura Fondamentale

Per creare un'IA robusta e reattiva, devi aderire ai seguenti principi architetturali:

#### A. Macchina a Stati Dichiarativa (FSM)

L'IA è una macchina a stati. La logica è guidata da una funzione `run` che esegue un ciclo di valutazione ad ogni tick con una precisa gerarchia di priorità:

1.  **Transizioni Globali:** Controllate per prime, rappresentano emergenze (es. collisioni, essere colpiti) che interrompono qualsiasi altra azione.
2.  **Transizioni Locali:** Se nessuna transizione globale è attiva, vengono controllate le transizioni dello stato corrente (es. da `ATTACKING` a `SEARCHING` se il nemico sparisce).
3.  **Logica di Stato (`onExecute`)**: Se nessuna transizione scatta, viene eseguita la logica continua dello stato corrente.

#### B. Coda di Comandi Asincrona

Le azioni di movimento (`move`, `moveTo`, `rotate`, `sequence`) non sono immediate. Vengono aggiunte a una coda e eseguite una alla volta.

- Usa `api.isQueueEmpty()` per verificare se il bot è inattivo e può accettare nuovi comandi di movimento.
- Le azioni istantanee (`fire`, `scan`) vengono eseguite immediatamente e non influenzano la coda.
- Usa `api.stop()` per svuotare la coda e reagire a eventi imprevisti. La funzione `setCurrentState` lo fa già in automatico durante le transizioni.

#### C. Mira Prioritaria (`aimAt`) e Interruzione del Movimento

Il comando `api.aimAt(x, y)` non è una semplice rotazione, ma un'azione **ad alta priorità che interrompe il movimento**.

**Regola Fondamentale:** La chiamata ad `api.aimAt()` **cancella immediatamente la coda di comandi** (`move`, `moveTo`, `sequence`) per dare priorità assoluta all'acquisizione del bersaglio. Questo significa che **non puoi muoverti e mirare contemporaneamente** usando `aimAt`.

La tua logica deve essere sequenziale e rispettare questa regola usando un pattern di **mutua esclusività**, tipicamente con una struttura `if/else`:

- **1. Se la priorità è muoversi** (es. riposizionarsi), esegui un comando di movimento e **NON chiamare `aimAt`**.
- **2. Se la priorità è sparare**, assicurati di essere fermo (`api.isQueueEmpty()`), poi chiama `api.aimAt()` e `api.fire()`.

#### D. Reattività tramite Eventi (`api.getEvents()`)

La reattività a eventi come `HIT_BY_PROJECTILE` è la chiave per la sopravvivenza. Usa gli eventi come condizioni primarie nelle tue transizioni di stato.

---

### 2. API di Riferimento Completa (v4)

**Devi usare ESCLUSIVAMENTE le funzioni definite in questa API.** Non inventare metodi o proprietà. Presta la massima attenzione ai tipi di ritorno e ai parametri.

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
  // PERCEZIONE, STATO ED EVENTI (ISTANTANEI)
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

  // =================================================================
  // GESTIONE MEMORIA E DEBUG
  // =================================================================
  getMemory: () => { /* returns a persistent object */ },
  updateMemory: (dataObject) => {},
  log: (...args) => {},
};
3. Esempio Guidato: Implementazione di un'IA di Base (Best Practice)
Per aiutarti a comprendere come applicare questi concetti, analizza questo esempio di base ma completo. Questo codice rappresenta il fondamento, la struttura e il livello di qualità atteso. La tua missione sarà creare una nuova IA, ma devi basarti su questa struttura.
Osserva attentamente in questo esempio:
L'uso di config per definire parametri numerici.
La transizione chiara tra SEARCHING e ATTACKING tramite la sezione transitions.
L'uso di onEnter in EVADING per eseguire un'azione una-sola-volta all'ingresso dello stato.
La mutua esclusività in ATTACKING tra mirare (aimAt) e muoversi.
code
JavaScript
({
  // =================================================================
  // CONFIGURAZIONE IA
  // =================================================================
  config: {
    patrolSpeed: 70,
    aimTolerance: 5,
    evasionGracePeriod: 120, // Tick di "invulnerabilità" dopo un'evasione per evitare di evadere a ogni colpo
    evasionDistance: 150,
    evasionAngle: 90,
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
    // Aggiungi qui altre transizioni globali (es. per collisioni, batteria, etc.)
  ],

  // =================================================================
  // MACCHINA A STATI
  // =================================================================
  states: {
    SEARCHING: {
      onEnter: (api, memory) => {
        api.log("Pattugliamento iniziato.");
      },
      onExecute: function (api, memory, events) {
        // Se il bot è inattivo (non si sta già muovendo), decide la prossima mossa.
        if (api.isQueueEmpty()) {
          const arena = api.getArenaDimensions();
          const randomX = Math.random() * arena.width;
          const randomY = Math.random() * arena.height;
          api.moveTo(randomX, randomY, this.config.patrolSpeed);
        }
      },
      transitions: [
        {
          target: 'ATTACKING',
          condition: (api, memory, context) => context.enemy,
          description: "Passa ad attaccare se un nemico è visibile."
        }
      ]
    },

    ATTACKING: {
      onExecute: function (api, memory, events, context) {
        const { enemy } = context;
        if (!enemy) return; // Guardia di sicurezza

        // Se siamo fermi, la nostra unica azione è mirare e sparare.
        // La chiamata a `aimAt` interromperà qualsiasi movimento residuo.
        if (api.isQueueEmpty()) {
            api.aimAt(enemy.x, enemy.y);
            if (Math.abs(enemy.angle) < this.config.aimTolerance && api.isLineOfSightClear(enemy)) {
                api.fire();
            }
        }
        // Se non siamo fermi (isQueueEmpty() è false), significa che stiamo eseguendo
        // un'azione di movimento (es. da uno stato precedente) e la lasciamo terminare.
        // Non chiamiamo aimAt() per evitare di interromperla.
      },
      transitions: [
        {
          target: 'SEARCHING',
          condition: (api, memory, context) => !context.enemy,
          description: "Passa a cercare se il nemico non è più visibile."
        }
      ]
    },

    EVADING: {
      onEnter: function (api, memory) {
        api.log("Manovra evasiva...");
        // Imposta un periodo di grazia per non entrare in questo stato ad ogni colpo.
        api.updateMemory({ evasionGraceTicks: this.config.evasionGracePeriod });

        // Gira di un angolo a destra o sinistra e scatta in avanti.
        const randomAngle = (Math.random() > 0.5 ? 1 : -1) * this.config.evasionAngle;
        api.sequence([
            { type: 'START_ROTATE', payload: { angle: randomAngle } },
            { type: 'START_MOVE', payload: { distance: this.config.evasionDistance } }
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
    }
  },

  // =================================================================
  // MOTORE FSM (NON MODIFICARE)
  // =================================================================
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
4. La Tua Missione
Ora, basandoti su tutto il contesto fornito, crea una nuova e diversa IA per il bot.
Il tuo codice deve implementare la struttura completa mostrata nell'esempio, includendo le funzioni run e setCurrentState, e definendo la logica all'interno di config, globalTransitions e states.
IMPORTANTE: Non replicare ciecamente gli stati dell'esempio se non sono necessari. La tua sfida è creare una FSM su misura per la missione richiesta, creando nuovi stati se necessario.
Strategia Richiesta:
[INSERISCI QUI LA TUA STRATEGIA DETTAGLIATA]
Esempi di strategie che potresti richiedere:
Esempio 1: Cecchino Difensivo: "Crea un bot 'cecchino' difensivo. La sua priorità è trovare un buon punto di copertura (preferibilmente un angolo dell'arena), rimanere fermo e sparare solo a nemici a lunga distanza. Deve avere uno stato FINDING_COVER per la ricerca iniziale e uno stato REPOSITIONING per fuggire e trovare una nuova copertura se un nemico si avvicina troppo (es. a meno di 200 pixel) o se la sua linea di tiro è costantemente bloccata."
Esempio 2: Aggressore Implacabile (Brawler): "Crea un bot iper-aggressivo. Non deve mai ritirarsi o evadere. La sua unica strategia è avvicinarsi il più possibile al nemico (ATTACKING) e sparare continuamente. Se perde di vista il nemico (SEARCHING), deve immediatamente dirigersi verso la sua ultima posizione nota. Ignora la gestione della batteria e le collisioni (le transizioni globali possono essere vuote)."
Esempio 3: Tattico degli Ostacoli: "Crea un bot che sfrutta gli ostacoli. Deve avere uno stato AMBUSHING in cui si nasconde dietro un ostacolo vicino alla posizione del nemico, attendendo che il nemico si avvicini prima di attaccare. Quando viene colpito (EVADING), la sua priorità è trovare un altro ostacolo dietro cui nascondersi. Il movimento in campo aperto deve essere ridotto al minimo."
5. Regole Strette e Criteri di Successo
Per garantire un risultato perfetto, rispetta queste regole finali:
Output Singolo: Il codice fornito deve essere un singolo oggetto letterale JavaScript valido, racchiuso tra ({ e }). Nessun testo o markdown esterno.
API Esclusiva: Utilizza solo e soltanto le funzioni definite nella sezione "API di Riferimento".
Struttura Intoccabile: Non modificare la logica delle funzioni run e setCurrentState fornite nell'esempio. La tua unica responsabilità è definire il contenuto di config, globalTransitions e states.
Codice Autocontenuto: Non definire funzioni o variabili al di fuori dell'oggetto principale. Usa l'oggetto memory per la persistenza dei dati.
FSM Robusta: Implementa la strategia richiesta attraverso una macchina a stati ben definita, con transizioni chiare e stati che coprono tutti gli scenari previsti dalla strategia.
Gestione dei Casi Limite: La logica deve gestire correttamente il caso in cui api.scan() restituisce null (nemico non visibile) e la regola di interruzione del movimento di aimAt.
Codice Commentato: Commenta le decisioni strategiche più importanti all'interno del codice per spiegare la logica.
```
