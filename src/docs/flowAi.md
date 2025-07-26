# Log di Progettazione e Sviluppo AI

Questo documento traccia le decisioni architetturali e le evoluzioni significative del sistema di intelligenza artificiale del gioco.

---

## Evoluzione 1: Da Logica Sincrona a Asincrona a Eventi

**Data:** 2024-07-26

**Problema:**
La logica di gestione dei bot basata su un'azione per "tick" (`run(api)`) è diventata complessa e difficile da manutenere. La gestione di stati a lunga durata (come manovre di evasione o movimenti verso un punto) richiede contatori e flag booleani (`isEvading`, `evasionCounter`, etc.), rendendo il codice fragile e difficile da estendere.

**Decisione:**
Si è deciso di passare da un modello di controllo **sincrono** a uno **asincrono basato su eventi**.

**Prompt Guida per l'Implementazione:**

Questo è il piano approvato per la riprogettazione.

### **Obiettivo Primario:**
Trasformare il sistema di controllo dei bot da un'architettura sincrona (una decisione per tick) a un'architettura asincrona guidata da eventi. L'IA dovrà essere in grado di avviare comandi a lunga esecuzione (es. "muoviti per 200 pixel") e reagire al loro completamento tramite un sistema di eventi.

### **Specifiche Tecniche Dettagliate:**

**1. Modifiche all'API del Robot (in `Robot.js`):**
   - **Comando di Movimento:** Introdurre `api.move(distance, speedPercentage)`.
     - `distance`: La distanza totale (in pixel) da percorrere. Un valore negativo indica un movimento all'indietro.
     - `speedPercentage`: La percentuale di velocità massima da usare (default: 100).
     - **Comportamento:** Questo comando avvia un'azione di movimento che si estende su più tick.
   - **Comando di Rotazione:** Introdurre `api.rotate(angle, speedPercentage)`.
     - `angle`: L'angolo totale (in gradi) di cui ruotare. Un valore positivo indica una rotazione in senso orario.
     - `speedPercentage`: La percentuale di velocità di rotazione massima (default: 100).
     - **Comportamento:** Avvia un'azione di rotazione a lunga esecuzione.
   - **Comando di Arresto:** Introdurre `api.stop()`.
     - **Comportamento:** Interrompe immediatamente qualsiasi azione di movimento o rotazione in corso.

**2. Gestione dello Stato nel `Robot`:**
   - La classe `Robot` dovrà mantenere lo stato dell'azione in corso. Si propone di aggiungere una proprietà come `this.activeCommand`.
   - Questa proprietà conterrà i dettagli del comando attivo (es. `{ type: 'MOVE', remainingDistance: 150, speed: 80 }`) o sarà `null` se il robot è inattivo.

**3. Aggiornamento del Motore di Gioco (`Game.js`):**
   - Il metodo `tick()` del gioco sarà il responsabile dell'esecuzione incrementale dei comandi attivi.
   - Per ogni robot, ad ogni tick, il gioco dovrà:
     1. Controllare se esiste un `activeCommand`.
     2. Se sì, calcolare lo spostamento/rotazione per il tick corrente in base alla velocità specificata.
     3. Aggiornare la posizione/rotazione del robot.
     4. Decrementare la distanza/angolo rimanente nel comando.
     5. Se la distanza/angolo rimanente è <= 0, il comando è completato. Il `activeCommand` del robot viene impostato a `null` e viene generato un evento di completamento.

**4. Sistema di Eventi:**
   - Introdurre nuovi tipi di eventi che l'IA potrà ricevere tramite `api.getEvents()`:
     - `MOVE_COMPLETED`: Generato quando un'azione `api.move()` termina.
     - `ROTATION_COMPLETED`: Generato quando un'azione `api.rotate()` termina.
     - `ACTION_STOPPED`: Generato quando un'azione viene interrotta da `api.stop()`.

**5. Refactoring della Logica IA (`DefaultAI.js`):**
   - Il metodo `run(api)` non sarà più un diagramma di flusso rigido eseguito ad ogni tick.
   - Diventerà una macchina a stati che:
     - Controlla gli eventi in arrivo (es. `ENEMY_HIT`, `MOVE_COMPLETED`).
     - Se non c'è un'azione in corso e si verifica una condizione (es. nemico avvistato), avvia un nuovo comando asincrono (es. `api.rotate(...)`).
     - Attende l'evento di completamento (`ROTATION_COMPLETED`) per decidere l'azione successiva (es. `api.move(...)`).

---

## Evoluzione 2: Coda di Comandi e API di Alto Livello

**Data:** (Proposta)

**Problema:**
L'attuale API asincrona è potente ma di basso livello. Comporre sequenze di azioni (es. "muoviti di 100px, poi ruota di 90 gradi") richiede allo sviluppatore di implementare manualmente una macchina a stati che ascolti gli eventi di completamento (`MOVE_COMPLETED`, `ROTATION_COMPLETED`) prima di poter inviare il comando successivo. Questo approccio è ripetitivo e soggetto a errori.

**Decisione:**
Introdurre una **coda di comandi (Command Queue)** gestita internamente dal robot e fornire **comandi API di più alto livello** che astra-gano le operazioni comuni.

