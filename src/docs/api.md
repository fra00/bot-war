API di Controllo del Bot (v5)

Questa documentazione descrive l'API aggiornata per programmare il tuo robot. Il sistema di controllo è asincrono, basato su eventi e ora include una coda di comandi per semplificare la programmazione di sequenze di azioni, oltre a nuove funzionalità di percezione avanzata.

---

## Concetti Fondamentali: La Coda di Comandi

Coda di Comandi (Command Queue)

Il cambiamento più significativo è l'introduzione di una coda di comandi. Quando chiami un comando asincrono come `move`, `rotate`, `moveTo` o `aimAt`, non viene eseguito immediatamente. Invece, viene aggiunto a una coda di comandi interna al tuo robot.

- Il robot esegue un solo comando dalla coda alla volta.
- Quando un comando è completato (es. un movimento termina), viene rimosso dalla coda e il comando successivo inizia automaticamente nel tick seguente.
- Questo ti permette di scrivere sequenze di azioni in modo dichiarativo, senza dover gestire manualmente gli eventi di completamento per ogni passo.

Comandi Asincroni e Azioni Istantanee

Le azioni rimangono divise in due categorie:

- Comandi Asincroni Accodabili: Azioni come `move`, `rotate`, `moveTo`, `aimAt`, `strafe`. Vengono aggiunte alla coda e richiedono più tick per essere completate.
- Azioni Istantanee: Azioni come `fire` e `scan`. Vengono eseguite immediatamente, nel tick in cui vengono chiamate, senza influenzare la coda di comandi.

Logica Guidata dagli Eventi

Nonostante la coda di comandi semplifichi le sequenze, la logica reattiva è ancora fondamentale. Il tuo bot deve reagire agli eventi per interrompere le azioni pianificate e rispondere a minacce. Usa `api.getEvents()` per ricevere notifiche su eventi come `HIT_BY_PROJECTILE`.

---

## Architettura dell'IA: Macchina a Stati Dichiarativa (Consigliata)

Per creare un'IA robusta, il nostro `DefaultAIBase.js` implementa una **Macchina a Stati** con un ciclo di vita definito per ogni stato. Questo pattern è il modo consigliato per strutturare la tua logica.

### Il Flusso Decisionale

Ad ogni tick, il motore dell'IA segue una gerarchia di priorità per decidere cosa fare:

1.  **Transizioni Globali**: Vengono controllate per prime. Sono condizioni di emergenza o ad alta priorità (es. collisione, batteria scarica) che possono interrompere qualsiasi stato.
2.  **Transizioni Locali**: Se nessuna transizione globale è valida, vengono controllate le transizioni specifiche dello stato corrente. Queste definiscono le regole per uscire da quello stato (es. da `ATTACKING` a `SEARCHING` se il nemico sparisce).
3.  **Azione di Stato (`onExecute`)**: Se nessuna transizione (globale o locale) è valida, il bot rimane nello stato corrente ed esegue la logica definita in `onExecute`, che si occupa delle azioni continue (es. mirare, sparare, muoversi).

### Struttura di uno Stato

Ogni stato è un oggetto che può contenere:

- **`onEnter(api, readOnlyMemory, context)`**: Eseguito **una sola volta** all'ingresso. Ideale per avviare un'azione (es. `api.move()`).
- **`onExecute(api, readOnlyMemory, context, events)`**: Eseguito **ad ogni tick**. Contiene le azioni continue dello stato (es. `api.aimAt()`).
- **`onExit(api, readOnlyMemory)`**: Eseguito **una sola volta** all'uscita. Utile per la pulizia.
- **`transitions` (Array)**: Un array di oggetti che definisce le possibili uscite dallo stato, ordinate per priorità. Ogni oggetto ha la forma:
  ```javascript
  {
    target: 'NOME_STATO_DESTINAZIONE',
    condition: (api, readOnlyMemory, context, events) => { /* ... logica ... */ return true; },
    description: 'Descrizione testuale della transizione'
  }
  ```

### Esempio Pratico: `SEARCHING` con la Nuova Architettura

```javascript
// all'interno di states: { ... }
SEARCHING: {
  onEnter: (api, readOnlyMemory) => {
    api.log("Inizio pattugliamento...");
  },
  onExecute: (api, readOnlyMemory, context, events) => {
    // Se un movimento è terminato e stavamo inseguendo, puliamo la memoria.
    if (
      readOnlyMemory.lastKnownEnemyPosition &&
      events.some(
        (e) =>
          e.type === "SEQUENCE_COMPLETED" ||
          (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
      )
    ) {
      api.updateMemory({ lastKnownEnemyPosition: null });
    }

    // Se il bot è inattivo, decide la prossima mossa.
    if (api.isQueueEmpty()) {
      if (readOnlyMemory.lastKnownEnemyPosition) {
        api.moveTo(readOnlyMemory.lastKnownEnemyPosition.x, readOnlyMemory.lastKnownEnemyPosition.y);
      } else {
            // Usa getRandomPoint per assicurarti che la destinazione sia valida
            const randomPoint = api.getRandomPoint();
            if (randomPoint) {
              api.moveTo(randomPoint.x, randomPoint.y);
            }
      }
    }
  },
  transitions: [
    {
      target: 'ATTACKING',
      condition: (api, readOnlyMemory, context) => context.enemy,
      description: "Passa ad attaccare se un nemico è visibile."
    }
  ]
},
```

