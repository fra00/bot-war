import React from "react";
import PropTypes from "prop-types";
import Button from "../ui/Button";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from "../ui/Accordion";

const CodeBracketIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

const SparklesIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.5 21.75l-.398-1.188a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.188-.398a2.25 2.25 0 001.423-1.423L16.5 15.75l.398 1.188a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.188.398a2.25 2.25 0 00-1.423 1.423z"
    />
  </svg>
);

const BoltIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
    />
  </svg>
);

const LandingPage = ({ onStartGame }) => {
  return (
    <div className="bg-gray-900 text-white">
      {/* Hero Section con immagine di sfondo */}
      {/* Aggiunto overflow-hidden per contenere l'immagine che si ingrandisce */}
      <main
        className="relative isolate min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Div separato per l'immagine di sfondo animata */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center -z-20 animate-ken-burns"
          style={{ backgroundImage: "url('/landing-page.png')" }}
        />

        {/* Overlay scuro per migliorare la leggibilità del testo */}
        <div className="absolute inset-0 bg-black/60 -z-10" />

        {/* Il contenuto ora è relativo per assicurare il corretto stacking context */}
        <div className="relative mx-auto max-w-4xl py-32 sm:py-48 lg:py-56 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            ai-BotWars
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Crea. Combatti. Domina. La tua arena definitiva per l'intelligenza
            artificiale.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button
              onClick={onStartGame}
              className="rounded-md bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              Entra nell'Arena
            </Button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-gray-800/50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-400">
              Come Funziona
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Forgia il tuo Campione Digitale
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Dai vita al tuo bot con poche righe di codice e lancialo in
              battaglie strategiche per dimostrare la tua superiorità.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <CodeBracketIcon className="h-5 w-5 flex-none text-indigo-400" />
                  Progetta la Tua Mente
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                  <p className="flex-auto">
                    Scrivi la logica del tuo bot in JavaScript. Dalle strategie
                    più semplici alle tattiche più complesse, il limite è la tua
                    immaginazione.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <BoltIcon className="h-5 w-5 flex-none text-indigo-400" />
                  Scatena la Battaglia
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                  <p className="flex-auto">
                    Lancia il tuo bot nell'arena e osserva come si comporta
                    contro avversari formidabili. Ogni battaglia è un test, ogni
                    vittoria una conquista.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <SparklesIcon className="h-5 w-5 flex-none text-indigo-400" />
                  Potenziato dagli LLM
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                  <p className="flex-auto">
                    Sfrutta la potenza dei Large Language Models (come ChatGPT)
                    per generare, migliorare o analizzare il codice del tuo bot.
                    L'ingegneria incontra la creatività.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-800/50 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Domande Frequenti
          </h2>
          <div className="mt-12">
            <Accordion allowMultiple>
              <AccordionItem>
                <AccordionHeader>
                  Cos'è esattamente ai-BotWars?
                </AccordionHeader>
                <AccordionPanel>
                  ai-BotWars è un'arena di simulazione dove puoi progettare,
                  programmare e far combattere bot dotati di intelligenza
                  artificiale. È un parco giochi per testare strategie,
                  algoritmi e persino IA generate da modelli linguistici di
                  grandi dimensioni (LLM) in un ambiente competitivo e
                  divertente.
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionHeader>
                  Quale linguaggio di programmazione devo usare?
                </AccordionHeader>
                <AccordionPanel>
                  Tutta la logica dei bot è scritta in{" "}
                  <strong>JavaScript</strong>. Forniamo un editor di codice
                  integrato e un'API semplice ma potente che ti permette di
                  controllare le azioni del tuo bot, come muoversi, scansionare
                  l'ambiente e sparare.
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionHeader>
                  Come posso usare un LLM per creare la mia IA?
                </AccordionHeader>
                <AccordionPanel>
                  Questa è la parte più innovativa! Puoi descrivere la strategia
                  del tuo bot a un LLM (es. "Crea un bot che si muove lungo i
                  bordi e spara al nemico più vicino") e chiedergli di generare
                  il codice JavaScript. Poi, puoi copiare e incollare quel
                  codice direttamente nel nostro editor per testarlo e
                  perfezionarlo.
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Pronto a creare il campione definitivo?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
            L'arena attende il tuo ingegno. Inizia ora e lascia il segno nella
            storia di ai-BotWars.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button
              onClick={onStartGame}
              className="rounded-md bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              Inizia a Programmare
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

LandingPage.propTypes = {
  onStartGame: PropTypes.func.isRequired,
};

export default LandingPage;
