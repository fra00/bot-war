# Architettura Multiplayer per Bot War: Un'Analisi Tecnica

## 1. Introduzione

Questo documento analizza diverse architetture per estendere Bot War a un'esperienza multiplayer, dove i bot creati da diversi utenti possono scontrarsi. L'obiettivo è esplorare la fattibilità, le sfide tecniche, le tecnologie consigliate e i compromessi di ogni approccio, con un'attenzione particolare alla possibilità di utilizzare piani di servizio gratuiti.

Questa analisi è il risultato di una discussione approfondita e serve come base di partenza per un'eventuale implementazione.

---

## 2. Modelli Architetturali

Abbiamo identificato diversi modelli architetturali, ognuno con i propri vantaggi e svantaggi. La scelta del modello dipende dagli obiettivi del progetto: velocità di prototipazione, equità competitiva o robustezza a lungo termine.

### Modello 0: Multiplayer Asincrono (Ghost Mode)

Questa è la soluzione più semplice e pragmatica per dare una sensazione di multiplayer senza affrontare la complessità della comunicazione in tempo reale. È l'ideale come primo passo.

**Flusso di Funzionamento:**

1.  **Database di Script:** Gli script AI creati dagli utenti vengono salvati in un database condiviso (es. Firebase Firestore).
2.  **Selezione dell'Avversario:** Invece di un matchmaking in tempo reale, il client scarica uno script casuale (o scelto da una lista) dal database.
3.  **Simulazione Interamente Locale:** Il gioco viene eseguito al 100% sul client del giocatore. Il `GameManager` locale carica l'IA del giocatore e l'IA "fantasma" scaricata.
4.  **Nessuna Comunicazione di Rete:** Durante la partita non avviene alcuna comunicazione di rete. È a tutti gli effetti una partita single-player, ma contro un'IA creata da un altro essere umano.

**Vantaggi:**

- **Implementazione Estremamente Semplice:** Richiede solo un backend per CRUD (Create, Read, Update, Delete) degli script.
- **Nessuna Complessità di Rete:** Elimina completamente i problemi di latenza, desincronizzazione e gestione delle collisioni in tempo reale.
- **Riutilizzo del Codice Esistente:** L'architettura attuale del gioco (`GameManager`, `compileAI`) supporta già questo modello quasi nativamente.
- **Scalabilità:** L'infrastruttura richiesta è minima e molto economica.

**Svantaggi:**

- **Mancanza di Interazione Dinamica:** Sebbene si combatta contro l'IA di un altro utente, non c'è un'interazione in tempo reale. L'IA del giocatore reagisce all'IA "fantasma", ma quest'ultima non può reagire dinamicamente alle azioni del giocatore all'interno della stessa partita. La battaglia è contro uno script pre-registrato, non contro un'entità che si adatta momento per momento.

#### 3.1. Protezione del Codice (Minificazione)

**Problema:**
La condivisione diretta degli script li espone al rischio di plagio. Un utente potrebbe scaricare l'IA di un avversario e copiarne le strategie.

**Soluzione Proposta:**
Introdurre un processo di **minificazione** al momento della "pubblicazione" (terser) di uno script. Questo rende il codice estremamente difficile da leggere e comprendere per un altro utente, pur rimanendo perfettamente funzionante per il motore di gioco.

**Flusso di Lavoro:**