In questo esempio:

- La transizione a `ATTACKING` è definita in modo chiaro e separato.
- `onExecute` si occupa solo della logica di pattugliamento quando il bot è inattivo.

---

## Comandi di Movimento e Navigazione

Questi comandi vengono aggiunti alla coda di comandi del robot.

api.move(distance, speedPercentage)

    Accoda un'azione di movimento per una distanza specifica.

    Parametri:
    - `distance` (number): La distanza in pixel da percorrere. Un valore negativo indica un movimento all'indietro.
    - `speedPercentage` (number, opzionale, default: 100): La percentuale della velocità massima da usare (da -100 a 100).

    **Valore di ritorno:** `void`

    Comportamento:
    - L'azione viene aggiunta alla coda. Se parte di una sequenza, al termine viene generato un evento `SEQUENCE_COMPLETED`.
    - Può essere interrotta da `api.stop()`, collisioni o mancanza di energia, generando un evento `ACTION_STOPPED`.

    Esempio:
    // Accoda un movimento in avanti di 150 pixel.
    api.move(150);

api.rotate(angle, speedPercentage)

    Accoda un'azione di rotazione di un angolo specifico.

    Parametri:
    - `angle` (number): L'angolo in gradi di cui ruotare. Positivo per senso orario (destra), negativo per antiorario (sinistra).
    - `speedPercentage` (number, opzionale, default: 100): La percentuale della velocità di rotazione massima.

    **Valore di ritorno:** `void`

    Comportamento:
    - L'azione viene aggiunta alla coda. Se parte di una sequenza, al termine genera un evento `SEQUENCE_COMPLETED`.

    Esempio:
    // Accoda una rotazione a sinistra di 90 gradi.
    api.rotate(-90);

api.moveTo(x, y, speedPercentage)

    Comando di alto livello che calcola un percorso per raggiungere le coordinate specificate e accoda i comandi necessari.

    Parametri:
    - `x` (number): La coordinata X di destinazione.
    - `y` (number): La coordinata Y di destinazione.
    - `speedPercentage` (number, opzionale, default: 100): La velocità da usare per i movimenti.

    **Valore di ritorno:** `boolean` - `true` se un percorso valido è stato trovato e accodato, `false` altrimenti.

    Comportamento:
    - Utilizza un algoritmo di pathfinding (A*) per trovare il percorso più breve fino al punto (x, y), aggirando gli ostacoli.
    - Se un percorso viene trovato, il comando accoda automaticamente una sequenza di comandi `rotate` e `move` per seguirlo.

    Esempio:
    // Calcola un percorso per il centro dell'arena e accoda i movimenti.
    const arena = api.getArenaDimensions();
    api.moveTo(arena.width / 2, arena.height / 2);

api.strafe(direction)

    Accoda un'azione di spostamento laterale (strafe) rapido, perpendicolare alla direzione attuale del bot.

    Parametri:
    - `direction` ('left' | 'right'): La direzione dello spostamento.

    **Valore di ritorno:** `void`

    Comportamento:
    - Esegue uno spostamento a distanza fissa (configurabile nel motore) con un costo energetico maggiorato.
    - È la manovra evasiva più efficace e veloce.

    Esempio:
    api.strafe('left');

api.stop()

    Interrompe immediatamente il comando in esecuzione e svuota l'intera coda di comandi. Questa è un'azione istantanea.

    **Valore di ritorno:** `void`

    Comportamento:
    - Se un comando era attivo, viene interrotto e viene generato un evento `ACTION_STOPPED` con una `source` specifica.
    - Tutta la `commandQueue` viene cancellata. Qualsiasi azione pianificata viene annullata.
    - È il comando principale per implementare una logica reattiva.

    **Nota:** La chiamata a `stop()` accetta un parametro opzionale `source` (stringa) per identificare chi ha richiesto lo stop. Il motore della macchina a stati usa `"STATE_TRANSITION"`.

    Esempio:
    // Se vieni colpito mentre ti muovi, annulla tutto e fermati.
    const events = api.getEvents();
    if (events.some(e => e.type === 'HIT_BY_PROJECTILE')) {
      api.stop();
      // Ora la coda è vuota, puoi pianificare una manovra evasiva.
    }