**Prompt Guida per l'Implementazione:**

### **Obiettivo Primario:**
Semplificare la scrittura di IA complesse permettendo di accodare comandi e di usare funzioni che rappresentano intenti strategici (es. "vai in quel punto") invece di semplici movimenti primitivi.

### **Specifiche Tecniche Dettagliate:**

**1. Coda di Comandi nel `Robot`:**
   - Sostituire la proprietà `this.activeCommand` con una coda, es. `this.commandQueue = []`.
   - Il `commandSystem` del gioco processerà sempre il primo comando nella coda (`this.commandQueue[0]`).
   - Al completamento di un comando, questo verrà rimosso dalla coda, e il comando successivo (se presente) inizierà nel tick seguente.

**2. Evoluzione dell'API del Robot:**
   - I comandi `api.move(...)` e `api.rotate(...)` non falliranno più se un'azione è già in corso. Invece, **accoderanno** la nuova azione alla `commandQueue`.
   - Il comando `api.stop()` avrà un comportamento aggiornato: interromperà il comando corrente e **svuoterà l'intera coda di comandi**, generando un singolo evento `ACTION_STOPPED`.
   - Introdurre un nuovo comando `api.clearQueue()` che svuota la coda senza interrompere l'azione corrente.

**3. Nuovi Comandi API di Alto Livello:**
   - **`api.moveTo(x, y, speedPercentage)`**: Un comando composto che astrae la navigazione.
     - **Comportamento (Implementazione Semplice):** Calcola l'angolo necessario per puntare alle coordinate `(x, y)` e la distanza da percorrere. Accoda automaticamente un comando `rotate` seguito da un comando `move`.
     - **Nota:** Questa implementazione iniziale non tiene conto degli ostacoli. Una soluzione completa richiede un sistema di pathfinding (vedi Evoluzione 3).
   - **`api.aimAt(x, y, speedPercentage)`**: Un comando per la mira.
     - **Comportamento:** Simile a `moveTo`, ma accoda solo il comando `rotate` necessario per puntare alle coordinate `(x, y)`.

**4. Vantaggi dell'Evoluzione:**
   - **IA Dichiarativa:** Lo sviluppatore può descrivere una sequenza di azioni in modo semplice e leggibile: `api.moveTo(100, 200); api.fire();`.
   - **Riduzione del Boilerplate:** Elimina la necessità di scrivere codice per la gestione degli eventi di completamento per semplici sequenze.
   - **Migliore Leggibilità:** Il codice dell'IA diventa più facile da capire, in quanto esprime intenzioni strategiche di più alto livello.

---

## Evoluzione 3: Pathfinding e Navigazione Intelligente

**Data:** (Proposta)

**Problema:**
Il comando `moveTo(x, y)` proposto nell'Evoluzione 2 è ingenuo e fallisce in presenza di ostacoli. Un bot che esegue semplicemente un `rotate` e un `move` si bloccherà contro il primo muro o ostacolo sul suo percorso.

**Decisione:**
Implementare un sistema di **pathfinding** basato su una griglia per consentire una navigazione intelligente. L'algoritmo scelto è **A* (A-star)** per il suo equilibrio tra performance e ottimalità del percorso.

**Prompt Guida per l'Implementazione:**

**1. Rappresentazione dell'Arena come Griglia (Navigation Grid):**
   - Creare una classe o un sistema (es. `navigationGrid.js`) che converta lo spazio continuo dell'arena in una griglia discreta.
   - Ogni cella della griglia può essere "calpestabile" o "bloccata".
   - Le celle che si sovrappongono a ostacoli o ai bordi dell'arena (tenendo conto del raggio del robot) devono essere marcate come "bloccate".

**2. Implementazione dell'Algoritmo A*:**
   - Creare un sistema (`pathfindingSystem.js`) che implementi l'algoritmo A*.
   - La funzione `findPath(startCoords, endCoords)` prenderà le coordinate di partenza e di arrivo, le mapperà sulla griglia e restituirà un array di coordinate (waypoint) che rappresentano il percorso più breve, o `null` se non esiste un percorso.

**3. Aggiornamento dell'API `moveTo(x, y)`:**
   - Quando l'IA chiama `api.moveTo(x, y)`, il sistema internamente eseguirà i seguenti passaggi:
     1. Chiama `pathfindingSystem.findPath()` per ottenere la lista di waypoint.
     2. Se viene trovato un percorso, converte la lista di waypoint in una sequenza di comandi `rotate` e `move`.
     3. Accoda questi comandi nella `commandQueue` del robot.
     - Esempio: un percorso `[A, B, C]` viene tradotto in: `api.aimAt(B.x, B.y)`, `api.move(dist(A,B))`, `api.aimAt(C.x, C.y)`, `api.move(dist(B,C))`.

**4. Gestione delle Interruzioni:**
   - La logica rimane reattiva. Se il bot subisce un attacco mentre segue un percorso, l'IA può chiamare `api.stop()` per svuotare la coda di comandi di navigazione e passare a una logica di combattimento o evasione.