import React from "react";
import PropTypes from "prop-types";
import Box from "../ui/Box";
import CardHeader from "../ui/CardHeader";
import CardFooter from "../ui/CardFooter";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import CodeEditor from "./CodeEditor";

/**
 * Un pannello che contiene l'editor di codice Monaco per l'IA del giocatore,
 * i controlli e i messaggi di errore.
 */
const AIEditorPanel = ({
  code,
  onCodeChange,
  onUpdate,
  compileError,
  isGameRunning,
  onClose,
}) => (
  // Contenitore principale: flex column che occupa tutta l'altezza del Drawer.
  <Box className="card flex flex-col h-full p-0">
    <CardHeader>Player AI Editor</CardHeader>

    {/* Area dell'editor:
        - `flex-grow`: si espande per riempire lo spazio verticale disponibile.
        - `min-h-0`: previene problemi di overflow con flexbox.
        - `relative`: crea un contesto di posizionamento per il figlio assoluto.
        - `p-4`: applica il padding attorno all'area dell'editor. */}
    <div className="flex-grow min-h-0 relative p-4">
      {/* Contenitore assoluto:
          - `absolute inset-0`: si espande per riempire il genitore (rispettando il suo padding).
          - Questo fornisce a Monaco un contenitore con dimensioni in pixel definite,
            permettendo al suo `height: 100%` di funzionare correttamente. */}
      <div className="absolute inset-0">
        <CodeEditor value={code} onChange={(value) => onCodeChange(value || "")} />
      </div>
    </div>

    {/* Footer e alert: posizionati dopo l'area espandibile. */}
    {compileError && (
      <div className="px-4 pb-2">
        <Alert variant="danger" role="alert">{compileError}</Alert>
      </div>
    )}
    <CardFooter>
      <Button onClick={onUpdate} disabled={isGameRunning}>
        Update AI & Reset Game
      </Button>
      <Button onClick={onClose} variant="secondary" className="ml-2">
        Close
      </Button>
    </CardFooter>
  </Box>
);

AIEditorPanel.propTypes = {
  /** Il codice sorgente dell'IA come stringa. */
  code: PropTypes.string.isRequired,
  /** Funzione per aggiornare lo stato del codice. */
  onCodeChange: PropTypes.func.isRequired,
  /** Funzione da eseguire quando si clicca il pulsante di aggiornamento. */
  onUpdate: PropTypes.func.isRequired,
  /** Funzione per chiudere il pannello. */
  onClose: PropTypes.func.isRequired,
  /** Messaggio di errore di compilazione, se presente. */
  compileError: PropTypes.string,
  /** Flag per disabilitare il pulsante mentre il gioco è in esecuzione. */
  isGameRunning: PropTypes.bool.isRequired,
};

AIEditorPanel.defaultProps = {
  compileError: null,
};

export default AIEditorPanel;
