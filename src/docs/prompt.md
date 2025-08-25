### **Prompt Finale e Definitivo v19 (Architettura Finale Integrata)**

### **Indice del Prompt**

Questo prompt è strutturato per guidarti passo dopo passo. Consulta questo indice per comprendere la struttura del documento prima di procedere.

**🏗️ FRAMEWORK UNIVERSALE (Sezioni 1-7):**

1.  **Contesto e Obiettivo:** La tua persona e lo scopo della tua missione.
2.  **Architettura Obbligatoria:** La nuova struttura della FSM a 3 livelli che devi implementare.
3.  **Vincoli Tecnici e di Struttura:** Le regole inviolabili su come formattare il tuo codice e i suoi dati.
4.  **Documentazione del Motore di Gioco:** Una spiegazione di come il motore nascosto eseguirà il tuo codice.
5.  **Pattern di Codifica Robusta:** Gli schemi di implementazione obbligatori per garantire la resilienza.
6.  **Documentazione API del Bot:** La specifica completa delle funzioni `api.*` che puoi chiamare.
7.  **Scaffolding del Codice:** Il template di codice che devi generare.
    **🎯 SPECIFICHE BOT da creare (Sezione 8):**
8.  **Richiesta Specifica:** Il comportamento esatto dell'IA che devi implementare.
    **✅ VALIDAZIONE (Sezione 9):**
9.  **Criteri di Successo e Autovalutazione:** La checklist di revisione che devi eseguire prima di fornire la risposta.

## **Sezioni 1-7** = **IL FRAMEWORK** (Come costruire il BOT)

### **SEZIONE 1: Contesto e Obiettivo**

Sei un programmatore d'elite specializzato in IA per competizioni di robotica. Il tuo compito è scrivere la **logica decisionale** in JavaScript di un bot da combattimento, che verrà eseguita da un motore di gioco preesistente. Il tuo codice deve essere un singolo oggetto JavaScript, autocontenuto e senza dipendenze esterne. Dopo averlo generato, dovrai eseguire la rigorosa autovalutazione descritta nella Sezione 9.

### **SEZIONE 2: Architettura Obbligatoria: FSM a 3 Livelli**

Il motore di gioco si aspetta che il tuo codice definisca una logica a tre livelli di priorità. Il tuo oggetto deve fornire tre proprietà principali per la logica decisionale:

1.  **`emergencyTransitions`**: Hanno la **priorità assoluta**. Servono per gestire eventi critici e istintivi (es. collisioni, essere colpiti).
2.  **`tacticalTransitions`**: Gestiscono le **decisioni strategiche di alto livello** (es. ingaggiare un nemico, ritirarsi per batteria scarica).
3.  **`states`**: Qui definisci i comportamenti specifici di ogni stato. Ogni stato può avere le sue transizioni locali (`transitions`), che hanno la priorità più bassa.

### **SEZIONE 3: Vincoli Tecnici e di Struttura (Da seguire scrupolosamente)**

1.  **Codice Autocontenuto e Struttura dei Metodi:**

    - L'intero script deve essere un singolo oggetto letterale `({ ... })` [requisito del motore di gioco].

2.  **Sintassi delle Funzioni:** È **obbligatorio** utilizzare la sintassi `function(...) { ... }` per tutti i metodi principali. **NON USARE FUNZIONI LAMBDA (`=>`)** [garantisce il corretto funzionamento della macchina a stati].

3.  **Formato delle Transizioni e degli Stati:** Il tuo codice deve aderire **esattamente** ai seguenti formati di dati:
    - **Formato di una Transizione:**
      ```javascript
      {
        target: "NOME_STATO_DESTINAZIONE",
        condition: function(api, memory, context, events) {
          // ... la tua logica qui, deve restituire true o false
        },
        description: "Spiegazione testuale della transizione."
      }
      ```
    - **Formato di uno Stato:**
      ```javascript
      NOME_STATO: {
        interruptibleBy: [], // Proprietà opzionale, vedi Sezione 4
        onEnter: function(api, memory, context) { /* ... */ },
        onExecute: function(api, memory, events, context) { /* ... */ },
        onExit: function(api, memory, context) { /* ... */ },
        transitions: [ /* ... array di oggetti Transizione ... */ ]
      }
      ```
4.  ** Ritorno Booleano Esplicito nelle `condition`:**
    - La funzione `condition` **DEVE** restituire un valore booleano esplicito: `true` o `false`.
    - Valori "truthy" (come un oggetto) o "falsy" (come `undefined` o `null`) non sono ammessi e sono considerati un errore.

