# Tutorial: Creare il Tuo Primo Bot

Benvenuto! Questo tutorial ti guiderà passo dopo passo nella creazione di un'intelligenza artificiale (IA) per il tuo primo robot. Imparerai a implementare una logica di base che permette al tuo bot di cercare il nemico, attaccarlo quando lo trova e tentare di schivare i colpi.

Utilizzeremo i concetti fondamentali dell'API, come la **coda di comandi**, gli **eventi** e una **macchina a stati**.

---

## Passo 1: La Struttura di Base

Ogni IA è un oggetto JavaScript con due elementi principali:

1.  Un oggetto `state` per memorizzare informazioni tra un tick e l'altro (come lo stato attuale del bot).
2.  Una funzione `run(api)` che viene eseguita ad ogni tick del gioco.

Copia questo scheletro migliorato nell'editor. Introduce `api.log` per il debug e `lastKnownEnemyPosition` per ricordare dove abbiamo visto il nemico l'ultima volta.

```javascript
({
  // L'oggetto 'state' mantiene i dati tra i tick.
  state: {},

  /**
   * La funzione run viene chiamata ad ogni tick del gioco.
   * @param {object} api - L'API per controllare il tuo bot.
   */
  run: function (api) {
    // Inizializzazione al primo tick.
    if (typeof this.state.current === "undefined") {
      this.state.current = "SEARCHING"; // Inizia cercando il nemico
      this.state.lastKnownEnemyPosition = null; // Memorizza l'ultima posizione nota del nemico
      api.log("Bot inizializzato. Stato iniziale: SEARCHING");
    }

    // Qui inseriremo la logica della nostra macchina a stati.
  },
});
```

---

## Passo 2: La Macchina a Stati

Una macchina a stati è un modo eccellente per organizzare la logica del bot. Il nostro bot avrà tre stati principali:

- **`SEARCHING`**: Il bot si muove nell'arena alla ricerca del nemico.
- **`ATTACKING`**: Il bot ha trovato il nemico, lo mira e gli spara.
- **`EVADING`**: Il bot è stato colpito e tenta una manovra evasiva.

Aggiungiamo la struttura `switch` all'interno della funzione `run` per gestire questi stati.

```javascript
run: function (api) {
  // ... (codice di inizializzazione)...

  // Logica della macchina a stati
  switch (this.state.current) {
    case 'SEARCHING':
      // Logica per quando stiamo cercando
      break;

    case 'ATTACKING':
      // Logica per quando stiamo attaccando
      break;

    case 'EVADING':
      // Logica per quando stiamo schivando
      break;
  }
}
```

Ora dobbiamo gestire le _transizioni_, ovvero come passare da uno stato all'altro. Le transizioni sono guidate dagli **eventi**.

Aggiungi questo codice **prima** dello `switch` per gestire gli eventi principali:

```javascript
// ... (codice di inizializzazione)

const events = api.getEvents();

// --- Gestione delle Transizioni di Stato ---

// Se veniamo colpiti, passiamo sempre allo stato di evasione.
if (events.some((e) => e.type === "HIT_BY_PROJECTILE")) {
  this.state.current = "EVADING";
  api.stop(); // Svuota la coda di comandi per reagire subito!
  console.log("Colpito! Nuovo stato: EVADING");
}

// Se rileviamo un nemico che non era visibile prima, passiamo all'attacco.
// L'evento viene generato solo al primo avvistamento, non ad ogni tick.
if (events.some((e) => e.type === "ENEMY_DETECTED")) {
  this.state.current = "ATTACKING";
  api.stop(); // Interrompe l'azione di ricerca per attaccare.
  console.log("Nemico rilevato! Nuovo stato: ATTACKING");
}

// ... (codice dello switch)
```

---

## Passo 3: Implementare lo Stato `SEARCHING`

Nello stato `SEARCHING`, la logica è:
1.  Se vediamo il nemico, passiamo subito ad `ATTACKING`.
2.  Se abbiamo un'`lastKnownEnemyPosition`, andiamo lì per investigare.
3.  Altrimenti, pattugliamo un punto casuale.

Usiamo `api.isQueueEmpty()` per assicurarci di dare un nuovo comando solo quando il bot ha finito il movimento precedente.

```javascript
case 'SEARCHING':
  // Controlla sempre se il nemico è visibile, anche senza l'evento ENEMY_DETECTED.
  if (api.scan()) {
    this.state.current = 'ATTACKING';
    api.stop();
    break;
  }

  // Se abbiamo perso il nemico, andiamo a controllare la sua ultima posizione nota.
  if (this.state.lastKnownEnemyPosition && api.isQueueEmpty()) {
    api.log("Investigo sull'ultima posizione nota del nemico...");
    api.moveTo(this.state.lastKnownEnemyPosition.x, this.state.lastKnownEnemyPosition.y);
    this.state.lastKnownEnemyPosition = null; // Controlla solo una volta
    break;
  }

  // Se il bot è inattivo, digli di muoversi verso un punto casuale.
  if (api.isQueueEmpty()) {
    const arena = api.getArenaDimensions();
    const randomX = Math.random() * arena.width;
    const randomY = Math.random() * arena.height;

    api.log(`Pattugliamento: mi muovo verso ${Math.round(randomX)}, ${Math.round(randomY)}`);
    api.moveTo(randomX, randomY);
  }
  break;
```

