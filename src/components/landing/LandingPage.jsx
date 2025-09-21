import PropTypes from "prop-types";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

// Helper component for feature cards
const FeatureCard = ({ icon, title, children }) => (
  <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg backdrop-blur-sm">
    <div className="flex items-center mb-4">
      <span className="text-3xl mr-4 text-cyan-400">{icon}</span>
      <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
    <p className="text-gray-300">{children}</p>
  </div>
);

FeatureCard.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const LandingPage = ({ onStartGame }) => {
  const { user } = useAuth();

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      {/* Hero Section con immagine di sfondo */}
      <div className="relative isolate min-h-screen flex items-center justify-center text-center px-4 overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center -z-20 animate-ken-burns"
          style={{ backgroundImage: "url('/landing-page.png')" }}
        />
        <div className="absolute inset-0 bg-black/60 -z-10" />
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
            Bot War
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
            Scrivi il codice. Costruisci il bot. Domina l'arena.
          </p>
          <div className="mt-8">
            <Button onClick={onStartGame} size="large" variant="primary">
              {user ? "Entra nell'Arena" : "Inizia a Giocare"}
            </Button>
          </div>
        </div>
        {/* Indicatore di scroll */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div
            className="animate-bounce text-white opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() =>
              document
                .querySelector("main")
                .scrollIntoView({ behavior: "smooth" })
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
            <span className="sr-only">Scorri in basso</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {/* What is Bot War Section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            La Battaglia si Vince con il Codice
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-gray-300">
            Bot War non è un gioco di riflessi, ma di intelletto. Il tuo compito
            è programmare il cervello di un robot da combattimento usando
            JavaScript. Crea strategie complesse, affina la tua logica e guarda
            la tua creazione sfidare altri bot per la supremazia.
          </p>
          <img
            src="/preview.png"
            alt="Screenshot di Bot War che mostra l'editor e l'arena"
            className="mt-10 rounded-lg shadow-2xl mx-auto"
          />
        </section>

        {/* Two Ways to Create Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Tre Modalità per Creare la Tua IA
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg leading-8 text-gray-300">
              Che tu sia un veterano della programmazione o un principiante,
              abbiamo lo strumento giusto per te.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 items-start">
            <div className="order-2 md:order-1">
              <h3 className="text-2xl font-bold text-cyan-400">
                Editor Visuale a Nodi
              </h3>
              <p className="mt-4 text-gray-300">
                Progetta l'intelligenza del tuo bot in modo intuitivo con il
                nostro editor visuale. Rappresenta la logica come una{" "}
                <strong>macchina a stati finiti (FSM)</strong>, collegando stati
                e transizioni. È il modo perfetto per visualizzare il flusso
                decisionale e iniziare senza scrivere una riga di codice.
              </p>
            </div>
            <div className="order-1 md:order-2">
              <img
                src="/visual_editor.png"
                alt="Editor visuale a nodi"
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="order-3">
              <h3 className="text-2xl font-bold text-cyan-400">
                Editor a Blocchi (Blockly)
              </h3>
              <p className="mt-4 text-gray-300">
                Costruisci la logica del tuo bot in modo visuale e strutturato
                usando blocchi che si incastrano tra loro. È un ottimo modo per
                imparare i concetti di programmazione e creare IA complesse
                senza preoccuparsi della sintassi.
              </p>
            </div>
            <div className="order-4">
              <img
                src="/block_editor.png"
                alt="Editor a blocchi Blockly"
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="order-5">
              <h3 className="text-2xl font-bold text-cyan-400">
                Editor di Codice Professionale
              </h3>
              <p className="mt-4 text-gray-300">
                Per il massimo controllo, tuffati nel nostro editor basato su{" "}
                <strong>Monaco</strong> (il motore di VS Code). Scrivi
                JavaScript per definire ogni dettaglio del comportamento del tuo
                bot, dall'evasione dei proiettili alla gestione dell'energia.
                L'unico limite è la tua immaginazione.
              </p>
            </div>
            <div className="order-6">
              <img
                src="/editor.png"
                alt="Editor di codice professionale"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Caratteristiche Chiave
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <FeatureCard icon="⚡️" title="API Potente e Intuitiva">
              Comanda il tuo bot con un'API semplice ma completa. Funzioni come{" "}
              <code>api.scan()</code>, <code>api.moveTo(x, y)</code> e{" "}
              <code>api.fire()</code> ti danno il pieno controllo sulle azioni,
              mentre <code>api.getEvents()</code> ti permette di reagire in
              tempo reale a ciò che accade nell'arena.
            </FeatureCard>
            <FeatureCard icon="🧠" title="Multiplayer Online">
              Pensi che il tuo bot sia il migliore? Mettilo alla prova! Abilita
              il tuo script per il multiplayer, sfida le creazioni di altri
              giocatori in partite classificate e scala la classifica globale.
            </FeatureCard>
            <FeatureCard icon="🏗️" title="Parti da una Base Solida">
              Non sai da dove iniziare? Ogni giocatore parte con una IA di base
              ben commentata e strutturata come una macchina a stati finiti
              (FSM). Studiala, modificala e usala come trampolino di lancio per
              le tue strategie uniche.
            </FeatureCard>
            <FeatureCard icon="⚙️" title="Debug e Feedback Istantaneo">
              Ogni bot ha una propria console di log. Usa <code>api.log()</code>{" "}
              per tracciare le decisioni, i valori e gli stati del tuo bot in
              tempo reale. Il ciclo di feedback rapido è essenziale per
              migliorare la tua IA.
            </FeatureCard>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Costruito con Tecnologie Moderne
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-gray-300">
            Bot War è un'applicazione web moderna costruita con React, Vite e
            TailwindCSS. La logica di gioco è disaccoppiata dalla UI, garantendo
            performance e manutenibilità.
          </p>
        </section>

        {/* Call to Action Section */}
        <section className="text-center bg-gray-800/50 rounded-lg p-10">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Sei Pronto a Metterti alla Prova?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            L'arena ti aspetta. Che tu voglia creare un aggressore implacabile,
            un cecchino tattico o un evasore inafferrabile, è il momento di dare
            vita al tuo codice.
          </p>
          <div className="mt-8">
            <Button onClick={onStartGame} size="large" variant="primary">
              Inizia la tua Battaglia
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900/50 border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <div className="flex justify-center items-center gap-4 mb-4">
            <a
              href="https://github.com/fra00/bot-war"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              <span>Visita il Repository</span>
            </a>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Bot War. Per domande, suggerimenti
            o per contribuire, apri una issue su GitHub.
          </p>
        </div>
      </footer>
    </div>
  );
};

LandingPage.propTypes = {
  onStartGame: PropTypes.func.isRequired,
};

export default LandingPage;
