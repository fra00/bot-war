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

### 2. Transizioni (Archi)

- **Cosa sono**: Una transizione è una regola che determina quando il bot deve passare da uno stato a un altro. È rappresentata da una freccia (arco) che collega due nodi.
- **Creazione**: Clicca e trascina il pallino sul lato destro di un nodo (sorgente) e collegalo al pallino sul lato sinistro di un altro nodo (destinazione).
- **Modifica**: Fai **doppio clic** su una transizione per aprirne l'editor. Qui puoi definire:
  - **Etichetta**: Una breve descrizione della transizione (es. "Nemico avvistato").
  - **Condizione**: Una funzione JavaScript che deve restituire `true` affinché la transizione avvenga. Se ritorna `false`, il bot rimane nello stato corrente. Esempio: `(api, memory, context) => context.enemy != null`.

### 3. Transizioni Globali

- **Cosa sono**: Sono transizioni speciali che hanno la **massima priorità**. Vengono controllate ad ogni tick, indipendentemente dallo stato in cui si trova il bot.
- **Utilità**: Perfette per gestire eventi critici che devono interrompere qualsiasi altra azione, come essere colpiti da un proiettile (`EVADING`) o rimanere incastrati (`UNSTUCKING`).
- **Gestione**: Usa il pannello a destra per aggiungere, modificare o eliminare le transizioni globali. La logica è identica a quella delle transizioni normali (etichetta e condizione).

---

## Flusso di Esecuzione

Ad ogni tick di gioco, il motore dell'IA esegue i seguenti controlli in ordine:

1.  **Controlla le Transizioni Globali**: Scorre l'elenco dall'alto verso il basso. La prima transizione la cui condizione è `true` viene eseguita, e il bot cambia stato.
2.  **Controlla le Transizioni dello Stato Corrente**: Se nessuna transizione globale è scattata, controlla le transizioni in uscita dallo stato attuale. La prima la cui condizione è `true` viene eseguita.
3.  **Esegue `onExecute`**: Se nessuna transizione (globale o locale) è scattata, il bot rimane nello stato corrente ed esegue la logica definita in `onExecute`.

---

## Sincronizzazione con l'Editor di Codice

- **Da Codice a Visuale**: Quando passi alla vista "Visuale", il sistema analizza il tuo codice. Se è una macchina a stati valida (con una proprietà `states`), genera automaticamente il grafo. Se il codice non è valido, riceverai un errore.
- **Da Visuale a Codice**: Quando salvi le modifiche fatte nell'editor visuale, il sistema genera automaticamente il codice JavaScript corrispondente e lo salva.

**Importante**: Ricorda sempre di **salvare le modifiche** prima di passare da una vista all'altra per evitare di perdere il lavoro.