api.sequence(actions)

    Accoda una serie di comandi personalizzati che verranno eseguiti in sequenza.
    Questo è un comando avanzato per creare catene di azioni complesse.

    Parametri:
    - `actions` (Array<Object>): Un array di oggetti azione, dove ogni oggetto ha la forma `{ type: string, payload: any }`. I tipi e i payload devono corrispondere a quelli usati internamente (es. `{ type: 'START_MOVE', payload: { distance: 100 } }`).

    **Valore di ritorno:** `void`

    Comportamento:
    - Le azioni vengono aggiunte alla coda di comandi.
    - Al termine dell'intera sequenza, viene generato un evento `SEQUENCE_COMPLETED`.

    Esempio:
    // Accoda una sequenza per muoversi a zig-zag
    const zigZag = [
      { type: 'START_ROTATE', payload: { angle: 45 } },
      { type: 'START_MOVE', payload: { distance: 100 } },
      { type: 'START_ROTATE', payload: { angle: -90 } },
      { type: 'START_MOVE', payload: { distance: 100 } },
    ];
    api.sequence(zigZag);

---

## Azioni di Debug

api.log(...args)

    Registra un messaggio o un oggetto nel pannello di log del bot per il debug. Questa è un'azione istantanea.

    Parametri:
    - `...args` (any): Una serie di argomenti (stringhe, numeri, oggetti) da registrare. Gli oggetti verranno convertiti in stringhe JSON.

    Esempio:
    api.log("Stato attuale:", api.getMemory().current);
    const enemy = api.scan();
    if (enemy) {
      api.log("Nemico trovato a distanza:", enemy.distance);
    }

---

## Comandi di Combattimento e Mira

Questi comandi gestiscono le capacità offensive del bot. `fire` è un'azione istantanea, mentre `aimAt` avvia e mantiene un'azione di mira che richiede tempo per essere completata.

api.aimAt(x, y, speedPercentage)

    Comando "continuo" per mirare a una destinazione. Se chiamato ad ogni tick, il bot correggerà la sua mira verso il bersaglio.

    Parametri:
    - `x` (number): La coordinata X del bersaglio.
    - `y` (number): La coordinata Y del bersaglio.
    - `speedPercentage` (number, opzionale, default: 100): La velocità di rotazione.

    **Valore di ritorno:** `void`

    Comportamento:
    - Questo comando è **dichiarativo**. Ad ogni tick, l'IA dovrebbe semplicemente dichiarare "voglio puntare qui".
    - Il motore di gioco si occupa di avviare, continuare o correggere la rotazione in modo efficiente.
    - Questo elimina la necessità di controllare `isQueueEmpty` prima di mirare e di attendere l'evento di completamento.

    Esempio di utilizzo corretto:
    // Nello stato ATTACKING, ad ogni tick:
    const target = api.scan();
    if (target) {
      // 1. Dichiara l'intento di mirare. Il motore gestisce la rotazione.
      api.aimAt(target.x, target.y);
      // 2. Controlla se la mira è già allineata e spara.
      if (Math.abs(target.angle) < 5) {
        api.fire();
      }
    }

api.fire(options)

    Spara un proiettile nella direzione attuale. Questa è un'azione istantanea.

    Parametri:
    - `options` (Object, opzionale): Un oggetto di opzioni.
      - `trackMiss` (boolean): Se `true`, il motore genererà un evento `PROJECTILE_NEAR_MISS` se questo proiettile non colpisce il nemico.

    **Valore di ritorno:** `void`

    Comportamento:
    - Viene eseguita immediatamente nel tick in cui viene chiamata.
    - Non viene aggiunta alla coda di comandi e non interrompe l'azione in corso (es. un movimento).
    - Ha un costo in energia e un tempo di ricarica (cooldown). Se non hai abbastanza energia o il cannone è in ricarica, l'azione fallisce silenziosamente.

    Esempio:
    // Spara e richiedi un feedback se il colpo manca.
    if (api.isLineOfSightClear(enemyPosition)) {
      api.fire({ trackMiss: true });
    }

---

## Percezione e Stato

Queste funzioni forniscono informazioni immediate sullo stato del robot e dell'ambiente. Non interagiscono con la coda di comandi e restituiscono sempre lo stato del tick corrente.

api.scan()

    Restituisce il risultato dell'ultima scansione radar eseguita dal motore di gioco. Questa è un'azione istantanea e non consuma energia.

    **Valore di ritorno:** `Object | null`
    - Un oggetto con le seguenti proprietà se il nemico è nel raggio del radar:
      - `distance` (number): Distanza in linea d'aria dal nemico.
      - `angle` (number): Angolo relativo al nemico in gradi (da -180 a 180). `0` è la direzione in cui il tuo robot sta puntando. Un valore negativo è a sinistra, uno positivo a destra.
      - `x` (number): Coordinata X stimata del nemico.
      - `y` (number): Coordinata Y stimata del nemico.
      - `velocity` (Object): Un oggetto che descrive il movimento del nemico.
        - `speed` (number): La velocità del nemico in pixel per tick.
        - `direction` (number): La direzione di movimento del nemico in gradi (0-360).
    - `null` se il nemico non viene rilevato.

