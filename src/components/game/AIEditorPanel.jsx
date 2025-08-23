import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import Card from "../ui/Card";
import CardHeader from "../ui/CardHeader";
import Input from "../ui/Input";
import CodeEditor from "./CodeEditor";
import VisualEditor from "./VisualEditor"; // Importa il nuovo componente
import DefaultAIBase from "../../game/ai/DefaultAIBase.js";
import initialPlayerCode from "../../game/ai/PlayerAI";
import Spinner from "../ui/Spinner";
import useDisclosure from "../ui/useDisclosure";
import Modal from "../ui/Modal";
import CardFooter from "../ui/CardFooter";
import { stringifyAI, isStandardFSM } from "../../game/ai/compiler.js";

/**
 * Un pannello che contiene l'editor di codice Monaco per l'IA del giocatore,
 * i controlli e i messaggi di errore.
 */
const AIEditorPanel = ({
  code,
  onCodeChange,
  visualModel,
  onVisualModelChange,
  compileError,
  scripts,
  activeScript,
  onSelectScript,
  onDeleteScript,
  onCreateNewScript,
  isLoading,
  activeView,
  onSwitchView,
  visualParseError,
  onHelpOpen,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newScriptName, setNewScriptName] = useState("");
  const [creationMode, setCreationMode] = useState("new");
  const {
    isOpen: isVisualEditorFullscreen,
    onOpen: onVisualEditorFullscreenOpen,
    onClose: onVisualEditorFullscreenClose,
  } = useDisclosure();

  // Stato locale per determinare se lo script è una FSM standard.
  // Questo risolve il bug logico centralizzando il controllo qui,
  // derivandolo direttamente dal codice ricevuto come prop.
  const [isFsm, setIsFsm] = useState(false);

  useEffect(() => {
    // Ogni volta che il codice cambia, ricalcoliamo se è una FSM.
    setIsFsm(isStandardFSM(code));
  }, [code]);

  const handleInitiateCreate = (mode = "new") => {
    setIsCreating(true);
    setCreationMode(mode);
  };

  const handleConfirmCreate = () => {
    if (newScriptName.trim()) {
      let code;
      const visualModel = null;

      if (creationMode === "base") {
        // Genera la stringa di codice completa a partire dall'oggetto Base.
        // Questo è l'approccio corretto che sfrutta l'architettura che abbiamo costruito.
        code = stringifyAI(DefaultAIBase);
      } else {
        code = initialPlayerCode;
      }
      onCreateNewScript(newScriptName.trim(), code, visualModel);
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
        {/* Selettore Vista Codice/Visuale */}
        <div className="flex mb-2">
          <Button
            onClick={() => onSwitchView("code")}
            variant={activeView === "code" ? "primary" : "ghost"}
            className={`rounded-r-none ${
              activeView === "code" ? "bg-blue-600" : ""
            }`}
          >
            Codice
          </Button>
          <Button
            onClick={() => onSwitchView("visual")}
            disabled={!isFsm}
            variant={activeView === "visual" ? "primary" : "ghost"}
            className={`rounded-l-none ${
              activeView === "visual" ? "rounded-r-none" : ""
            } ${activeView === "visual" ? "bg-blue-600" : ""}`}
            title={
              !isFsm
                ? "La vista visuale è disponibile solo per i Base Script"
                : ""
            }
          >
            Visuale{" "}
            {!isFsm && (
              <span className="ml-1 text-xs text-gray-500">
                (Solo Base Script)
              </span>
            )}
          </Button>
          {activeView === "visual" && (
            <Button
              onClick={onVisualEditorFullscreenOpen}
              variant="ghost"
              className="rounded-l-none px-2"
              title="Apri a schermo intero"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5"
                />
              </svg>
            </Button>
          )}
        </div>

        {/* Area Editor Condizionale */}
        <div className="flex-grow flex flex-col">
          {activeView === "code" && (
            <div
              data-tutorial-id="code-editor"
              className="flex-grow relative rounded-md overflow-hidden border border-gray-700"
            >
              <CodeEditor
                value={code}
                onChange={(value) => onCodeChange(value || "")}
              />
            </div>
          )}
          {activeView === "visual" && (
            <VisualEditor
              activeScript={activeScript}
              visualModel={visualModel}
              onModelChange={onVisualModelChange}
              onHelpOpen={onHelpOpen}
            />
          )}
        </div>
        <div className="flex-shrink-0 mt-4">
          {compileError && (
            <Alert variant="danger" role="alert" className="mb-2">
              {compileError}
            </Alert>
          )}
          {visualParseError && (
            <Alert variant="warning" role="alert" className="mb-2">
              {visualParseError}
            </Alert>
          )}
        </div>
      </div>

      {/* Modale a schermo intero per l'Editor Visuale */}
      <Modal
        isOpen={isVisualEditorFullscreen}
        onClose={onVisualEditorFullscreenClose}
        title="Editor Visuale - Schermo Intero"
        fullscreen={true}
      >
        <div className="flex flex-col h-full bg-gray-800">
          <div className="flex flex-grow p-2">
            <VisualEditor
              activeScript={activeScript}
              visualModel={visualModel}
              onModelChange={onVisualModelChange}
              isInteractive={true}
              onHelpOpen={onHelpOpen}
            />
          </div>
          <CardFooter>
            <Button onClick={onVisualEditorFullscreenClose} variant="primary">
              Chiudi
            </Button>
          </CardFooter>
        </div>
      </Modal>
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
  visualModel: PropTypes.object,
  onVisualModelChange: PropTypes.func,
  compileError: PropTypes.string,
  onSelectScript: PropTypes.func.isRequired,
  onDeleteScript: PropTypes.func.isRequired,
  // Chiamata senza argomenti per iniziare, poi con (nome, codice, visualModel?) per confermare.
  onCreateNewScript: PropTypes.func.isRequired,
  /** Indica se gli script sono in fase di caricamento. */
  isLoading: PropTypes.bool,
  /** La vista attualmente attiva ('code' o 'visual'). */
  activeView: PropTypes.string.isRequired,
  /** Funzione per tentare di cambiare vista. */
  onSwitchView: PropTypes.func.isRequired,
  /** Messaggio di errore se il parsing per la vista visuale fallisce. */
  visualParseError: PropTypes.string,
  /** Funzione per aprire la guida dell'editor visuale. */
  onHelpOpen: PropTypes.func,
};

export default AIEditorPanel;
