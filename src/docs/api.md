API di Controllo del Bot (v2)

Questa documentazione descrive l'API aggiornata per programmare il tuo robot. Il sistema di controllo è asincrono, basato su eventi e ora include una coda di comandi per semplificare la programmazione di sequenze di azioni.

---

## Concetti Fondamentali

Coda di Comandi (Command Queue)

Il cambiamento più significativo è l'introduzione di una coda di comandi. Quando chiami un comando asincrono come `move`, `rotate`, `moveTo` o `aimAt`, non viene eseguito immediatamente. Invece, viene aggiunto a una coda di comandi interna al tuo robot.

- Il robot esegue un solo comando dalla coda alla volta.
- Quando un comando è completato (es. un movimento termina), viene rimosso dalla coda e il comando successivo inizia automaticamente nel tick seguente.
- Questo ti permette di scrivere sequenze di azioni in modo dichiarativo, senza dover gestire manualmente gli eventi di completamento per ogni passo.

Comandi Asincroni e Azioni Istantanee

Le azioni rimangono divise in due categorie:

- Comandi Asincroni Accodabili: Azioni come `move`, `rotate`, `moveTo`, `aimAt`. Vengono aggiunte alla coda e richiedono più tick per essere completate.
- Azioni Istantanee: Azioni come `fire` e `scan`. Vengono eseguite immediatamente, nel tick in cui vengono chiamate, senza influenzare la coda di comandi.

Logica Guidata dagli Eventi

Nonostante la coda di comandi semplifichi le sequenze, la logica reattiva è ancora fondamentale. Il tuo bot deve reagire agli eventi per interrompere le azioni pianificate e rispondere a minacce. Usa `api.getEvents()` per ricevere notifiche su eventi come `HIT_BY_PROJECTILE`.

---

## Comandi di Movimento e Navigazione

Questi comandi vengono aggiunti alla coda di comandi del robot.

api.move(distance, speedPercentage)

    Accoda un'azione di movimento per una distanza specifica.

    Parametri:
    - `distance` (number): La distanza in pixel da percorrere. Un valore negativo indica un movimento all'indietro.
    - `speedPercentage` (number, opzionale, default: 100): La percentuale della velocità massima da usare (da -100 a 100).

    Comportamento:
    - L'azione viene aggiunta alla coda. Al termine del movimento, viene generato un evento `MOVE_COMPLETED`.
    - Può essere interrotta da `api.stop()`, collisioni o mancanza di energia, generando un evento `ACTION_STOPPED`.

    Esempio:
    // Accoda un movimento in avanti di 200 pixel, poi uno indietro di 50.
    api.move(200, 75);
    api.move(-50, 100);

api.rotate(angle, speedPercentage)

    Accoda un'azione di rotazione di un angolo specifico.

    Parametri:
    - `angle` (number): L'angolo in gradi di cui ruotare. Positivo per senso orario (destra), negativo per antiorario (sinistra).
    - `speedPercentage` (number, opzionale, default: 100): La percentuale della velocità di rotazione massima.

    Comportamento:
    - L'azione viene aggiunta alla coda. Al termine, genera un evento `ROTATION_COMPLETED`.

    Esempio:
    // Accoda una rotazione a sinistra di 90 gradi.
    api.rotate(-90);

api.moveTo(x, y, speedPercentage)

    Comando di alto livello che calcola un percorso per raggiungere le coordinate specificate e accoda i comandi necessari.

    Parametri:
    - `x` (number): La coordinata X di destinazione.
    - `y` (number): La coordinata Y di destinazione.
    - `speedPercentage` (number, opzionale, default: 100): La velocità da usare per i movimenti.

    Comportamento:
    - Utilizza un algoritmo di pathfinding (A*) per trovare il percorso più breve fino al punto (x, y), aggirando gli ostacoli.
    - Se un percorso viene trovato, il comando accoda automaticamente una sequenza di comandi `rotate` e `move` per seguirlo.

    Esempio:
    // Calcola un percorso per il centro dell'arena e accoda i movimenti.
    const arena = api.getArenaDimensions();
    api.moveTo(arena.width / 2, arena.height / 2);

