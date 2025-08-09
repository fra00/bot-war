import React, { useState } from "react";
import PropTypes from "prop-types";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import Card from "../ui/Card";
import CardHeader from "../ui/CardHeader";
import Input from "../ui/Input";
import CodeEditor from "./CodeEditor";
import DefaultAIBase from "../../game/ai/DefaultAIBase.js";
import initialPlayerCode, { stringifyAI } from "../../game/ai/PlayerAI.js";
import Spinner from "../ui/Spinner";

/**
 * Un pannello che contiene l'editor di codice Monaco per l'IA del giocatore,
 * i controlli e i messaggi di errore.
 */
const AIEditorPanel = ({
  code,
  onCodeChange,
  compileError,
  scripts,
  activeScript,
  onSelectScript,
  onDeleteScript,
  onCreateNewScript,
  isLoading,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newScriptName, setNewScriptName] = useState("");
  const [creationMode, setCreationMode] = useState("new");

  const handleInitiateCreate = (mode = "new") => {
    setIsCreating(true);
    setCreationMode(mode);
    // Chiama la prop senza argomenti per segnalare l'inizio della creazione
    // e permettere al tutorial di avanzare.
    onCreateNewScript();
  };

  const handleConfirmCreate = () => {
    if (newScriptName.trim()) {
      // Ora siamo espliciti: "base" usa DefaultAIBase, "new" usa initialPlayerCode.
      const code =
        creationMode === "base"
          ? stringifyAI(DefaultAIBase)
          : initialPlayerCode;
      // Chiama la prop con il nome e il codice per confermare
      onCreateNewScript(newScriptName.trim(), code);
      setIsCreating(false);
      setNewScriptName("");
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewScriptName("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-lg">
        <Spinner size="large" />
        <span className="ml-4">Caricamento script...</span>
      </div>
    );
  }
  return (
    // Il contenitore principale è ora gestito dal componente Modal.
    // Rimuoviamo la Toolbar e il div contenitore esterno.
    <div className="grid grid-cols-12 gap-4 h-full overflow-hidden">
      {/* Colonna Sinistra: Lista Script */}
      <div className="col-span-3 flex flex-col gap-4">
        <Card className="flex flex-col">
          <CardHeader>I tuoi Script</CardHeader>
          <div className="overflow-y-auto p-2" style={{ height: "300px" }}>
            <ul>
              {scripts.map((script) => (
                <li key={script.id} className="mb-2">
                  <div
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                      activeScript?.id === script.id
                        ? "bg-blue-500/30"
                        : "hover:bg-gray-700"
                    }`}
                    onClick={() => onSelectScript(script.id)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && onSelectScript(script.id)
                    }
                    role="button"
                    tabIndex={0}
                  >
                    <span className="truncate font-medium text-sm">
                      {script.name}
                    </span>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation(); // Evita di selezionare lo script quando si clicca elimina
                        if (
                          window.confirm(
                            `Sei sicuro di voler eliminare "${script.name}"?`
                          )
                        ) {
                          onDeleteScript(script.id);
                        }
                      }}
                      aria-label={`Elimina script ${script.name}`}
                      className="text-white" // Aggiunto per migliorare il contrasto
                    >
                      X
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-2 border-t border-gray-700">
            {isCreating ? (
              <div className="space-y-2">
                <Input
                  id="new-script-name-input"
                  placeholder="Nome del nuovo script"
                  value={newScriptName}
                  onChange={(e) => setNewScriptName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirmCreate()}
                  autoFocus
                  data-tutorial-id="script-name-input"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelCreate}
                    variant="secondary"
                    className="w-full"
                  >
                    Annulla
                  </Button>
                  <Button onClick={handleConfirmCreate} className="w-full">
                    Conferma
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  data-tutorial-id="new-bot-button"
                  onClick={() => handleInitiateCreate("new")}
                  className="w-1/2"
                >
                  Nuovo Script
                </Button>
                <Button
                  onClick={() => handleInitiateCreate("base")}
                  className="w-1/2"
                  variant="secondary"
                >
                  Base Script
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Colonna Destra: Editor e Controlli */}
      <div className="col-span-9 flex flex-col h-full">
        <div
          data-tutorial-id="code-editor"
          className="flex-grow relative rounded-md overflow-hidden border border-gray-700"
        >
          <CodeEditor
            value={code}
            onChange={(value) => onCodeChange(value || "")}
          />
        </div>
        <div className="flex-shrink-0 mt-4">
          {compileError && (
            <Alert variant="danger" role="alert" className="mb-2">
              {compileError}
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

AIEditorPanel.propTypes = {
  scripts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      // Il codice può essere in 'code' (localStorage) o 'script' (Firestore)
    })
  ).isRequired,
  activeScript: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  code: PropTypes.string.isRequired,
  onCodeChange: PropTypes.func.isRequired,
  compileError: PropTypes.string,
  onSelectScript: PropTypes.func.isRequired,
  onDeleteScript: PropTypes.func.isRequired,
  // Chiamata senza argomenti per iniziare, poi con (nome, codice) per confermare.
  onCreateNewScript: PropTypes.func.isRequired,
  /** Indica se gli script sono in fase di caricamento. */
  isLoading: PropTypes.bool,
};

export default AIEditorPanel;