api.scanObstacles()

    Restituisce una lista di ostacoli all'interno del raggio del radar. Questa è un'azione istantanea.

    **Valore di ritorno:** `Array<Object>`
    - Un array di oggetti, dove ogni oggetto rappresenta un ostacolo rilevato. Gli ostacoli sono ordinati dal più vicino al più lontano.
      - `id` (string): ID univoco dell'ostacolo.
      - `x`, `y`, `width`, `height` (number): Posizione e dimensioni dell'ostacolo.
      - `distance` (number): Distanza dal centro del tuo robot al centro dell'ostacolo.
      - `angle` (number): Angolo relativo al centro dell'ostacolo (0-360).
    - Un array vuoto `[]` se non vengono rilevati ostacoli.

api.scanForIncomingProjectiles()

    Restituisce una lista di proiettili nemici in arrivo.

    **Valore di ritorno:** `Array<Object>`
    - Un array di oggetti, dove ogni oggetto rappresenta un proiettile minaccioso.
      - `angle` (number): L'angolo relativo da cui proviene il proiettile (da -180 a 180).
      - `timeToImpact` (number): Una stima dei tick rimanenti prima dell'impatto.
    - Un array vuoto `[]` se non ci sono minacce immediate.

api.isLockedOnByEnemy()

    Controlla se il nemico sta attualmente mirando verso il tuo bot con una linea di tiro libera.

    **Valore di ritorno:** `boolean`
    - `true` se sei sotto mira.
    - `false` altrimenti.

    Comportamento:
    - È fondamentale per le manovre evasive proattive. Si attiva solo se il nemico ha una linea di tiro libera.

api.getState()

    Restituisce lo stato attuale e istantaneo del tuo robot.

    **Valore di ritorno:** `Object`
    - Un oggetto con le seguenti proprietà:
    - `x` (number): Coordinata X.
    - `y` (number): Coordinata Y.
    - `rotation` (number): Angolo di rotazione attuale (0-360).
    - `hp` (number): Punti vita totali (scafo + armatura).
    - `energy` (number): Energia rimanente.

api.getHullState()

    Restituisce lo stato attuale dello scafo del robot.

    **Valore di ritorno:** `Object` - Un oggetto `{ hp: number, maxHp: number }`.

api.getArmorState()

    Restituisce lo stato attuale dell'armatura del robot.

    **Valore di ritorno:** `Object` - Un oggetto `{ hp: number, maxHp: number }`.

api.getBatteryState()

    Restituisce lo stato attuale della batteria del robot.

    **Valore di ritorno:** `Object` - Un oggetto `{ energy: number, maxEnergy: number }`.

    **Nota sulla Ricarica:** L'energia si ricarica passivamente ad ogni tick del gioco. La quantità di ricarica è definita dalla proprietà `rechargeRate` del componente batteria equipaggiato. Se il consumo di energia dovuto alle azioni (movimento, fuoco, etc.) è inferiore alla ricarica passiva, l'energia totale del bot aumenterà.

api.getSelfWeaponState()

    Restituisce lo stato attuale del cannone del tuo robot.

    **Valore di ritorno:** `Object` - Un oggetto `{ canFire: boolean, cooldownRemaining: number, energyCost: number }`.
    - `canFire`: `true` se il cannone è pronto a sparare.
    - `cooldownRemaining`: Il numero di tick rimanenti prima di poter sparare di nuovo.
    - `energyCost`: Il costo in energia per sparare un colpo.

api.getArenaDimensions()

    Restituisce le dimensioni e gli ostacoli dell'arena.

    **Valore di ritorno:** `Object` - Un oggetto con le proprietà `width`, `height` e `obstacles`.

api.isObstacleAhead(probeDistance)

    Controlla la presenza di un ostacolo (muro o oggetto) molto vicino nella direzione di movimento attuale.

    Parametri:
    - `probeDistance` (number, opzionale, default: 30): La distanza in pixel davanti al robot da controllare.

    **Valore di ritorno:** `boolean`

api.isLineOfSightClear(targetPosition)

    Verifica se c'è una linea di tiro libera da ostacoli tra il tuo robot e una posizione.

    **Valore di ritorno:** `boolean`

api.isPositionValid(position)

    Controlla se una data coordinata del mondo è una posizione valida per il centro del tuo robot (cioè, non dentro un muro o un ostacolo).

    Parametri:
    - `position` (Object): Un oggetto con coordinate `{ x, y }`.

    **Valore di ritorno:** `boolean`