1.  **Sviluppo Locale:** L'utente scrive e testa il proprio script con commenti e nomi di variabili chiari. Questa versione leggibile viene salvata solo localmente (o in una parte privata del database dell'utente).
2.  **Azione di "Pubblicazione":** L'utente clicca un pulsante "Pubblica per le Sfide".
3.  **Minificazione:** Il codice sorgente viene processato da un minificatore JavaScript (es. [Terser](https://terser.org/)). Questo strumento rimuove commenti, spazi, accorcia i nomi delle variabili, ecc.
4.  **Salvataggio Pubblico:** Solo la versione **minificata** dello script viene salvata nel database condiviso, pronta per essere scaricata da altri giocatori per le sfide "fantasma".

**Esempio:**

_Codice Originale:_

```javascript
({
  run: function (api) {
    // La mia strategia segreta per vincere
    let powerLevel = 9001;
    if (api.scan()) {
      api.fire();
    }
  },
});
```

_Codice Minificato (risultato salvato nel DB):_

```javascript
({
  run: function (n) {
    let o = 9001;
    n.scan() && n.fire();
  },
});
```

### Modello 1: L'Approccio Diretto (Client-Authoritative Semplice / "Postman")

Questo è il modello più semplice e veloce da implementare, ideale per un prototipo o un ambiente amatoriale.

**Flusso di Funzionamento:**

1.  **Nessuna Simulazione Condivisa:** Ogni client è responsabile al 100% della simulazione del _proprio_ bot. Il Client A non esegue la logica AI del Bot B e viceversa.
2.  **Calcolo Locale:** Al tick `T`, il Client A esegue la logica del Bot A e ne calcola il nuovo stato (posizione, rotazione, proiettili, ecc.).
3.  **Relay dei Dati:** Il Client A invia lo stato completo del suo bot a un server centrale.
4.  **Server "Postino":** Il server agisce come un semplice relay. Riceve lo stato dal Client A e lo inoltra al Client B (e viceversa).
5.  **Rendering dell'Avversario:** Il Client A riceve lo stato del Bot B e lo renderizza, "teletrasportando" di fatto il bot nemico nella sua nuova posizione.

**Architettura:**

```
+-----------+      +----------------+      +-----------+
| Client A  |----->| Server (Relay) |----->| Client B  |
| (Bot A)   |      | (es. Firebase) |      | (Bot B)   |
|           |<-----|                |<-----|           |
+-----------+      +----------------+      +-----------+
```

**Vantaggi:**

- **Sviluppo Rapidissimo:** È l'approccio più veloce per ottenere un'esperienza multiplayer visibile.
- **Nessun Problema di Determinismo:** Poiché non c'è una simulazione condivisa, problemi come la sincronizzazione di `Math.random()` sono irrilevanti.
- **Infrastruttura Leggera:** Il server ha un ruolo passivo e richiede pochissime risorse.

**Svantaggi e Sfide:**

- **Verità delle Collisioni:** La sfida principale. A causa della latenza di rete, ciò che un giocatore vede sul proprio schermo potrebbe non corrispondere a ciò che vede l'avversario. Se il Bot A spara dove vede il Bot B, ma il Bot B si era già spostato sul suo client, chi ha ragione? Questo crea discrepanze.
- **Vulnerabile al Cheating:** Un client malintenzionato può inviare dati falsi (es. energia infinita, posizione alterata), e il server non ha modo di validarli. **Nota:** Per un progetto amatoriale, questo è un problema accettabile e futuristico.

---

### Modello 2: L'Approccio Deterministico (Shared Simulation)

Questo modello tenta di risolvere le discrepanze facendo eseguire a entrambi i client la stessa identica simulazione.

**Flusso di Funzionamento:**

1.  **Seed Condiviso:** All'inizio della partita, il server genera un "seed" (un numero iniziale) e lo invia a entrambi i client.
2.  **Simulazione in Parallelo:** Entrambi i client inizializzano la loro istanza del gioco con lo stesso seed e la stessa configurazione della mappa.
3.  **Input Sincronizzati:** I client si scambiano solo gli "input" o le decisioni. Nel nostro caso, poiché l'IA è l'input, entrambi i client eseguono la logica di _entrambi_ i bot.
4.  **Risultato Identico:** Se la simulazione è perfettamente deterministica, lo stato del gioco su entrambi i client rimarrà identico ad ogni tick.

**Vantaggi:**

- **Consistenza:** Risolve il paradosso delle collisioni. Se un colpo va a segno su un client, va a segno anche sull'altro.
- **Traffico di Rete Ridotto (in teoria):** In giochi con input manuali, questo riduce il traffico. Nel nostro caso, il vantaggio è minore.

**Svantaggi e Sfide:**

- **Determinismo Perfetto:** È estremamente difficile da ottenere. Qualsiasi operazione non deterministica (come `Math.random()`, l'ordine di iterazione degli oggetti, o piccole differenze nell'aritmetica floating-point tra sistemi) può causare una desincronizzazione (desync) che rompe il gioco.
- **Soluzione al Determinismo:** Richiede l'uso di Generatori di Numeri Pseudo-Casuali (PRNG) inizializzati con il seed condiviso e un'attenzione maniacale a ogni dettaglio della simulazione.

---

### Modello 3: L'Approccio Robusto (Server Autorevole)

Questo è lo standard del settore per i giochi d'azione multiplayer competitivi. Risolve i problemi di cheating e di "verità" delle collisioni.

**Flusso di Funzionamento:**

1.  **Server come Unica Fonte della Verità:** L'intera simulazione di gioco (`GameManager`, `Game`, `Robot`, etc.) viene eseguita **esclusivamente sul server**.
2.  **Client "Stupidi":** I client diventano dei semplici visualizzatori. Non eseguono alcuna logica di gioco.
3.  **Invio dello Stato:** Ad ogni tick, il server calcola il nuovo stato del gioco e lo trasmette per intero a entrambi i client.
4.  **Rendering:** I client ricevono il `gameState` e si limitano a renderizzare ciò che il server ha comunicato.

**Architettura:**

```
+----------------------------------+
|          Server (Node.js)        |
|                                  |
|  +----------------------------+  |
|  |       Game Instance        |  |
|  | (Esegue game.tick())       |  |
|  +----------------------------+  |
+-----------------|----------------+
                  |
 (Broadcasts gameState at each tick)
                  |
       +----------+----------+
       |                     |
+------v-------+       +------v-------+
|   Client A   |       |   Client B   |
| (Renderer)   |       | (Renderer)   |
+--------------+       ++-------------+
```

**Vantaggi:**

- **A Prova di Cheating:** Poiché la logica è sul server, un client non può manipolare il proprio stato.
- **Consistenza Garantita:** Il server è l'unico arbitro. Risolve tutti i paradossi di collisione.
- **Esperienza Equa:** Tutti i giocatori sono soggetti alla stessa simulazione.

**Svantaggi e Sfide:**

- **Complessità Elevata:** Richiede un backend dedicato, la gestione di un'infrastruttura server e un refactoring significativo del codice client.
- **Costi di Hosting:** Un server persistente ha un costo (anche se minimo con le piattaforme moderne).
- **Gestione della Latenza:** Richiede tecniche come la _Client-Side Prediction_ e la _Server Reconciliation_ per far sentire il gioco reattivo nonostante il ritardo di rete.

---

## 3. Analisi delle Tecnologie (con Vincolo "Gratuito")

Per implementare un backend, specialmente per il Modello 3, la scelta tecnologica è cruciale.

#### Opzione A: Server Tradizionale (Express + Socket.IO)

- **Descrizione:** Un server Node.js custom che usa Express per le API e Socket.IO per la comunicazione WebSocket in tempo reale.
- **Pro:** Massimo controllo e flessibilità.
- **Contro (per il gratuito):** Richiede un hosting persistente. Piattaforme come Render.com o Fly.io offrono piani gratuiti, ma spesso mettono il server in "sleep" dopo un periodo di inattività, interrompendo le connessioni WebSocket e rendendolo inadatto per un game server sempre attivo.

#### Opzione B: Architettura Ibrida con Firebase (Scelta Consigliata)

Questo approccio massimizza l'uso del generoso piano gratuito di Firebase per aggirare i limiti dell'hosting gratuito di server custom.

- **Componenti:**

  1.  **Firebase Authentication:** Per la gestione degli utenti.
  2.  **Firestore:** Per salvare gli script AI e i dati dei giocatori.
  3.  **Firebase Realtime Database (RTDB):** Usato come bus di messaggi in tempo reale per sincronizzare il `gameState`.
  4.  **Server "Arbitro" Node.js:** Un processo leggerissimo, ospitato su un servizio gratuito (es. Render.com), che **non** gestisce le connessioni dei client. Il suo unico compito è eseguire i game loop delle partite attive e scrivere il risultato nel Realtime Database.

- **Flusso:**

  1.  I client si autenticano e si mettono in coda per il matchmaking (usando Firestore).
  2.  Il server "Arbitro" li abbina, crea una partita nel RTDB (es. `/matches/match123`).
  3.  L'Arbitro esegue il game loop e aggiorna costantemente `/matches/match123` con il nuovo `gameState`.
  4.  I client si iscrivono a quel percorso del RTDB e ricevono gli aggiornamenti in tempo reale, aggiornando la loro UI.

- **Perché funziona:** Si affida a Firebase, ottimizzato per la sincronizzazione a bassa latenza e con un piano gratuito robusto, per il lavoro pesante. Il server custom rimane così leggero da poter funzionare senza problemi sui piani gratuiti delle piattaforme PaaS.

---

## 4. Conclusione e Percorso Raccomandato

Per un progetto come Bot War, un approccio incrementale è la strategia migliore.

1.  **Fase 1: Multiplayer Asincrono (Ghost Mode)**

    - Implementare il **Modello 0**.
    - Utilizzare **Firebase Firestore** per creare un database condiviso di script AI.
    - Integrare un processo di **minificazione** per proteggere il codice degli utenti al momento della pubblicazione.
    - Modificare l'interfaccia per permettere di scaricare e combattere contro gli script di altri utenti.
    - **Obiettivo:** Fornire un'esperienza "multiplayer-like" con il minimo sforzo di sviluppo, validando l'interesse della community per la condivisione e la competizione tra IA.

2.  **Fase 2: Prototipo Multiplayer in Tempo Reale**

    - Se la Fase 1 ha successo, procedere con l'implementazione del **Modello 1 (Client-Authoritative Semplice)**.
    - Utilizzare **Firebase Realtime Database** come server di relay per i dati di posizione.
    - **Obiettivo:** Ottenere un'esperienza multiplayer in tempo reale, accettando le discrepanze nelle collisioni come un compromesso per una prototipazione rapida.

3.  **Fase 2: Evoluzione verso la Robustezza (se necessario)**

    - Se il progetto cresce e l'equità competitiva diventa una priorità, migrare verso il **Modello 3 (Server Autorevole)**.
    - Adottare l'**Architettura Ibrida con Firebase (Opzione B)** per bilanciare costi, scalabilità e complessità.
    - Questo richiederà di spostare la logica di `GameManager` e `Game` sul server "Arbitro" e trasformare il client React in un puro "renderer".

Questo percorso permette di ottenere risultati immediati e tangibili, lasciando aperta la porta a un'architettura più solida e professionale per il futuro.
