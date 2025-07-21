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
}) => {
  return (
    // Questo Box è un contenitore flex in colonna. `flex-grow` assicura che
    // si espanda per riempire tutto lo spazio verticale del suo genitore (il Drawer).
    <Box className="card flex flex-col flex-grow p-0">
      <CardHeader>Player AI Editor</CardHeader>

      {/* L'area dell'editor. `flex-grow` permette a questo div di riempire lo spazio
         verticale disponibile. `min-h-0` è la chiave per risolvere il problema di
         dimensionamento di flexbox, permettendo al contenitore di restringersi. */}
      <div className="flex-grow min-h-0 p-4" style={{ height: "100%" }}>
        {/* Editor di codice Monaco */}
        <CodeEditor
          value={code}
          onChange={(value) => onCodeChange(value || "")}
        />
      </div>

      {/* Contenitore per footer e alert */}
      <div>
        {compileError && (
          <div className="px-4 pb-2">
            <Alert variant="danger">{compileError}</Alert>
          </div>
        )}
        <CardFooter>
          <Button onClick={onUpdate} disabled={isGameRunning}>
            Update AI & Reset Game
          </Button>
        </CardFooter>
      </div>
    </Box>
  );
};

AIEditorPanel.propTypes = {
  /** Il codice sorgente dell'IA come stringa. */
  code: PropTypes.string.isRequired,
  /** Funzione per aggiornare lo stato del codice. */
  onCodeChange: PropTypes.func.isRequired,
  /** Funzione da eseguire quando si clicca il pulsante di aggiornamento. */
  onUpdate: PropTypes.func.isRequired,
  /** Messaggio di errore di compilazione, se presente. */
  compileError: PropTypes.string,
  /** Flag per disabilitare il pulsante mentre il gioco è in esecuzione. */
  isGameRunning: PropTypes.bool.isRequired,
};

AIEditorPanel.defaultProps = {
  compileError: null,
};

export default AIEditorPanel;