api.getRandomPoint(bounds)

    Genera un punto casuale valido all'interno dell'arena o di un'area specificata. Un punto è considerato valido se non si trova all'interno di un ostacolo e rispetta i confini dell'arena.

    Parametri:
    - `bounds` (Object, opzionale): Un oggetto che definisce un'area rettangolare in cui generare il punto. Ha la forma `{ x: number, y: number, endX: number, endY: number }`. Se omesso, la ricerca avverrà in tutta l'arena.

    Valore di ritorno:
    - Un oggetto `{ x: number, y: number }` con le coordinate del punto casuale valido.
    - `null` se non è stato possibile trovare un punto valido dopo un numero massimo di tentativi (utile per aree molto piccole o affollate).

    Esempio di base:
    ```javascript
    // Ottiene un punto casuale in un punto qualsiasi dell'arena
    const randomDestination = api.getRandomPoint();
    if (randomDestination) {
      api.moveTo(randomDestination.x, randomDestination.y);
    }
    ```

api.getOrbitingPosition(targetPoint, distance, direction)

    Calcola un punto di "orbita" attorno a un punto bersaglio, utile per manovre di fiancheggiamento o per aggirare ostacoli.

    Parametri:
    - `targetPoint` (Object): L'oggetto bersaglio attorno al quale calcolare il punto. **Deve avere le proprietà `{x, y}`**.
    - `distance` (number): La distanza desiderata dal centro del `targetPoint`.
    - `direction` (string, opzionale, default: `'random'`): La direzione in cui calcolare il punto. Può essere `'left'`, `'right'` o `'random'`.

    Valore di ritorno:
    - Un oggetto `{ x: number, y: number }` con le coordinate del punto calcolato, già contenuto entro i limiti dell'arena.
    - `null` se il `targetPoint` fornito non è valido.

    Esempio:
    ```javascript
    // Ottiene un punto per fiancheggiare il nemico a 150 pixel di distanza.
    const enemy = api.scan();
    if (enemy) {
      const flankPoint = api.getOrbitingPosition(enemy, 150, 'left');
      if (flankPoint) {
        api.moveTo(flankPoint.x, flankPoint.y);
      }
    }
    ```

api.isQueueEmpty()

    Controlla se la coda di comandi del robot è vuota.

    **Valore di ritorno:** `boolean`
    - `true` se non ci sono comandi in coda o in esecuzione.
    - `false` se c'è almeno un comando in attesa o in esecuzione.

    Comportamento:
    - Questa funzione è il modo preferito per verificare se il robot è "occupato" con una sequenza di azioni. Sostituisce la necessità di gestire manualmente un flag di stato come `isQueueBusy`.

    Esempio:
    if (api.isQueueEmpty()) {
      // La coda è libera, posso pianificare una nuova sequenza di azioni.
      api.moveTo(100, 100);
    }

---

## Gestione Memoria ed Eventi

api.getMemory()

    Restituisce l'oggetto di memoria persistente del robot. Le modifiche a questo oggetto verranno mantenute tra i tick.

    **Valore di ritorno:** `Object`

api.updateMemory(propertiesToUpdate)

    Aggiorna o aggiunge proprietà all'oggetto di memoria del robot. Esegue un merge superficiale delle nuove proprietà nell'oggetto esistente.

    Parametri:
    - `propertiesToUpdate` (Object): Le nuove proprietà da impostare o aggiornare.

    **Valore di ritorno:** `Object` - Il nuovo oggetto di memoria aggiornato.

api.getEvents()

    Restituisce un array di eventi accaduti nell'ultimo tick che riguardano il tuo robot.

    **Valore di ritorno:** `Array<Object>`

    Tipi di Evento Principali:
    - `SEQUENCE_COMPLETED`: Una sequenza di azioni (da `moveTo`, `sequence`, etc.) è terminata con successo. Contiene un `payload` per identificare l'ultimo tipo di comando: `{ payload: { lastCommandType: 'MOVE' | 'ROTATE' | 'MOVE_LATERAL' | 'EMPTY' } }`.
    - `ACTION_STOPPED`: Un comando nella coda è stato interrotto. Motivi: `USER_COMMAND`, `COLLISION`, `NO_ENERGY`. Contiene una `source` per identificare la causa (`"STATE_TRANSITION"`, `"AI_REQUEST"`, `"ENGINE"`).

---

## Sistema di Eventi

La logica reattiva si basa sul controllo degli eventi generati ad ogni tick.