### **SEZIONE 4: Documentazione del Motore di Gioco e dei Meccanismi Automatici**

Il tuo codice viene eseguito da un motore di gioco preesistente. Comprendere il suo funzionamento è **fondamentale** per scrivere una logica corretta.

#### **4.1 - Ciclo di Vita per Tick**

Ad ogni tick, il motore esegue la seguente sequenza:

1.  **Popolamento del `context`:** Crea un nuovo oggetto `context` per il tick corrente (vedi 4.3).
2.  Valuta le tue `emergencyTransitions`. Se una è vera, cambia stato e il tick termina.
3.  Controlla lo stato corrente per la proprietà `interruptibleBy`.
4.  Se lo stato è interrompibile, valuta le tue `tacticalTransitions`. Se una è vera (e permessa), cambia stato e il tick termina.
5.  Valuta le `transitions` locali dello stato corrente. Se una è vera, cambia stato e il tick termina.
6.  Se nessuna transizione si è attivata, esegue `onExecute` dello stato corrente.

#### **4.2 - Meccanismi Automatici**

- **Gestione Automatica di `memory.current`:**

  - Il motore **legge e aggiorna automaticamente** la proprietà `memory.current`.
  - Contiene sempre il nome (stringa) dello stato in cui il bot si trova attualmente. Non devi mai modificarla manualmente.

- **Popolamento Automatico del `context`:**

  - Ad ogni tick, il motore crea da zero un oggetto `context` con i dati più aggiornati. Contiene:
    - `context.enemy`: Il risultato di `api.scan()` (`Object` o `null`).
    - `context.batteryPercent`: La percentuale di batteria calcolata.
    - `context.config`: Un riferimento diretto al tuo oggetto `config`.

- **Gestione del Cambio di Stato ("Politica della Tabula Rasa"):**

  - Quando uno stato cambia, il motore esegue sempre `api.stop()`, cancellando la coda di comandi. **Non chiamare mai `api.stop()` manualmente.**

- **Controllo del Focus con `interruptibleBy`:**

  - Usa questa proprietà in uno stato per controllarne il "focus".
  - **Non definito:** Interrompibile.
  - `[]`: Non interrompibile da transizioni tattiche.
  - `['TARGET_A']`: Interrompibile solo dalla transizione tattica verso `TARGET_A`.

- **Transizioni Forzate da `onEnter`/`onExecute`:**
  - Se `onEnter` o `onExecute` restituiscono una **stringa**, il motore la interpreterà come il nome dello stato di destinazione e forzerà una transizione immediata.

#### **4.3 - FAQ del Motore**

- **D: Chi gestisce `memory.current`?**
  - **R:** Il motore, automaticamente. Leggilo pure, ma non scriverlo mai.
- **D: Quando dovrei usare `return "NOME_STATO"`?**
  - **R:** Principalmente in `onEnter` o `onExecute` per gestire un fallimento immediato di un'azione (il "Piano B"), forzando un cambio di strategia senza attendere le transizioni normali.

### **SEZIONE 5: Pattern di Codifica Robusta (Implementazione Obbligatoria)**

1.  **Principio di Singola Responsabilità (SRP):** Ogni stato deve avere una sola, chiara responsabilità.
2.  **Prevenzione dei Loop:**
    - **Inerzia:** Usa contatori in `memory` (es. `enemyLostGracePeriod`) per condizioni "sfarfallanti".
    - **Eventi:** Basa le transizioni sul completamento di azioni (`SEQUENCE_COMPLETED`), non su `isQueueEmpty()`.
3.  **Resilienza delle Azioni ("Il Piano B"):** Ogni azione critica che può fallire deve avere un fallback.
    - **Pattern per `moveTo`:** Usa `api.isPositionValid` come pre-check, poi gestisci il valore di ritorno booleano di `api.moveTo` con un fallback.
    - **Pattern per `move`/`strafe`:** Esegui una doppia verifica con `api.isPositionValid` **E** `api.isLineOfSightClear` prima di accodare l'azione.
4.  **Rilevamento del Fallimento Tattico ("L'Interruttore di Circuito"):** Se il bot cicla tra stati correttivi, la sua strategia è fallita. Usa un contatore (`consecutiveCorrectiveActions`) e una transizione di **emergenza** che porta a uno stato di **ritirata strategica** (`STRATEGIC_RETREAT`).

### **SEZIONE 6: Documentazione API del Bot (`api.*`)**

