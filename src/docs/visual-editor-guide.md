# Guida all'Editor Visuale

L'editor visuale ti permette di costruire l'intelligenza artificiale (IA) del tuo bot usando un'interfaccia grafica a nodi. Questo approccio si basa su una **Macchina a Stati Finiti (FSM - Finite State Machine)**, un modello potente e intuitivo per gestire la logica decisionale.

---

## Concetti Fondamentali

### 1. Stati (Nodi)

- **Cosa sono**: Uno stato rappresenta una specifica modalità di comportamento del tuo bot. Ad esempio, `ATTACKING`, `SEARCHING`, `EVADING`.
- **Creazione**: Clicca su **"Aggiungi Stato"** per creare un nuovo nodo nel grafo.
- **Modifica**: Fai **doppio clic** su un nodo per aprirne l'editor. Qui puoi:
  - **Cambiare il nome**: Scegli un nome descrittivo (es. `HUNTING_ENEMY`).
  - **Definire la logica**: Scrivere codice JavaScript per i cicli di vita dello stato:
    - `onEnter`: Eseguito una sola volta, quando il bot entra in questo stato. Utile per inizializzare variabili o eseguire azioni singole (es. `api.log('Inizio a cercare il nemico!')`).
    - `onExecute`: Eseguito ad ogni "tick" di gioco, finché il bot rimane in questo stato. È il cuore della logica continua (es. `api.fire()`).
    - `onExit`: Eseguito una sola volta, quando il bot esce da questo stato. Utile per pulire la memoria o resettare valori.

---

### 3. Parametri Disponibili nel Codice (`api`, `memory`, `context`, `events`)

Quando scrivi il codice per gli stati e le transizioni, hai accesso a diversi parametri che ti forniscono tutto il necessario per interagire con il gioco.

#### Firma delle Funzioni

- **Stati (Nodi):**
  - `onEnter(api, memory, context)`
  - `onExecute(api, memory, context, events)`
  - `onExit(api, memory)`
- **Transizioni (Archi e Globali):**
  - `condition(api, readOnlyMemory, context, events)`

#### Dettaglio dei Parametri

- `api` (Oggetto):
  L'interfaccia di programmazione per controllare il tuo bot. Contiene tutti i comandi che puoi impartire.

  - **Esempi:** `api.fire()`, `api.moveTo(x, y)`, `api.scan()`, `api.log('messaggio')`.
  - Per la lista completa, consulta la documentazione dell'API.

- `memory` (Oggetto):
  Un oggetto persistente che puoi usare per memorizzare informazioni tra un tick e l'altro. È la "memoria a lungo termine" del tuo bot.

  - **Esempi:** `memory.lastKnownEnemyPosition = {x: 100, y: 200};`, `memory.isHunting = true;`.
  - Usa `api.updateMemory({ ... })` per aggiornarlo in modo sicuro.

- `context` (Oggetto):
  Un oggetto che contiene informazioni calcolate e utili per il tick corrente. È la "memoria a breve termine" o la percezione attuale.

  - `context.enemy`: Contiene il risultato di `api.scan()`. È un oggetto `{ distance, angle, x, y }` se un nemico è visibile, altrimenti è `null`.
  - `context.batteryPercent`: La percentuale di batteria rimanente (da 0 a 100).
  - `context.config`: L'oggetto `config` che hai definito all'inizio della tua IA.

- `events` (Array di Oggetti):
  Un array che contiene tutti gli eventi accaduti nell'ultimo tick che riguardano il tuo bot. È fondamentale per creare una logica reattiva.
  - **Esempi di eventi:**
    - `{ type: 'HIT_BY_PROJECTILE', ... }`: Il tuo bot è stato colpito.
    - `{ type: 'SEQUENCE_COMPLETED', ... }`: Una sequenza di azioni (come un `moveTo`) è terminata.
    - `{ type: 'ENEMY_DETECTED', target: { ... } }`: Il radar ha rilevato un nemico che prima non era visibile.

---

### 4. Transizioni (Archi)

- **Cosa sono**: Una transizione è una regola che determina quando il bot deve passare da uno stato a un altro. È rappresentata da una freccia (arco) che collega due nodi.
- **Creazione**: Clicca e trascina il pallino sul lato destro di un nodo (sorgente) e collegalo al pallino sul lato sinistro di un altro nodo (destinazione).
- **Modifica**: Fai **doppio clic** su una transizione per aprirne l'editor. Qui puoi definire:
  - **Etichetta**: Una breve descrizione della transizione (es. "Nemico avvistato").
  - **Condizione**: Una funzione JavaScript che deve restituire `true` affinché la transizione avvenga. Se ritorna `false`, il bot rimane nello stato corrente. Esempio: `(api, memory, context) => context.enemy != null`.

### 5. Transizioni Globali

- **Cosa sono**: Sono transizioni speciali che hanno la **massima priorità**. Vengono controllate ad ogni tick, indipendentemente dallo stato in cui si trova il bot.
- **Utilità**: Perfette per gestire eventi critici che devono interrompere qualsiasi altra azione, come essere colpiti da un proiettile (`EVADING`) o rimanere incastrati (`UNSTUCKING`).
- **Gestione**: Usa il pannello a destra per aggiungere, modificare o eliminare le transizioni globali. La logica è identica a quella delle transizioni normali (etichetta e condizione).

---

## 6. Flusso di Esecuzione

Ad ogni tick di gioco, il motore dell'IA esegue i seguenti controlli in ordine:

1.  **Controlla le Transizioni Globali**: Scorre l'elenco dall'alto verso il basso. La prima transizione la cui condizione è `true` viene eseguita, e il bot cambia stato.
2.  **Controlla le Transizioni dello Stato Corrente**: Se nessuna transizione globale è scattata, controlla le transizioni in uscita dallo stato attuale. La prima la cui condizione è `true` viene eseguita.
3.  **Esegue `onExecute`**: Se nessuna transizione (globale o locale) è scattata, il bot rimane nello stato corrente ed esegue la logica definita in `onExecute`.

---

## 7. Sincronizzazione con l'Editor di Codice

- **Da Codice a Visuale**: Quando passi alla vista "Visuale", il sistema analizza il tuo codice. Se è una macchina a stati valida (con una proprietà `states`), genera automaticamente il grafo. Se il codice non è valido, riceverai un errore.
- **Da Visuale a Codice**: Quando salvi le modifiche fatte nell'editor visuale, il sistema genera automaticamente il codice JavaScript corrispondente e lo salva.

**Importante**: Ricorda sempre di **salvare le modifiche** prima di passare da una vista all'altra per evitare di perdere il lavoro.