api.getEvents()

    Restituisce un array di eventi accaduti nell'ultimo tick che riguardano il tuo robot.

    Tipi di Evento Principali:
    - `SEQUENCE_COMPLETED`: Una sequenza di azioni (da `moveTo`, `sequence`, etc.) è terminata con successo. Contiene un `payload` per identificare l'ultimo tipo di comando: `{ payload: { lastCommandType: 'MOVE' | 'ROTATE' | 'MOVE_LATERAL' | 'EMPTY' } }`.
    - `ACTION_STOPPED`: Un comando nella coda è stato interrotto. Motivi: `USER_COMMAND`, `COLLISION`, `NO_ENERGY`. Contiene una `source` per identificare la causa (`"STATE_TRANSITION"`, `"AI_REQUEST"`, `"ENGINE"`).
    - `HIT_BY_PROJECTILE`: Il tuo robot è stato colpito da un proiettile nemico.
    - `ENEMY_HIT`: Un tuo proiettile ha colpito il bersaglio nemico.
    - `PROJECTILE_HIT_WALL`: Un tuo proiettile ha colpito un muro dell'arena.
    - `PROJECTILE_HIT_OBSTACLE`: Un tuo proiettile ha colpito un ostacolo.
    - `PROJECTILE_NEAR_MISS`: Un tuo proiettile (sparato con `trackMiss: true`) ha terminato la sua corsa senza colpire il nemico. Contiene `{ distance: number }` che indica di quanto ha mancato il bersaglio.
    - `ENEMY_DETECTED`: Il radar ha rilevato un nemico che non era visibile nel tick precedente. Contiene i dati del bersaglio.

## La Struttura di Base

Ogni IA è un oggetto JavaScript che deve esportare una funzione `run(api)`. Il modo consigliato per strutturare la tua IA è usare il pattern a stati dichiarativo descritto sopra.

Ecco uno scheletro di partenza che puoi copiare nell'editor:

````javascript
({
  // =================================================================
  // CONFIGURAZIONE IA
  // =================================================================
  constants: {
    // Inserisci qui i tuoi parametri di configurazione
    engagementDistance: 250,
    kitingDistance: 150,
    rechargeEnterThreshold: 30,
    evasionGracePeriod: 120,
  },

  // =================================================================
  // TRANSIZIONI GLOBALI (Massima Priorità)
  // =================================================================
  globalTransitions: [
    {
      target: "EVADING",
      condition: (api, readOnlyMemory, context, events) =>
        events.some((e) => e.type === "HIT_BY_PROJECTILE") &&
        readOnlyMemory.evasionGraceTicks <= 0,
      description: "Colpiti da un proiettile, evasione ha la priorità.",
    },
    // Aggiungi qui altre transizioni globali (es. per collisioni, batteria, etc.)
  ],

  // =================================================================
  // MACCHINA A STATI
  // =================================================================
  states: {
    SEARCHING: {
      onEnter: (api, readOnlyMemory) => {
        api.log("Inizio pattugliamento...");
      },
      onExecute: (api, readOnlyMemory, context, events) => {
        if (
          readOnlyMemory.lastKnownEnemyPosition &&
          events.some(
            (e) =>
              e.type === "SEQUENCE_COMPLETED" ||
              (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
          )
        ) {
          api.updateMemory({ lastKnownEnemyPosition: null });
        }
        if (api.isQueueEmpty()) {
          if (readOnlyMemory.lastKnownEnemyPosition) {
            api.moveTo(
              readOnlyMemory.lastKnownEnemyPosition.x,
              readOnlyMemory.lastKnownEnemyPosition.y
            );
          } else {
            // Usa getRandomPoint per assicurarti che la destinazione sia valida
            const randomPoint = api.getRandomPoint();
            if (randomPoint) {
              api.moveTo(randomPoint.x, randomPoint.y);
            }
          }
        }
      },
      transitions: [
        {
          target: "ATTACKING",
          condition: (api, readOnlyMemory, context) => context.enemy,
          description: "Passa ad attaccare se un nemico è visibile.",
        },
      ],
    },
    // Aggiungi qui altri stati...
  },

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
      api.updateMemory({
        lastKnownEnemyPosition: null,
        isMovingToRecharge: false,
        evasionGraceTicks: 0,
      });
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
    const context = { enemy, batteryPercent, constants: this.constants };

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
      const nextStateName = currentState.onExecute.call(
        this,
        api,
        memory,
        context,
        events
      );
      if (nextStateName && nextStateName !== memory.current) {
        this.setCurrentState(nextStateName, api, context);
        return;
      }
    }
  },
});

    Esempio:
    // Spara mentre ti stai muovendo lateralmente.
    // La coda di comandi potrebbe contenere un'azione 'move'.
    // Se la linea di tiro è libera, spara.
    if (api.isLineOfSightClear(enemyPosition)) {
      api.fire();
    }

---

## Percezione e Stato

Queste funzioni forniscono informazioni immediate sullo stato del robot e dell'ambiente. Non interagiscono con la coda di comandi e restituiscono sempre lo stato del tick corrente.

