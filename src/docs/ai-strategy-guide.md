## Logica Avanzata e Macchine a Stati

La coda di comandi semplifica la creazione di sequenze di azioni, ma per una IA robusta è ancora essenziale una macchina a stati (State Machine).

**Nota:** Gli esempi in questa guida illustrano i concetti di base. Per un'implementazione più avanzata e robusta, si consiglia di studiare il codice di `DefaultAI.js`.

Perché usare una Macchina a Stati?

- Gestione della Strategia: La coda gestisce l'ESECUZIONE di una sequenza (es. "vai lì, poi girati"), ma la macchina a stati DECIDE QUALE sequenza eseguire in base alla situazione generale (es. "sto cercando", "sto attaccando", "sto scappando").
- Reattività: Una macchina a stati permette di reagire agli eventi in modo strutturato. Se vieni colpito (`HIT_BY_PROJECTILE`), puoi cambiare lo stato da `ATTACKING` a `EVADING`, chiamare `api.stop()` per cancellare la coda attuale e accodare una nuova sequenza di manovre evasive.

Esempio di Macchina a Stati Semplice

Immaginiamo una IA con tre stati: `SEARCHING`, `ATTACKING`, `EVADING`. La logica dell'IA manterrà una variabile, ad esempio `state.current`, per tracciare lo stato attuale tra un tick e l'altro.

-- Esempio di codice concettuale --

// Questo oggetto 'state' viene mantenuto tra i tick.
// Non è parte dell'API, ma della tua implementazione.
if (typeof state.current === 'undefined') {
state.current = 'SEARCHING';
}

const events = api.getEvents();

// Logica di transizione basata su eventi critici
if (events.some(e => e.type === 'HIT_BY_PROJECTILE')) {
state.current = 'EVADING';
api.stop(); // Interrompe l'azione corrente e svuota la coda.
// api.isQueueEmpty() sarà true al prossimo tick.
}

// Se il radar rileva un nemico che non era visibile nel tick precedente, passa all'attacco.
// L'evento ENEMY_DETECTED viene generato solo una volta per ogni "avvistamento".
if (events.some(e => e.type === 'ENEMY_DETECTED')) {
state.current = 'ATTACKING';
api.stop(); // Interrompe il pattugliamento per iniziare l'attacco
}

// Se il bot si scontra con un muro, deve sbloccarsi.
if (events.some(e => e.type === 'ACTION_STOPPED' && e.reason === 'COLLISION')) {
  state.current = 'UNSTUCKING';
  api.stop(); // Assicura che la coda sia pulita per la manovra di sblocco.
}

// Logica specifica per ogni stato
switch (state.current) {

case 'SEARCHING':
// Se la coda è libera, pianifica una nuova azione di pattugliamento.
// Un'implementazione più avanzata (come in DefaultAI.js) potrebbe prima
// controllare se esiste un'ultima posizione nota del nemico e dirigersi lì.
if (api.isQueueEmpty()) {
const arena = api.getArenaDimensions();
const randomX = Math.random() * arena.width;
const randomY = Math.random() * arena.height;
api.moveTo(randomX, randomY);
}

    break;

case 'ATTACKING':
    const enemy = api.scan();
    if (!enemy) {
      // Nemico perso, torna a cercarlo.
      // Un'IA avanzata salverebbe l'ultima posizione nota del nemico qui.
      state.current = 'SEARCHING';
      break;
    }

    // --- LOGICA DI FUOCO (ogni tick) ---
    // Spara se la mira è buona e la linea di tiro è libera.
    // Questa logica è indipendente dalla coda di comandi.
    if (enemy.angle < 5 && api.isLineOfSightClear(enemy)) {
      api.fire();
    }

    // --- LOGICA DI MOVIMENTO (solo quando il bot è inattivo) ---
    // Se il bot ha finito la sua sequenza di mosse precedente, ne pianifica una nuova.
    if (api.isQueueEmpty()) {
      // Prima di tutto, mira sempre al nemico.
      api.aimAt(enemy.x, enemy.y);

      // Poi, decidi come muoverti per mantenere una distanza ottimale (kiting).
      const optimalDistance = 250;
      const tooCloseDistance = 150;

      if (enemy.distance < tooCloseDistance) {
        api.move(-80); // Troppo vicino, arretra.
      } else if (enemy.distance > optimalDistance + 50) {
        api.move(80); // Troppo lontano, avvicinati.
      } else {
        // Se siamo alla distanza giusta, facciamo una mossa laterale (strafe).
        api.rotate(90);
        api.move(100);
      }
    }
    break;

case 'EVADING':
// La transizione a questo stato ha già chiamato api.stop().
// La coda è vuota, quindi possiamo accodare una manovra evasiva.
if (api.isQueueEmpty()) {
    // Una manovra più efficace usa valori casuali per essere meno prevedibile.
    const turnDirection = Math.random() < 0.5 ? 1 : -1;
    const randomAngle = 70 + Math.random() * 40;
    api.rotate(randomAngle * turnDirection, 100);
    api.move(150, 100);
}

    // Una volta che la manovra evasiva è completa, torna a cercare il nemico.
    if (events.some(e => e.type === 'MOVE_COMPLETED')) {
      state.current = 'SEARCHING';
    }
    break;

}

---

## Strategie Avanzate

La combinazione della coda di comandi e delle azioni istantanee permette di implementare manovre complesse. Ecco alcuni esempi concettuali.

