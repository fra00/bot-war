### **Indice del Prompt**

Questo prompt è strutturato per guidarti passo dopo passo. Consulta questo indice per comprendere la struttura del documento prima di procedere.

1.  **Contesto e Obiettivo:** La tua persona e lo scopo della tua missione.
2.  **Architettura Obbligatoria:** La struttura della Macchina a Stati (FSM) da utilizzare.
3.  **Vincoli Tecnici e Architetturali:** Le regole inviolabili del sistema che devi rispettare.
4.  **Pattern di Codifica Robusta:** Gli schemi di implementazione obbligatori per garantire la resilienza.
5.  **Documentazione API di Riferimento:** La specifica completa delle funzioni disponibili.
6.  **Scaffolding del Codice:** Il template di codice che devi completare.
7.  **Richiesta Specifica:** Il comportamento esatto dell'IA che devi implementare.
8.  **Criteri di Successo:** I criteri che devi rispettare per il massimo successo del tuo bot.
9.  **Criteri di Autovalutazione e Revisione Finale:** La checklist di revisione che devi eseguire prima di fornire la risposta.

---

### **SEZIONE 1: Contesto e Obiettivo**

Sei un programmatore d'elite specializzato in IA per competizioni di robotica. Il tuo compito è scrivere il codice sorgente completo in JavaScript per un bot da combattimento autonomo, seguendo scrupolosamente tutte le sezioni di questo documento. Il codice deve essere un singolo oggetto JavaScript, autocontenuto e senza dipendenze esterne.
Dopo aver generato il codice, dovrai eseguire la rigorosa autovalutazione descritta nella Sezione 9.

### **SEZIONE 2: Architettura Obbligatoria: Macchina a Stati Dichiarativa**

Devi implementare la logica dell'IA **completando uno scaffolding predefinito (Sezione 6)**. L'architettura è una Macchina a Stati (FSM) con una gerarchia decisionale stratificata. Il tuo compito è definire la logica specifica per costruire i vari stati e le transizioni(`config`, `globalTransitions`, `states`).

### **SEZIONE 3: Vincoli Tecnici e Architetturali (Da seguire scrupolosamente)**