La transizione allo stato `ATTACKING` è già gestita dall'evento `ENEMY_DETECTED` che abbiamo definito prima. Semplice, no?

---

## Passo 4: Implementare lo Stato `ATTACKING`

Quando siamo in `ATTACKING`, la nostra logica è:

1.  Controlla se il nemico è ancora visibile. Se no, torna a `SEARCHING`.
2.  Se il bot è inattivo, mira al nemico.
3.  Quando la mira è completata (`ROTATION_COMPLETED`), spara e pianifica una mossa laterale.

```javascript
case 'ATTACKING':
  const enemy = api.scan();

  // Se perdiamo il bersaglio, torniamo a cercare.
  if (!enemy) {
    this.state.current = 'SEARCHING';
    console.log('Nemico perso. Torno in stato: SEARCHING');
    break;
  }

  // Se la coda è libera, il nostro primo obiettivo è mirare.
  if (api.isQueueEmpty()) {
    console.log('Miro al nemico...');
    api.aimAt(enemy.x, enemy.y);
  }

  // Se abbiamo appena finito di mirare, è il momento di sparare!
  if (events.some(e => e.type === 'ROTATION_COMPLETED')) {
    console.log('Mira completata. Fuoco!');
    api.fire(); // Azione istantanea

    // Dopo aver sparato, facciamo una piccola mossa laterale per schivare.
    // La coda è di nuovo libera, quindi possiamo accodare nuovi comandi.
    api.rotate(90);
    api.move(100);
  }
  break;
```

---

## Passo 5: Implementare lo Stato `EVADING`

La transizione a `EVADING` avviene quando veniamo colpiti. In quel momento, `api.stop()` ha già svuotato la coda di comandi.
Il nostro compito qui è accodare una semplice manovra evasiva e, una volta completata, tornare a cercare il nemico.

```javascript
case 'EVADING':
  // La transizione a questo stato ha già chiamato api.stop().
  // La coda è vuota, quindi possiamo accodare una manovra evasiva.
  if (api.isQueueEmpty()) {
    console.log('Eseguo manovra evasiva...');
    api.rotate(-90, 100); // Gira velocemente a sinistra
    api.move(150, 100);   // Scatta in avanti
  }

  // Una volta che la manovra evasiva è completa, torniamo a cercare.
  if (events.some(e => e.type === 'MOVE_COMPLETED')) {
    this.state.current = 'SEARCHING';
    console.log('Manovra completata. Torno in stato: SEARCHING');
  }
  break;
```

---

## Passo 6: Mettere Tutto Insieme

Ecco il codice completo per il tuo primo bot. Puoi copiarlo e incollarlo nell'editor del gioco e premere "Update & Restart" per vederlo in azione!

```javascript
({
  state: {},

  run: function (api) {
    // Inizializzazione
    if (typeof this.state.current === "undefined") {
      this.state.current = "SEARCHING";
      console.log("Bot inizializzato. Stato iniziale: SEARCHING");
    }

    const events = api.getEvents();

    // --- Gestione delle Transizioni di Stato ---
    if (events.some((e) => e.type === "HIT_BY_PROJECTILE")) {
      this.state.current = "EVADING";
      api.stop();
      console.log("Colpito! Nuovo stato: EVADING");
    }

    // Se rileviamo un nemico che non era visibile prima, passiamo all'attacco.
    if (events.some((e) => e.type === "ENEMY_DETECTED")) {
      this.state.current = "ATTACKING";
      api.stop();
      console.log("Nemico rilevato! Nuovo stato: ATTACKING");
    }

    // --- Logica della Macchina a Stati ---
    switch (this.state.current) {
      case "SEARCHING":
        if (api.isQueueEmpty()) {
          const arena = api.getArenaDimensions();
          const randomX = Math.random() * arena.width;
          const randomY = Math.random() * arena.height;
          console.log(
            `Pattugliamento: mi muovo verso ${Math.round(
              randomX
            )}, ${Math.round(randomY)}`
          );
          api.moveTo(randomX, randomY);
        }
        break;

      case "ATTACKING":
        const enemy = api.scan();
        if (!enemy) {
          this.state.current = "SEARCHING";
          console.log("Nemico perso. Torno in stato: SEARCHING");
          break;
        }

        if (api.isQueueEmpty()) {
          console.log("Miro al nemico...");
          api.aimAt(enemy.x, enemy.y);
        }

        if (events.some((e) => e.type === "ROTATION_COMPLETED")) {
          console.log("Mira completata. Fuoco!");
          api.fire();
          api.rotate(90);
          api.move(100);
        }
        break;

      case "EVADING":
        if (api.isQueueEmpty()) {
          console.log("Eseguo manovra evasiva...");
          api.rotate(-90, 100);
          api.move(150, 100);
        }

        if (events.some((e) => e.type === "MOVE_COMPLETED")) {
          this.state.current = "SEARCHING";
          console.log("Manovra completata. Torno in stato: SEARCHING");
        }
        break;
    }
  },
});
```

## Prossimi Passi

Congratulazioni! Hai creato il tuo primo bot funzionante. Ora puoi iniziare a sperimentare:

- Migliora la manovra evasiva.
- Rendi più intelligente la logica di attacco (es. `kiting` o `strafing`).
- Gestisci l'energia in modo più efficiente.

Consulta la `api.md` per scoprire tutte le funzioni a tua disposizione. Buon divertimento!