api.scan()

    Restituisce il risultato dell'ultima scansione radar eseguita dal motore di gioco. Questa è un'azione istantanea e non consuma energia.

    Valore di ritorno:
    - Un oggetto con le seguenti proprietà se il nemico è nel raggio del radar:
      - `distance` (number): Distanza in linea d'aria dal nemico.
      - `angle` (number): Angolo relativo al nemico in gradi (da -180 a 180). `0` è la direzione in cui il tuo robot sta puntando. Un valore negativo è a sinistra, uno positivo a destra.
      - `x` (number): Coordinata X stimata del nemico.
      - `y` (number): Coordinata Y stimata del nemico.
      - `velocity` (Object): Un oggetto che descrive il movimento del nemico.
        - `speed` (number): La velocità del nemico in pixel per tick.
        - `direction` (number): La direzione di movimento del nemico in gradi (0-360).
    - `null` se il nemico non viene rilevato.

api.scanObstacles()

    Restituisce una lista di ostacoli all'interno del raggio del radar. Questa è un'azione istantanea.

    Valore di ritorno:
    - Un array di oggetti, dove ogni oggetto rappresenta un ostacolo rilevato. Gli ostacoli sono ordinati dal più vicino al più lontano.
      - `id` (string): ID univoco dell'ostacolo.
      - `x`, `y`, `width`, `height` (number): Posizione e dimensioni dell'ostacolo.
      - `distance` (number): Distanza dal centro del tuo robot al centro dell'ostacolo.
      - `angle` (number): Angolo relativo al centro dell'ostacolo (0-360).
    - Un array vuoto `[]` se non vengono rilevati ostacoli.

api.getState()

    Restituisce lo stato attuale e istantaneo del tuo robot.

    Valore di ritorno: Un oggetto con le seguenti proprietà:
    - `x` (number): Coordinata X.
    - `y` (number): Coordinata Y.
    - `rotation` (number): Angolo di rotazione attuale (0-360).
    - `hp` (number): Punti vita totali (scafo + armatura).
    - `energy` (number): Energia rimanente.

api.getHullState()

    Restituisce lo stato attuale dello scafo del robot.

    Valore di ritorno: Un oggetto `{ hp: number, maxHp: number }`.

api.getArmorState()

    Restituisce lo stato attuale dell'armatura del robot.

    Valore di ritorno: Un oggetto `{ hp: number, maxHp: number }`.

api.getBatteryState()

    Restituisce lo stato attuale della batteria del robot.

    Valore di ritorno: Un oggetto `{ energy: number, maxEnergy: number }`.

    **Nota sulla Ricarica:** L'energia si ricarica passivamente ad ogni tick del gioco. La quantità di ricarica è definita dalla proprietà `rechargeRate` del componente batteria equipaggiato. Se il consumo di energia dovuto alle azioni (movimento, fuoco, etc.) è inferiore alla ricarica passiva, l'energia totale del bot aumenterà.

api.getSelfWeaponState()

    Restituisce lo stato attuale del cannone del tuo robot.

    Valore di ritorno: Un oggetto `{ canFire: boolean, cooldownRemaining: number, energyCost: number }`.
    - `canFire`: `true` se il cannone è pronto a sparare.
    - `cooldownRemaining`: Il numero di tick rimanenti prima di poter sparare di nuovo.
    - `energyCost`: Il costo in energia per sparare un colpo.

api.getArenaDimensions()

    Restituisce le dimensioni e gli ostacoli dell'arena.

api.isObstacleAhead(probeDistance)

    Controlla la presenza di un ostacolo (muro o oggetto) molto vicino nella direzione di movimento attuale.

    Parametri:
    - `probeDistance` (number, opzionale, default: 30): La distanza in pixel davanti al robot da controllare.

api.isLineOfSightClear(targetPosition)

    Verifica se c'è una linea di tiro libera da ostacoli tra il tuo robot e una posizione.

api.isPositionValid(position)

    Controlla se una data coordinata del mondo è una posizione valida per il centro del tuo robot (cioè, non dentro un muro o un ostacolo).

    Parametri:
    - `position` (Object): Un oggetto con coordinate `{ x, y }`.

api.getRandomPoint(bounds)

    Genera un punto casuale valido all'interno dell'arena o di un'area specificata. Un punto è considerato valido se non si trova all'interno di un ostacolo e rispetta i confini dell'arena.

    Parametri:
    - `bounds` (Object, opzionale): Un oggetto che definisce un'area rettangolare in cui generare il punto. Ha la forma `{ x: number, y: number, endX: number, endY: number }`. Se omesso, la ricerca avverrà in tutta l'arena.

    Valore di ritorno:
    - Un oggetto `{ x: number, y: number }` con le coordinate del punto casuale valido.
    - `null` se non è stato possibile trovare un punto valido dopo un numero massimo di tentativi (utile per aree molto piccole o affollate).

    Esempio di base:
    ```javascript
    // Ottiene un punto casuale in un punto qualsiasi dell'arena
    const randomDestination = api.getRandomPoint();
    if (randomDestination) {
      api.moveTo(randomDestination.x, randomDestination.y);
    }
    ```

