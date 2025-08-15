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
              Due Modalità per Creare la Tua IA
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg leading-8 text-gray-300">
              Che tu sia un veterano della programmazione o un principiante,
              abbiamo lo strumento giusto per te.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-center">
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
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-center mt-16">
            <div>
              <img
                src="/editor.png"
                alt="Editor di codice professionale"
                className="rounded-lg shadow-xl"
              />
            </div>
            <div>
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
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} Bot War. Un progetto open source.
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
