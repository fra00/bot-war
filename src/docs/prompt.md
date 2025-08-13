# Guida alla Creazione di Prompt per LLM

Questo documento è una guida pratica per aiutarti a creare prompt efficaci per un Large Language Model (LLM) come Gemini, ChatGPT, etc. L'obiettivo è ottenere un codice JavaScript di alta qualità per l'intelligenza artificiale del tuo bot, che sia funzionante e rispetti l'architettura del gioco.

## Contesto Generale

Puoi copiare e incollare la struttura sottostante e riempire la sezione "La Tua Missione" con la strategia che desideri.

---

## Modello di Prompt da Copiare

````markdown
### Contesto e Obiettivo

Sei un ingegnere software senior specializzato in intelligenza artificiale per videogiochi. Il tuo compito è scrivere il codice JavaScript per l'IA di un robot da combattimento autonomo.

L'output deve essere un **singolo blocco di codice JavaScript** contenente un oggetto letterale. Questo oggetto verrà valutato dinamicamente dal motore di gioco. Deve avere una struttura specifica e utilizzare un'API ben definita per interagire con il mondo di gioco.

### 1. API di Riferimento (Funzioni Disponibili)

L'IA del bot si basa su una **macchina a stati finiti (FSM) dichiarativa** e interagisce con il gioco tramite un oggetto `api` globale.

#### Regole Strette per l'Uso dell'API

- **NON** inventare funzioni che non sono in questa lista.
- **NON** assumere che le funzioni accettino parametri non documentati.
- Presta attenzione ai tipi di ritorno e gestisci i casi in cui una funzione restituisce `null` o `undefined`.
 - Il codice deve essere **autocontenuto** all'interno dell'oggetto letterale. Non definire variabili o funzioni esterne.

```javascript
const api = {
  // =================================================================
  // AZIONI DI DEBUG
  // =================================================================

  /**
   * Registra un messaggio o un oggetto nel pannello di log del bot.
   * @param {...any} args - Argomenti da registrare.
   */
  log: (...args) => {},

  // =================================================================
  // AZIONI DI MOVIMENTO E MIRA (ASINCRONE, IN CODA)
  // =================================================================

  /**
   * Accoda un'azione di movimento per una distanza specifica.
   * @param {number} distance - Distanza in pixel. Negativo per andare indietro.
   * @param {number} [speedPercentage=100] - Percentuale della velocità massima.
   */
  move: (distance, speedPercentage = 100) => {},

  /**
   * Calcola un percorso e accoda i comandi per raggiungere una destinazione.
   * @param {number} targetX - Coordinata X di destinazione.
   * @param {number} targetY - Coordinata Y di destinazione.
   * @param {number} [speedPercentage=100] - Velocità da usare.
   * @returns {boolean} - True se un percorso è stato trovato, altrimenti false.
   */
  moveTo: (targetX, targetY, speedPercentage = 100) => {},

  /**
   * Accoda un'azione di rotazione di un angolo specifico.
   * @param {number} angle - Angolo in gradi. Positivo per senso orario.
   * @param {number} [speedPercentage=100] - Percentuale della velocità di rotazione.
   */
  rotate: (angle, speedPercentage = 100) => {},

  /**
   * Comando "continuo" per mirare a una destinazione. Se chiamato ad ogni tick,
   * il bot correggerà la sua mira verso il bersaglio. Interrompe altre azioni
   * di movimento/rotazione per dare priorità alla mira.
   * @param {number} targetX - Coordinata X del bersaglio.
   * @param {number} targetY - Coordinata Y del bersaglio.
   * @param {number} [speedPercentage=100] - Velocità di rotazione.
   */
  aimAt: (targetX, targetY, speedPercentage = 100) => {},

  /**
   * Interrompe immediatamente il comando in esecuzione e svuota la coda.
   * @param {string} [source="AI_REQUEST"] - Identificativo della causa dello stop.
   */
  stop: (source = "AI_REQUEST") => {},

  /**
   * Accoda una serie di comandi personalizzati da eseguire in sequenza.
   * @param {Array<Object>} actions - Array di oggetti azione.
   */
  sequence: (actions) => {},

  // =================================================================
  // AZIONI DI COMBATTIMENTO (SINCRONE, IMMEDIATE)
  // =================================================================

  /**
   * Spara un proiettile nella direzione attuale. Azione istantanea.
   * Ha un costo in energia e un tempo di ricarica.
   */
  fire: () => {},

  // =================================================================
  // PERCEZIONE E SENSORI
  // =================================================================

  /**
   * Restituisce il risultato dell'ultima scansione radar.
   * @returns {{id: string, x: number, y: number, distance: number, angle: number} | null} - Dati del nemico o null.
   */
  scan: () => {},

  /**
   * Restituisce una lista di ostacoli nel raggio del radar.
   * @returns {Array<{id: string, x: number, y: number, width: number, height: number, distance: number}>}
   */
  scanObstacles: () => [],

  /**

};
```
````

### 2. Struttura del Codice Richiesta

L'IA deve essere un oggetto JavaScript che implementa una **macchina a stati finiti (FSM)**. Usa l'esempio seguente come riferimento per la struttura del codice.

```javascript
({
  config: {
    /* ... */
  },
  globalTransitions: [
    /* ... */
  ],
  states: {
    NOME_STATO: {
      onEnter(api, memory, context) {
        /* ... */
      },
      onExecute(api, memory, events, context) {
        /* ... */
      },
      onExit(api, memory) {
        /* ... */
      },
      transitions: [
        /* ... */
      ],
    },
    // ... altri stati
  },
  setCurrentState: function (newState, api, context = {}) {
    /* ... */
  },
  run: function (api) {
    /* ... */
  },
});
```

### 3. La Tua Missione

Ora, basandoti sull'API fornita e sulla struttura richiesta, crea una **nuova** IA per il bot.

**Strategia richiesta:**

> **[INSERISCI QUI LA TUA STRATEGIA. Esempio sotto]**
>
> **Crea un bot 'cecchino' difensivo.** La sua priorità è trovare un buon punto di copertura (preferibilmente un angolo dell'arena), rimanere fermo e sparare solo a nemici a lunga distanza. Deve avere uno stato `REPOSITIONING` per fuggire e trovare una nuova copertura se un nemico si avvicina troppo (es. a meno di 150 pixel) o se la sua linea di tiro è costantemente bloccata.

### Criteri di Successo

- [ ] Il codice fornito è un singolo oggetto JavaScript valido, racchiuso tra `({` e `})`.
- [ ] Il codice utilizza **solo** le funzioni definite nella sezione "API di Riferimento".
- [ ] La macchina a stati è robusta, con uno stato di default (es. `SEARCHING_COVER`) e gestisce correttamente le transizioni.
- [ ] La logica gestisce il caso in cui `api.scan()` restituisce `null` (nemico non visibile).
- [ ] Non vengono definite funzioni o variabili al di fuori dell'oggetto principale.
- [ ] Il codice è ben commentato per spiegare le decisioni strategiche più importanti.

```

```
