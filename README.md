# Bot War: AI Coding Game

[![Netlify Status](https://api.netlify.com/api/v1/badges/a1b2c3d4-e5f6-7890-abcd-1234567890ab/deploy-status)](https://app.netlify.com/sites/ai-botwars/deploys)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/fra00/bot-war/blob/main/LICENSE)

Un gioco di programmazione che unisce la sfida della codifica con l'emozione della strategia in tempo reale. Hai mai sognato di costruire un robot da combattimento? E se ti dicessi che puoi programmare la sua intelligenza, definire le sue tattiche e poi guardarlo combattere per la supremazia in un'arena virtuale?

<p align="center">
  <a href="https://ai-botwars.netlify.app/" target="_blank"><strong>🚀 Prova la Live Demo 🚀</strong></a>
</p>

<p align="center">
  <img src="https://ai-botwars.netlify.app/preview.png" alt="Screenshot di Bot War che mostra l'editor e l'arena" width="800"/>
</p>

## Cos'è Bot War?

Bot War non è un gioco in cui controlli direttamente il tuo personaggio. Al contrario, il tuo compito è molto più profondo e stimolante: **scrivere il cervello del tuo bot**.

Utilizzando JavaScript, scrivi uno script di intelligenza artificiale che detterà ogni mossa, ogni scansione radar e ogni colpo sparato dal tuo bot. Una volta che sei soddisfatto del tuo codice, lo carichi nell'arena e assisti allo scontro. Vincerà la tua logica? O verrai surclassato da un avversario con una strategia migliore?

Il ciclo di gioco è semplice ma incredibilmente coinvolgente:

1.  **Coda**: Apri l'editor di codice integrato e scrivi o modifica la tua IA.
2.  **Compila**: Con un clic, il tuo script viene "compilato" e caricato nel tuo bot.
3.  **Combatti**: Avvia la simulazione e guarda la tua creazione prendere vita. Analizza le sue decisioni, i suoi punti di forza e le sue debolezze.
4.  **Migliora**: Hai notato un difetto? Il tuo bot è troppo aggressivo o troppo timido? Torna all'editor, affina la tua logica e riprova.

---

## A Chi si Rivolge?

-   **Sviluppatori e Appassionati di Codice**: Se ami programmare, troverai in Bot War un sandbox perfetto per sperimentare algoritmi, macchine a stati e strategie complesse in un ambiente divertente e visivo.
-   **Studenti di Programmazione**: Quale modo migliore per imparare JavaScript se non applicandolo a un problema concreto e vedendo i risultati immediati delle tue righe di codice?
-   **Appassionati di Strategia**: Se ami i giochi che richiedono pianificazione e pensiero critico, Bot War offre una sfida unica. La battaglia si vince nell'editor, prima ancora che nell'arena.

---

## Caratteristiche Principali

### Editor di Codice Professionale
Grazie all'integrazione con **Monaco Editor** (il motore dietro a VS Code), avrai a disposizione un'esperienza di sviluppo di prima classe direttamente nel browser, con evidenziazione della sintassi e un layout reattivo.

### Una Potente API per il Tuo Bot
Non stai scrivendo codice al buio. Il tuo bot ha accesso a una ricca API per interagire con il mondo di gioco. Alcune delle azioni che puoi comandare includono:

-   `api.scan()`: Cerca il nemico con il radar.
-   `api.fire()`: Spara un colpo se il cannone è pronto.
-   `api.moveTo(x, y)`: Muoviti verso una coordinata, evitando gli ostacoli.
-   `api.getMemory()`: Salva e recupera dati tra un "tick" di gioco e l'altro, per creare strategie complesse.
-   `api.getEvents()`: Reagisci a eventi come "essere colpito" o "collisione con un muro".

### Impara da una Base Solida
Non sai da dove cominciare? Nessun problema! Ogni nuovo giocatore parte con `DefaultAIBase`, un'intelligenza artificiale di base ben commentata e strutturata come una **macchina a stati finiti (FSM)**.

Questa IA include stati come `SEARCHING`, `ATTACKING`, `KITING` (mantenere la distanza sparando) e `EVADING`, fornendo un esempio perfetto di come strutturare una logica complessa e un ottimo punto di partenza per le tue personalizzazioni.

### Feedback Istantaneo e Debug
Ogni bot ha una propria console di log. Usa `api.log()` nel tuo codice per tracciare le decisioni del tuo bot in tempo reale, capire perché ha scelto un determinato stato o perché una manovra non è andata come previsto. Questo ciclo di feedback rapido è essenziale per l'iterazione e il miglioramento.

---

## Stack Tecnologico

Bot War è costruito con un moderno stack tecnologico:

-   **React** per la creazione di un'interfaccia utente reattiva e componibile.
-   **Vite** come build tool per un'esperienza di sviluppo fulminea.
-   **TailwindCSS** per uno styling rapido e consistente.
-   La logica del gioco è scritta in **JavaScript puro**, completamente disaccoppiata dalla UI, il che la rende robusta e testabile.

## Getting Started (Sviluppo Locale)

Per eseguire il progetto localmente e visualizzare lo showcase dei componenti:

1.  **Clona il repository:**

    ```bash
    git clone https://github.com/tuo-utente/bot-war.git
    cd bot-war
    ```

2.  **Installa le dipendenze:**

    ```bash
    npm install
    ```

3.  **Avvia il server di sviluppo:**
    ```bash
    npm run dev
    ```
    Questo avvierà il server di sviluppo e aprirà l'applicazione nel tuo browser.

---

## Mettiti alla Prova!

Sei pronto a costruire il bot da combattimento definitivo? Che tu voglia creare un aggressore implacabile, un cecchino tattico o un evasore inafferrabile, l'arena ti aspetta. Il progetto è in continua evoluzione e ogni feedback è prezioso. Tuffati nell'editor, dai vita al tuo codice e che il bot migliore vinca!