1.  **Codice Autocontenuto e Struttura dei Metodi:**

    - L'intero script deve essere un singolo oggetto letterale `({ ... })` [è un requisito del motore di gioco].
    - **Posizionamento Corretto:** I metodi helper (es. `_nomeMetodo`) devono essere definiti nella `SEZIONE 3: METODI HELPER`, allo stesso livello di `config`, `states`, e `run`. [Questo permette di invocarli da qualsiasi punto della FSM (come `onEnter` o `onExecute`) usando `this._nomeMetodoHelper(...)`, `this` è l'oggetto principale del bot] - **Divieto di Funzioni Annidate:** È severamente **vietato** definire un metodo helper _all'interno di un oggetto stato_. [Questo romperebbe il contesto `this` e causerebbe errori di runtime]

2.  **Sintassi delle Funzioni e Contesto `this`:** È **obbligatorio** utilizzare la sintassi `function(...) { ... }` per tutti i metodi della FSM. **NON USARE FUNZIONI LAMBDA (`=>`)**. [garantisce il corretto funzionamento della macchina a stati].

3.  **Struttura degli stati e Trasizioni:**
    - Le **Transizioni** (`condition`) decidono **SE** cambiare stato.
      ```
      {
        target: "TRANSITION_NAME",
        condition: (api, memory, context, events) =>
          events.some(
            (e) => true //condizione
          ),
        description: "Description tglobal transition",
      },
      ```
    - Gli stati
      - `onEnter` **inizializza** lo stato (eseguito solo all'accesso dello stato 1 volta).
      - `onExecute` esegue le **azioni continue** dello stato (ripetuto ad ogni tick fino al cambio dello stato).
      - `onExit` esegue le azioni di pulizia dello stato (eseguito solo quando si esce dallo stato prima di chiamare il prossimo stato 1 volta)
      ```
      NOME_STATO: {
        onEnter(api, memory) {
          //logica inizializzazione stato
        },
        onExecute(api, memory, events, context) {
          // Logica ad ogni tick
        },
        onExit(api, memory) {
          // Logica pulizia prima di cambio stato.
        },
        transitions: [
          {
            target: "..."
            condition: (api, memory, context, events) =>
             ...
            description: "...",
          },
        ],
      },
      ```
4.  **Transizioni Idempotenti:** Per prevenire loop in cui una transizione si riattiva all'infinito, la sua condizione deve sempre verificare di non essere _già_ nello stato di destinazione.

    - **Esempio Corretto:** `condition: function(api, memory, context) { return memory.current !== 'ATTACKING' && context.enemy; }`
    - **Esempio Errato:** `condition: function(api, memory, context) { return context.enemy; }`

5.  **Gestione Centralizzata dello `stop()`:** Il motore della FSM (la funzione `setCurrentState` nello scaffolding) chiama automaticamente `api.stop()` ad ogni cambio di stato per garantire una situazione pulita ("politica della tabula rasa").
    - **Divieto Esplicito:** Di conseguenza, è **severamente vietato** chiamare `api.stop()` manualmente all'interno della logica degli stati (`onEnter`, `onExecute`, `onExit`). [Farlo cancellerebbe prematuramente le azioni accodate e causerebbe un comportamento errato].

### **SEZIONE 4: Pattern di Codifica Robusta (Implementazione Obbligatoria)**

1.  **Principio di Singola Responsabilità per Stato (SRP):** Ogni stato deve avere una sola, chiara responsabilità. Non mescolare logiche diverse in un unico stato.

    - **Esempio:** Lo stato `ATTACKING` si occupa solo di attaccare (mirare, sparare, mantenere la distanza).
      NON deve contenere logica per schivare proiettili o sbloccarsi da una collisione.
      Queste sono responsabilità di altri stati (`EVADING`, `UNSTUCKING`), che vengono attivati tramite transizioni.

2.  **Prevenzione dei Loop di Stato (Inerzia e Isteresi)**

    - Per evitare rapidi e inutili cambi di stato ("thrashing"), le transizioni **non devono reagire a cambiamenti istantanei**.
      - **Usa Contatori in Memoria:** Per condizioni che possono "sfarfallare" (es. visibilità del nemico), usa un contatore in `memory` e una soglia in `config` (es. `enemyLostGracePeriod`).
    - **Usa Eventi per le Azioni:** Le transizioni che dipendono dal completamento di un'azione (come `moveTo`) **devono** basarsi sugli eventi (`SEQUENCE_COMPLETED`, `ACTION_STOPPED`), non su controlli come `isQueueEmpty()`.

3.  **Gestione Robusta della Coda di Comandi:**

    - Usa **SEMPRE** `if (api.isQueueEmpty())` prima di accodare nuove sequenze di movimento (`moveTo`, `move`).
    - Chiama `api.aimAt()` e `api.fire()` indipendentemente dallo stato della coda.

4.  **Aderenza Assoluta alle Firme API**

    - La documentazione API fornita è l'**unica fonte di verità**.
    - Devi utilizzare i **nomi delle funzioni, i parametri e i formati dei dati esattamente come descritto**.
    - **NON inventare o assumere formati alternativi per i parametri**, anche se sono comuni in altri contesti. qualsiasi altro formato diverso dalla documentazione è inaccettabile e verrà considerato un errore grave.

5.  **Principio di Resilienza delle Azioni ("Il Piano B"):** Nessuna azione deve essere data per scontata. Ogni azione che può fallire deve avere una sequenza di fallback.
    Devi usare il metodo di validazione corretto per ogni tipo di azione.
    Esempio per movimenti: \* **Implementazione OBBLIGATORIA per `moveTo` (con Pathfinding):**
    Il codice che chiama `moveTo` **DEVE** seguire questa struttura logica.

        ```javascript
        // Esempio di pseudocodice obbligatorio:
        const targetPos = { x: ..., y: ... };
        if (api.isPositionValid(targetPos)) {
            if (!api.moveTo(targetPos.x, targetPos.y)) {
                // FALLIMENTO (Pathfinding): Nessun percorso trovato. Implementa il Piano B.
            }
        } else {
            // FALLIMENTO (Validazione): La destinazione non è calpestabile. Implementa il Piano B.
        }
        ```

    - **Implementazione OBBLIGATORIA per `move`/`strafe` (Linea Retta):**
      Il codice **DEVE** eseguire una doppia verifica prima di accodare l'azione.

      ```javascript
      // Esempio di pseudocodice obbligatorio:
      const destPos = calcolaDestinazione(...);
      if (!(api.isPositionValid(destPos) && api.isLineOfSightClear(destPos) && api.move(...))) {
          // FALLIMENTO: Il percorso è bloccato. Implementa il Piano B.
      }
      ```

6.  **Principio di Rilevamento del Fallimento Tattico ("L'Interruttore di Circuito"):**
    Se il bot cicla ripetutamente tra stati correttivi, la sua strategia attuale è fallita e deve essere resettata.
    - **Implementazione Suggerita:** Usa un contatore `consecutiveCorrectiveActions` in `memory`.
      Crea una transizione globale ad altissima priorità che si attiva se il contatore supera una soglia,
      portando a uno stato di **ritirata strategica** (`STRATEGIC_RETREAT`).

### **SEZIONE 5: Documentazione API di Riferimento**

**Concetti Fondamentali: La Coda di Comandi (Command Queue)**
Il sistema di controllo è asincrono. Comandi come `move`, `rotate`, `moveTo` vengono aggiunti a una coda e eseguiti in sequenza. Azioni come `fire` e `scan` sono istantanee. La logica deve essere reattiva agli eventi (`api.getEvents()`).

#### **Comandi di Movimento e Navigazione (Accodabili)**

- `api.move(distance, speedPercentage)`: **Restituisce:** `void`. Accoda un movimento in linea retta.
- `api.rotate(angle, speedPercentage)`: **Restituisce:** `void`. Accoda una rotazione.
- `api.moveTo(x, y, speedPercentage)`: **Restituisce:** `boolean`. Tenta di trovare un percorso e accoda i movimenti. Restituisce `true` se il percorso è stato trovato, `false` altrimenti.
- `api.strafe(direction)`: **Restituisce:** `void`. Accoda uno spostamento laterale rapido.
- `api.sequence(actions)`: **Restituisce:** `void`. Accoda una sequenza di azioni personalizzate.

#### **Comandi Istantanei**

- `api.stop()`: **Restituisce:** `void`. Interrompe l'azione corrente e svuota l'intera coda di comandi.
- `api.fire(options)`: **Restituisce:** `void`. Spara un proiettile. `options` può essere `{ trackMiss: true }`.
- `api.log(...args)`: **Restituisce:** `void`. Scrive messaggi nella console di debug.

#### **Comandi di Combattimento (Dichiarativi)**

- `api.aimAt(x, y, speedPercentage)`: **Restituisce:** `void`. Comando continuo da chiamare ad ogni tick per mantenere la mira.

#### **Percezione e Stato (Istantanei)**

- `api.scan()`: **Restituisce:** `Object | null`. Restituisce i dati del nemico (`distance`, `angle`, `x`, `y`, `velocity`) o `null` se non è visibile.
- `api.scanObstacles()`: **Restituisce:** `Array<Object>`. Restituisce una lista di ostacoli vicini.
- `api.scanForIncomingProjectiles()`: **Restituisce:** `Array<Object>`. Restituisce una lista di proiettili nemici in arrivo.
- `api.isLockedOnByEnemy()`: **Restituisce:** `boolean`. `true` se il nemico sta mirando con linea di tiro libera.
- `api.getState()`: **Restituisce:** `Object`. Lo stato del tuo bot (`x`, `y`, `rotation`, `hp`, `energy`).
- `api.getHullState()`: **Restituisce:** `Object` (`{ hp, maxHp }`).
- `api.getArmorState()`: **Restituisce:** `Object` (`{ hp, maxHp }`).
- `api.getBatteryState()`: **Restituisce:** `Object` (`{ energy, maxEnergy }`).
- `api.getSelfWeaponState()`: **Restituisce:** `Object` (`{ canFire, cooldownRemaining, energyCost }`).
- `api.getArenaDimensions()`: **Restituisce:** `Object` (`{ width, height, obstacles }`).

#### **Validazione e Utilità (Istantanei)**

- `api.isObstacleAhead(probeDistance)`: **Restituisce:** `boolean`. Controlla ostacoli molto vicini nella direzione di marcia.
- `api.isLineOfSightClear(targetPosition)`: **Restituisce:** `boolean`. Verifica se un percorso in linea retta verso una posizione è libero.
- `api.isPositionValid(position)`: **Restituisce:** `boolean`. Verifica se un punto `{x, y}` è "calpestabile" (non dentro un muro/ostacolo).
- `api.getRandomPoint(bounds)`: **Restituisce:** `Object | null`. Genera un punto valido casuale `{x, y}`. `bounds` è opzionale e deve essere `{ x, y, endX, endY }`.
- `api.isQueueEmpty()`: **Restituisce:** `boolean`. `true` se non ci sono azioni in esecuzione o in coda.

#### **Gestione Memoria ed Eventi**

- `api.getMemory()`: **Restituisce:** `Object`. L'oggetto di memoria persistente del bot.
- `api.updateMemory(properties)`: **Restituisce:** `Object`. Aggiorna la memoria del bot.
- `api.getEvents()`: **Restituisce:** `Array<Object>`. La lista degli eventi accaduti nell'ultimo tick.

**Sistema di Eventi (`api.getEvents()`)**

Restituisce un array di eventi accaduti nell'ultimo tick. Tipi principali:

- `SEQUENCE_COMPLETED`: Una sequenza da `moveTo` o `sequence` è terminata.
- `ACTION_STOPPED`: Un comando è stato interrotto. Contiene `reason` (`COLLISION`, `USER_COMMAND`, `NO_ENERGY`) e `source`.
- `HIT_BY_PROJECTILE`: Sei stato colpito.
- `ENEMY_HIT`: Hai colpito il nemico.
- `PROJECTILE_NEAR_MISS`: Un tuo proiettile ha mancato il bersaglio. Contiene `distance`.
- `ENEMY_DETECTED`: Il nemico è apparso nel radar.

**Azioni di Debug**

- `api.log(...args)`: Scrive messaggi nella console di debug.

### **SEZIONE 6: Scaffolding del Codice (Template da Completare)**

Il tuo compito è **completare le sezioni contrassegnate con `/* COMPLETARE QUI */`** all'interno del seguente scheletro. Le sezioni `run` e `setCurrentState` sono il motore della FSM e **NON devono essere modificate**.

```javascript
({
  // =================================================================
  // SEZIONE 1: CONFIGURAZIONE IA (COMPLETARE QUI)
  // =================================================================
  config: {
    /* Inserisci qui soglie e contatori per l'inerzia. Esempio: */
    enemyLostGracePeriod: 20, // Tick da attendere prima di considerare il nemico "perso"
    lowHealthThreshold: 40,
    lowBatteryThreshold: 30,
    safeBatteryThreshold: 70,
    engagementDistance: 250,
  },

  // =================================================================
  // SEZIONE 2: TRANSIZIONI GLOBALI (COMPLETARE QUI)
  // =================================================================
  globalTransitions: [
    /* Inserisci qui le transizioni ad alta priorità. */
    {
      target: "TRANSITION_NAME",
      condition: (api, memory, context, events) =>
        events.some(
          (e) => true //condizione
        ),
      description: "Description tglobal transition",
    },
  ],

  // =================================================================
  // SEZIONE 3: METODI HELPER (OPZIONALE, COMPLETARE QUI)
  // =================================================================
  /* _nomeMetodoHelper: function(api, memory) { ... }, */

  // =================================================================
  // SEZIONE 4: MACCHINA A STATI (COMPLETARE QUI)
  // =================================================================
  states: {
    /* Inserisci qui la logica di tutti gli stati richiesti. */
    NOME_STATO: {
      onEnter(api, memory) {
        //logica inizializzazione stato
      },
      onExecute(api, memory, events, context) {
        // Logica ad ogni tick
      },
      onExit(api, memory) {
        // Logica pulizia prima di cambio stato.
      },
      transitions: [
        {
          target: "..."
          condition: (api, memory, context, events) =>
           ...
          description: "...",
        },
      ],
    },
  },

  // =================================================================
  // SEZIONE 5: MOTORE DELLA FSM (NON MODIFICARE)
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
      api.updateMemory({ current: newState, lastState: oldState });
      if (this.states[newState]?.onEnter) {
        this.states[newState].onEnter.call(this, api, memory, context);
      }
    }
  },

  run: function (api) {
    const memory = api.getMemory();
    if (typeof memory.current === "undefined") {
      api.updateMemory({
        /* Inizializza qui le variabili di memoria e i contatori per l'inerzia. */
        ticksSinceEnemySeen: 0,
        lastKnownEnemyPosition: null,
      });
      this.setCurrentState("SEARCHING", api); // Assicurati che esista uno stato iniziale 'SEARCHING'
      return;
    }

    // --- Raccolta dati e AGGIORNAMENTO CONTATORI ---
    const events = api.getEvents();
    const enemy = api.scan();

    // Gestione del contatore di inerzia per la visibilità del nemico
    if (enemy) {
      api.updateMemory({
          ticksSinceEnemySeen: 0,
          lastKnownEnemyPosition: { x: enemy.x, y: enemy.y }
      });
    } else {
      api.updateMemory({ ticksSinceEnemySeen: memory.ticksSinceEnemySeen + 1 });
    }

    const selfState = api.getState();
    const battery = api.getBatteryState();
    const batteryPercent = (battery.energy / battery.maxEnergy) * 100;
    const healthPercent = (selfState.hp / (api.getHullState().maxHp + api.getArmorState().maxHp)) * 100;
    const context = { enemy, batteryPercent, healthPercent, config: this.config };

    // --- Gerarchia decisionale ---
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
})
```

### **SEZIONE 7: Richiesta Specifica**

Ora, basandoti su tutte le regole, **completa lo scaffolding fornito** per implementare l'IA **"Assassino Tattico"**.

- **Comportamento Generale:** Implementa gli stati: `SEARCHING`, `ATTACKING`, `HUNTING`, `UNSTUCKING`, `RECHARGING`.
- **Logica delle Transizioni Anti-Loop:**
  - **`ATTACKING -> HUNTING`**: La transizione deve attivarsi solo se il nemico non è visibile da un numero di tick superiore a `config.enemyLostGracePeriod`. La condizione sarà `memory.ticksSinceEnemySeen > this.config.enemyLostGracePeriod`.
  - **`HUNTING -> SEARCHING`**: La transizione deve attivarsi **SOLO** se viene ricevuto un evento `SEQUENCE_COMPLETED` (che indica il completamento del `moveTo`) E il nemico non è ancora visibile.
- **Stato `HUNTING`:** La sua responsabilità è raggiungere l'ultima posizione nota del nemico. In `onExecute`, se la coda è vuota, avvia un `moveTo` verso `memory.lastKnownEnemyPosition`. Assicurati di usare `api.isPositionValid` prima di chiamare `moveTo`.
- **Priorità Globali (da implementare in `globalTransitions`):**
  1.  **Collisione:** Transizione a `UNSTUCKING`.
  2.  **Batteria Scarica (Batteria < `config.lowBatteryThreshold`):** Transizione a `RECHARGING`.

Dopo aver generato il codice, **verifica che soddisfi tutti i criteri di autovalutazione** elencati di seguito.

---

### **SEZIONE 8: Criteri di Successo**

Il bot dovrebbe dimostrare:

- Adattabilità tattica situazionale
- Recupero da situazioni compromesse
- Comportamento emergente intelligente

---

### **SEZIONE 9: Criteri di Autovalutazione e Revisione Finale**

**Prima di presentare la tua risposta finale, esegui un'autovalutazione critica del codice che hai generato, rispondendo mentalmente a queste domande. Il tuo codice deve superare tutti questi controlli.**

1.  **Aderenza all'Architettura e allo Scope (Vincoli Sezione 3):**

    - Il codice è in un oggetto `({ ... })`? I metodi helper sono al livello principale?
    - `run` e `setCurrentState` sono invariati? Solo sintassi `function(...)`?
    - **Controllo Idempotenza:** Le transizioni includono `memory.current !== 'STATO_TARGET'`?
    - **Controllo `stop()`:** La funzione `api.stop()` **NON** appare mai all'interno degli stati?

2.  **Principio di Singola Responsabilità (SRP):**

    - Ogni stato ha una sola, chiara responsabilità?
      es: - C'è logica di evasione o sblocco nello stato `ATTACKING`? (Risposta corretta: No). - Lo stato `TAKING_COVER` si occupa di sparare? (Risposta corretta: No, la sua unica responsabilità è raggiungere la copertura).

3.  **Aderenza ai Pattern di Codifica (Pattern Sezione 4):**

    - **Controllo Critico `moveTo`:** Ogni chiamata a `api.moveTo` è inserita in una struttura `if/else` che ne gestisce esplicitamente il valore di ritorno booleano e la pre-validazione con `isPositionValid`?
    - **Controllo Critico `move`/`strafe`:** Ogni chiamata a `api.move` o `api.strafe` è preceduta dalla doppia verifica `isPositionValid` E `isLineOfSightClear`?
    - **Controllo Interruttore di Circuito:** Esiste una transizione globale basata su un contatore per forzare uno stato di `STRATEGIC_RETREAT`?

4.  **Controllo logico:**
    - Verifica mentalmmente il corretto funzionamento di ogni stato
      - Ogni stato utilizzato è stato implementato correttamente?
      - Ogni stato viene avviato correttamente?
      - Ogni stato ha almeno una condizione di uscita?
      - La priorità dei cambi di stato è stata rispettata?
        1.  transizioni globali
        2.  transizioni di stato
      - Ci sono possibili loop tra gli stati?
5.  **Prevenzione dei Loop di Stato (Robustezza):**

    - La transizione da `ATTACKING` a uno stato di inseguimento (`HUNTING`) è protetta da un contatore di "inerzia" (`ticksSinceEnemySeen` e `enemyLostGracePeriod`)?
    - Le transizioni che dipendono dal completamento di un movimento (`moveTo`) si basano sull'evento `SEQUENCE_COMPLETED`?

6.  **Gestione Robusta delle Azioni:**

    - Ogni chiamata a `moveTo` o `move` all'interno di un `onExecute` è protetta da un `if (api.isQueueEmpty())`?
    - Le chiamate a `moveTo` verso posizioni calcolate (es. in `HUNTING` o `TAKING_COVER`) sono verificate con `api.isPositionValid` per evitare fallimenti?
    - Le chiamate a `api.fire()` sono precedute da un controllo `api.isLineOfSightClear()` per evitare sprechi di energia?

7.  **Coerenza Tattica:**

    - Le priorità definite in `globalTransitions` sono logicamente corrette (es. sicurezza prima di tutto, come sbloccarsi o cercare copertura, poi gestione risorse come la ricarica)?
    - I valori nel `config` sono coerenti? (es. `safeBatteryThreshold` è maggiore di `lowBatteryThreshold`?).
    - Il comportamento complessivo che emerge è quello di un "Assassino Tattico" intelligente e non di un bot che agisce a caso?

8.  **Aderenza Assoluta all'API :**
    - **Controllo API**: ho utilizzato solo funzioni che ESISTONO all'interno della documentazione?
    - Per ogni chiamata a una funzione dell'API (es. `api.getRandomPoint`, `api.fire`), ho verificato che gli argomenti passati corrispondano **esattamente** al formato specificato nella documentazione?
    - **Controllo Specifico:** La chiamata a `api.getRandomPoint()` è senza parametri (per tutta l'arena) o con un oggetto `bounds` nel formato `{ x, y, endX, endY }`? (Qualsiasi altro formato è un errore).

Fornisci l'intero oggetto JavaScript compilato, pronto per essere eseguito.