Strafing (Movimento Laterale/Orbitale)

    Lo "strafing" consiste nel muoversi lateralmente rispetto al nemico per diventare un bersaglio più difficile, mantenendo la mira su di esso. Con un corpo rigido (dove la rotazione del corpo e della torretta sono un tutt'uno), questo si traduce in un movimento orbitale.

    L'idea è di accodare una sequenza di piccole rotazioni e movimenti per creare un arco.

    -- Esempio di codice concettuale --

    // All'interno di uno stato 'ATTACKING'

    const enemy = api.scan();
    if (!enemy) {
      // ... logica per tornare a cercare
      return;
    }

    // Se la coda è libera, pianifica la prossima mossa di strafing.
    if (api.isQueueEmpty()) {
      // 1. Prima mira al nemico. Questo è il primo comando nella coda.
      api.aimAt(enemy.x, enemy.y);

      // 2. Accoda una piccola rotazione per angolare il bot.
      // Il segno (+/-) determina la direzione dell'orbita (oraria/antioraria).
      api.rotate(25);

      // 3. Accoda un breve movimento in avanti per percorrere l'arco.
      api.move(80);

      // La sequenza è: mira, gira un po', avanza un po'.
      // Il ciclo si ripeterà quando la coda sarà di nuovo libera.
    }

    // Indipendentemente dalla coda, puoi sparare se la mira è buona.
    // L'angolo relativo del nemico (0 = di fronte) è utile qui.
    if (enemy.angle < 5 && api.isLineOfSightClear(enemy)) {
      api.fire(); // Azione istantanea, non influisce sulla coda.
    }

Kiting (Mantenere la Distanza)

    Il "kiting" è una tattica che consiste nel mantenere una distanza di sicurezza dal nemico, muovendosi per evitare i suoi colpi mentre si continua a sparare.

    -- Esempio di codice concettuale --

    const enemy = api.scan();
    if (!enemy) { /* ... */ return; }

    // Logica di fuoco istantanea, indipendente dal movimento
    if (enemy.angle < 5 && api.isLineOfSightClear(enemy)) {
      api.fire();
    }

    // Logica di movimento, solo se il bot non è già impegnato
    if (api.isQueueEmpty()) {
      const SAFE_DISTANCE = 200;
      const TOO_FAR_DISTANCE = 350;

      api.aimAt(enemy.x, enemy.y);
      if (enemy.distance < SAFE_DISTANCE) {
        api.move(-100); // Troppo vicino: arretra.
      } else if (enemy.distance > TOO_FAR_DISTANCE) {
        api.move(100); // Troppo lontano: avvicinati.
      }
    }

---

## Riepilogo e Best Practices

Scrivere una buona IA richiede di combinare la pianificazione sequenziale con la logica reattiva. Ecco i principi chiave da tenere a mente.

1.  **Usa una Macchina a Stati per la Strategia**
    La coda di comandi è eccellente per l'esecuzione _tattica_ di una sequenza (es. "vai lì, poi girati"). La tua logica principale, però, dovrebbe essere una macchina a stati che decide la _strategia_ (es. "ora sto cercando", "ora sto attaccando", "ora sto scappando"). Gli eventi (`HIT_BY_PROJECTILE`, `ENEMY_DETECTED`) dovrebbero guidare le transizioni tra questi stati.

2.  **Sii Reattivo, Non Rigido**
    Il campo di battaglia è imprevedibile. La tua priorità numero uno ad ogni tick è controllare gli eventi critici.

    - **Se vieni colpito (`HIT_BY_PROJECTILE`), la tua prima reazione dovrebbe quasi sempre essere `api.stop()`**. Questo interrompe qualsiasi piano precedente (svuotando la coda) e ti dà un foglio bianco per accodare una manovra evasiva.
    - Non dare per scontato che un comando `moveTo` andrà a buon fine. Potrebbe essere interrotto da una collisione o dalla mancanza di energia.
    - **Se il bot si scontra con qualcosa (`ACTION_STOPPED` con `reason: 'COLLISION'`), interrompi tutto e pianifica una manovra di sblocco**. Ignorare questo evento porterà il bot a tentare all'infinito la stessa mossa impossibile.

3.  **Gestisci lo Stato della Coda**
    Per evitare di accodare comandi in conflitto (es. due `moveTo` consecutivi perché il nemico si è spostato di poco), è fondamentale sapere se la coda è già occupata con una sequenza di azioni.

    - **Usa `api.isQueueEmpty()`**. Questo è il modo più pulito e affidabile. Prima di accodare una nuova _sequenza_ di azioni (come un `moveTo` o una serie di `move`/`rotate`), controlla se `api.isQueueEmpty()` è `true`. Questo assicura che il bot abbia completato il suo compito precedente prima di iniziarne uno nuovo.

4.  **Combina Azioni Istantanee e Comandi Accodati**
    Puoi (e dovresti) chiamare `api.scan()` e `api.fire()` _mentre_ un comando di movimento è in esecuzione. Una buona tattica è accodare un movimento laterale (`strafing`) e, ad ogni tick, controllare se la mira è allineata per chiamare `api.fire()` senza interrompere il movimento.

5.  **Pensa in Termini di Intenti, non di Primitivi**
    Invece di pensare "ruota di 37 gradi, poi muoviti di 150 pixel", pensa "vai verso il nemico" o, ancora meglio, "vai a quella coordinata".

    - Preferisci `api.moveTo(x, y)` e `api.aimAt(x, y)` rispetto a `move` e `rotate` quando possibile. Lascia che l'API di alto livello gestisca i calcoli complessi per te.

6.  **Non Bloccare il Loop di Esecuzione**
    La tua funzione `run(api)` viene eseguita ad ogni tick e deve completarsi rapidamente.
    - **Non usare mai cicli `while` o `for` per "attendere"** che qualcosa accada. Per le azioni a lunga durata, accoda un comando e gestisci il suo completamento tramite gli eventi nei tick successivi.