api.stop()

    Interrompe immediatamente il comando in esecuzione e svuota l'intera coda di comandi. Questa è un'azione istantanea.

    Comportamento:
    - Se un comando era attivo, viene interrotto e viene generato un evento `ACTION_STOPPED`.
    - Tutta la `commandQueue` viene cancellata. Qualsiasi azione pianificata viene annullata.
    - È il comando principale per implementare una logica reattiva.

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

Questi comandi interagiscono con la coda di comandi o vengono eseguiti istantaneamente.

api.aimAt(x, y, speedPercentage)

    Accoda un'azione di rotazione per puntare verso coordinate specifiche.

    Parametri:
    - `x` (number): La coordinata X del bersaglio.
    - `y` (number): La coordinata Y del bersaglio.
    - `speedPercentage` (number, opzionale, default: 100): La velocità di rotazione.

    Comportamento:
    - Calcola l'angolo di rotazione più breve per puntare verso il punto (x, y).
    - Accoda un singolo comando `rotate` per eseguire quella rotazione.
    - Al termine, genera un evento `ROTATION_COMPLETED`.

    Esempio di utilizzo corretto:
    // L'obiettivo è mirare e sparare solo DOPO che la mira è completata.
    // La logica deve attendere l'evento di completamento.
    const target = api.scan();
    if (target) {
      api.aimAt(target.x, target.y);
    }

    // In un tick successivo, dopo che la rotazione è iniziata:
    const events = api.getEvents();
    if (events.some(e => e.type === 'ROTATION_COMPLETED')) {
      // Ora la mira è completa. Possiamo sparare.
      api.fire();
    }

api.fire()

    Spara un proiettile nella direzione attuale. Questa è un'azione istantanea.

    Comportamento:
    - Viene eseguita immediatamente nel tick in cui viene chiamata.
    - Non viene aggiunta alla coda di comandi e non interrompe l'azione in corso (es. un movimento).
    - Ha un costo in energia e un tempo di ricarica (cooldown). Se non hai abbastanza energia o il cannone è in ricarica, l'azione fallisce silenziosamente.

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
    - Un oggetto `{ distance, angle, x, y }` se il nemico è nel raggio del radar.
      - `distance` (number): Distanza in linea d'aria dal nemico.
      - `angle` (number): Angolo relativo al nemico in gradi (0-360), misurato in senso orario. `0` è la direzione in cui il tuo robot sta puntando.
      - `x` (number): Coordinata X stimata del nemico.
      - `y` (number): Coordinata Y stimata del nemico.
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

api.getArenaDimensions()

    Restituisce le dimensioni e gli ostacoli dell'arena.

api.isObstacleAhead(probeDistance)

    Controlla la presenza di un ostacolo (muro o oggetto) di fronte al robot.

    Parametri:
    - `probeDistance` (number, opzionale, default: 30): La distanza in pixel davanti al robot da controllare.

api.isLineOfSightClear(targetPosition)

    Verifica se c'è una linea di tiro libera da ostacoli tra il tuo robot e una posizione.

api.isPositionValid(position)

    Controlla se una data coordinata del mondo è una posizione valida per il centro del tuo robot (cioè, non dentro un muro o un ostacolo).

    Parametri:
    - `position` (Object): Un oggetto con coordinate `{ x, y }`.

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

Ogni IA è un oggetto JavaScript con due elementi principali:

1.  Un oggetto `state` per memorizzare informazioni tra un tick e l'altro (come lo stato attuale del bot).
2.  Una funzione `run(api)` che viene eseguita ad ogni tick del gioco.

Iniziamo con lo scheletro della nostra IA. Copia questo codice nell'editor:

```javascript
({
  // L'oggetto 'state' mantiene i dati tra i tick.
  // Lo inizializzeremo al primo tick.
  state: {},

  /**
   * La funzione run viene chiamata ad ogni tick del gioco.
   * @param {object} api - L'API per controllare il tuo bot.
   */
  run: function (api) {
    // Inizializzazione al primo tick
    if (typeof api.getMemory().current === "undefined") {
      api.getMemory().current = "SEARCHING"; // Inizia cercando il nemico
      console.log("Bot inizializzato. Stato iniziale: SEARCHING");
    }

    // Qui inseriremo la logica della nostra macchina a stati.
  },
});
```