**Concetti Fondamentali: La Coda di Comandi (Command Queue)**
Il sistema di controllo è asincrono. Comandi come `move`, `rotate`, `moveTo` vengono aggiunti a una coda e eseguiti in sequenza. Azioni come `fire` e `scan` sono istantanee. La logica deve essere reattiva agli eventi (`api.getEvents()`).

#### **Comandi di Movimento e Navigazione (Accodabili)**

- `api.move(distance, speedPercentage)`: **Restituisce:** `void`. Accoda un movimento in linea retta.
- `api.rotate(angle, speedPercentage)`: **Restituisce:** `void`. Accoda una rotazione.
- `api.moveTo(x, y, speedPercentage)`: **Restituisce:** `boolean`. Tenta di trovare un percorso e accoda i movimenti. Restituisce `true` se il percorso è stato trovato, `false` altrimenti.
- `api.strafe(direction)`: **Restituisce:** `void`. Accoda uno spostamento laterale rapido. direction può essere 'left' o 'right'
- `api.sequence(actions)`: **Restituisce:** `void`. Accoda una sequenza di azioni personalizzate. [{ type: "START_MOVE|START_ROTATE|START_STRAFE", payload: { oggetto con parametri da utilizzare per il metodo move|rotate|strafe } }],

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

### **SEZIONE 7: Scaffolding del Codice (Template da Generare)**

Il tuo compito è **generare un singolo oggetto JavaScript che segua questa struttura**, completando le sezioni indicate.

```javascript
({
  // SEZIONE 1: CONFIGURAZIONE IA (COMPLETARE QUI)
  config: {
    /* ... */
  },

  // SEZIONE 2: TRANSIZIONI DI EMERGENZA (COMPLETARE QUI)
  emergencyTransitions: [
    /* ... */
  ],

  // SEZIONE 3: TRANSIZIONI TATTICHE (COMPLETARE QUI)
  tacticalTransitions: [
    /* ... */
  ],

  // SEZIONE 4: METODI HELPER (OPZIONALE, COMPLETARE QUI)
  /* _nomeMetodoHelper: function(api, memory) { ... }, */

  // SEZIONE 5: MACCHINA A STATI (COMPLETARE QUI)
  states: {
    /* ... */
  },
});
```

### **SPECIFICHE DEL BOT** (Che bot creare)

**Applica tutto il know-how delle sezioni 1-7 per realizzare quanto specificato qui**

**genera l'oggetto JavaScript** per implementare l'IA **"Assassino Tattico"**.

- **Comportamento:** Implementa gli stati: `SEARCHING`, `ATTACKING`, `FLEEING` (per batteria scarica), `UNSTUCKING`, `STRATEGIC_RETREAT` , `FLANKING`.
- **Gerarchia:**
  - Usa `emergencyTransitions` per collisioni e per l' "Interruttore di Circuito".
  - Usa `tacticalTransitions` per decidere se attaccare (`ATTACKING`) o fuggire (`FLEEING`). La fuga deve avere priorità sull'attacco.
- **Stato `FLEEING`:** Deve essere **non interrompibile**. Usa `interruptibleBy: []`.
- **Stato `FLANKING`:** In caso di nemico sotto copertura di un ostacolo aggirare l'ostacolo e cercare di colpire il nemico da un altra angolazione libera da ostacoli

### **SEZIONE 9: Criteri di Successo e Autovalutazione**

**Criteri di Successo:** Il bot deve dimostrare adattabilità, recupero da situazioni compromesse e comportamento emergente intelligente.

**Checklist di Autovalutazione:** **Prima di fornire la risposta, esegui un'autovalutazione critica del codice che hai generato.**

1.  **Aderenza all'Architettura (Sezioni 2, 3, 4):**

    - L'output è un singolo oggetto `({ ... })` con le proprietà corrette (`config`, `emergencyTransitions`, etc.)?
    - I metodi helper sono al livello principale? Solo sintassi `function(...)`?
    - `api.stop()` **NON** appare mai? Le transizioni sono idempotenti?
    - Lo stato `FLEEING` usa correttamente `interruptibleBy: []`?

2.  **Aderenza ai Pattern Robusti (Sezione 5):**

    - **Controllo Resilienza:** La logica di movimento segue i pattern corretti e distinti per `moveTo` e `move`/`strafe`?
    - **Controllo Interruttore di Circuito:** Esiste una transizione di _emergenza_ basata su un contatore?

3.  **Controllo Logico e SRP:**

    - Ogni stato ha una sola responsabilità e una condizione di uscita? La priorità delle transizioni è rispettata? I loop sono protetti?

4.  **Aderenza all'API del Bot (Sezione 6):**
    - Ogni chiamata `api.*` usa i formati esatti della documentazione?
