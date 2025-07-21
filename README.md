# React Component Library

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)

Una libreria di componenti React completa, temizzabile e responsiva, progettata per creare interfacce utente di alta qualità. Questa libreria è costruita con una forte enfasi sulla documentazione chiara e sulla componibilità, rendendola facile da usare sia per gli sviluppatori umani che per gli assistenti AI (LLM).

<p align="center">
  <a href="https://tailwind-componentlibrary.netlify.app/" target="_blank"><strong>Guarda la Live Demo »</strong></a>
</p>

## Principi Fondamentali

- **Componibilità**: I componenti sono progettati per essere piccoli e componibili, permettendo di costruire UI complesse combinando blocchi semplici.
- **Temizzazione (Theming)**: Pieno supporto per temi chiaro e scuro pronti all'uso, gestiti tramite variabili CSS per una facile personalizzazione.
- **Responsività**: Un approccio mobile-first assicura che i componenti si adattino perfettamente a tutte le dimensioni dello schermo.
- **Documentazione Ottimizzata per LLM**: Ogni componente è auto-documentato con commenti JSDoc ed esempi `@example`. Per una guida dettagliata su come la documentazione è strutturata per gli assistenti AI, consulta il nostro file di Guida alla Documentazione.

## Caratteristiche

- **Set di Componenti Ricco**: Oltre 25 componenti che coprono layout, form, feedback e visualizzazione dati.
- **Hooks Headless**: La logica è disaccoppiata dalla UI utilizzando custom hooks come `useDisclosure` e `useWizard`.
- **Accessibilità (A11y)**: I componenti sono costruiti tenendo conto dell'accessibilità, utilizzando attributi ARIA appropriati e HTML semantico.
- **Showcase Interattivo**: Una pagina di showcase integrata (`ShowCase.jsx`) permette di vedere tutti i componenti in azione.

---

## Guida Rapida

### Utilizzo

Per utilizzare i componenti, devi avvolgere la tua applicazione nel `ThemeProvider`.

```javascriptreact
// Nel tuo file principale App.jsx o index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/ui/context/ThemeContext';
import './App.css'; // Assicurati di importare il tuo foglio di stile principale con le variabili del tema

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```

Ora puoi importare e utilizzare qualsiasi componente dalla libreria:

```javascriptreact
import { Button, Card, CardHeader } from './components/ui'; // Modifica il percorso in base alla tua struttura

function MyComponent() {
  return (
    <Card>
      <CardHeader>Benvenuto!</CardHeader>
      <p>Questa è una card dalla nostra libreria di componenti.</p>
      <Button onClick={() => alert('Ciao!')}>Cliccami</Button>
    </Card>
  );
}
```

---

## Componenti Disponibili

La libreria include una vasta gamma di componenti, raggruppati nelle seguenti categorie:

#### Layout e Struttura

- `Box`
- `Grid` & `GridItem`
- `Card`, `CardHeader`, `CardFooter`
- `Modal`
- `Accordion`
- `Tabs`
- `Wizard`
- `Drawer`
- `Breadcrumbs`
- `Toolbar`

#### Controlli per Form

- `Button`
- `Input`
- `Select`
- `Textarea`
- `Checkbox`
- `RadioGroup` & `Radio`
- `ToggleSwitch`

#### Feedback e Notifica

- `Alert`
- `Spinner`
- `Tooltip`
- `ProgressBar`

#### Visualizzazione Dati

- `Avatar`
- `Badge`
- `List` & `ListItem`
- `Table`
- `Pagination`

#### Hooks

- `useDisclosure`

---

## Sviluppo e Showcase

Per eseguire il progetto localmente e visualizzare lo showcase dei componenti:

1.  **Clona il repository:**

    ```bash
    git clone https://github.com/fra00/tailwind-component-library.git
    cd NOME_REPOSITORY
    ```

2.  **Installa le dipendenze:**

    ```bash
    npm install
    ```

3.  **Avvia il server di sviluppo:**
    ```bash
    npm run dev
    ```
    Questo aprirà l'applicazione nel tuo browser, dove potrai vedere il componente `ShowCase` che mostra tutti gli elementi della libreria.