api.isQueueEmpty()

    Controlla se la coda di comandi del robot è vuota.

    Valore di ritorno:
    - `true` se non ci sono comandi in coda o in esecuzione.
    - `false` se c'è almeno un comando in attesa o in esecuzione.

    Comportamento:
    - Questa funzione è il modo preferito per verificare se il robot è "occupato" con una sequenza di azioni. Sostituisce la necessità di gestire manualmente un flag di stato come `isQueueBusy`.

    Esempio:
    if (api.isQueueEmpty()) {
      // La coda è libera, posso pianificare una nuova sequenza di azioni.
      api.moveTo(100, 100);
    }

---

## Sistema di Eventi

La logica reattiva si basa sul controllo degli eventi generati ad ogni tick.

api.getEvents()

    Restituisce un array di eventi accaduti nell'ultimo tick che riguardano il tuo robot.

    Tipi di Evento Principali:
    - `MOVE_COMPLETED`: Un comando `move` è terminato con successo.
    - `ROTATION_COMPLETED`: Un comando `rotate` o `aimAt` è terminato con successo.
    - `ACTION_STOPPED`: Un comando nella coda è stato interrotto. Motivi: `USER_COMMAND`, `COLLISION`, `NO_ENERGY`.
    - `HIT_BY_PROJECTILE`: Il tuo robot è stato colpito da un proiettile nemico.
    - `ENEMY_HIT`: Un tuo proiettile ha colpito il bersaglio nemico.
    - `PROJECTILE_HIT_WALL`: Un tuo proiettile ha colpito un muro dell'arena.
    - `PROJECTILE_HIT_OBSTACLE`: Un tuo proiettile ha colpito un ostacolo.
    - `ENEMY_DETECTED`: Il radar ha rilevato un nemico che non era visibile nel tick precedente. Contiene i dati del bersaglio.
    - `SEQUENCE_COMPLETED`: Una sequenza di azioni (da `moveTo` o `sequence`) è terminata con successo.

## La Struttura di Base

Ogni IA è un oggetto JavaScript che deve esportare una funzione `run(api)`. Il modo consigliato per strutturare la tua IA è usare il pattern a stati descritto sopra.

Ecco uno scheletro di partenza che puoi copiare nell'editor:

```javascript
({
  // La mappa degli stati definisce la logica per ogni stato dell'IA.
  states: {
    SEARCHING: {
      onEnter: (api, readOnlyMemory) => {
        api.log("Inizio pattugliamento...");
      },
      onExecute: (api, readOnlyMemory, events) => {
        // Se vediamo un nemico, passiamo allo stato di attacco
        if (api.scan()) {
          return "ATTACKING";
        }
        // Se siamo inattivi, pianifichiamo un nuovo movimento
        if (api.isQueueEmpty()) {
          const arena = api.getArenaDimensions();
          api.moveTo(Math.random() * arena.width, Math.random() * arena.height);
        }
      },
      onExit: (api, readOnlyMemory) => {
        // La pulizia delle azioni (stop) è gestita centralmente.
      },
    },
    ATTACKING: {
      // Aggiungi qui la logica per lo stato ATTACKING...
    },
    // Aggiungi altri stati qui...
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
        isMovingToRecharge: false,
        evasionGraceTicks: 0,
      });
      this.setCurrentState("SEARCHING", api);
      return; // Esce per questo tick, la logica inizierà dal prossimo.
    }

    // Aggiorna stati interni ad ogni tick
    if (memory.evasionGraceTicks > 0) {
      api.updateMemory({ evasionGraceTicks: memory.evasionGraceTicks - 1 });
    }

    const events = api.getEvents();

    // --- Gestione Transizioni ad Alta Priorità ---
    // Questi controlli hanno la precedenza sulla logica dello stato corrente.
    const battery = api.getBatteryState();
    const batteryPercent = (battery.energy / battery.maxEnergy) * 100;

    if (batteryPercent < 30 && memory.current !== 'RECHARGING') {
      this.setCurrentState("RECHARGING", api);
      return; // Interrompi il tick per dare priorità alla ricarica.
    }
    if (events.some(e => e.type === 'HIT_BY_PROJECTILE') && memory.evasionGraceTicks <= 0) {
      this.setCurrentState("EVADING", api);
      return;
    }
    if (events.some(e => e.type === 'ACTION_STOPPED' && e.reason === 'COLLISION')) {
      this.setCurrentState("UNSTUCKING", api);
      return;
    }

    // --- Esecuzione dello Stato Corrente ---
    const currentState = this.states[memory.current];
    if (currentState?.onExecute) {
      const context = { batteryPercent };
      const nextStateName = currentState.onExecute(api, memory, context, events);
      if (nextStateName && nextStateName !== memory.current) {
        this.setCurrentState(nextStateName, api);
      }
    }
  },

  // --- Motore della Macchina a Stati (non modificare) ---
  setCurrentState: function (newState, api) {
    // Questa funzione è già implementata in DefaultAIBase.js
    // e gestisce il ciclo di vita onExit/onEnter.
  },
});
````
