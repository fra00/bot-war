import React, { useState, useEffect, useCallback } from "react";
import * as Blockly from "blockly/core";
import PropTypes from "prop-types";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import Card from "../ui/Card";
import CardHeader from "../ui/CardHeader";
import Input from "../ui/Input";
import CodeEditor from "./CodeEditor";
import VisualEditor from "./VisualEditor"; // Importa il nuovo componente
import BlocklyEditor from "../editor/BlocklyEditor";
import { useRef } from "react";
import DefaultAIBase from "../../game/ai/DefaultAIBase.js";
import initialPlayerCode from "../../game/ai/PlayerAI";
import Spinner from "../ui/Spinner";
import useDisclosure from "../ui/useDisclosure";
import Modal from "../ui/Modal";
import CardFooter from "../ui/CardFooter";
import { stringifyAI, isStandardFSM } from "../../game/ai/compiler.js";
import { baseBlocklyWorkspace } from "../../game/blockly/baseBlocklyWorkspace.js";

/**
 * Un pannello che contiene l'editor di codice Monaco per l'IA del giocatore,
 * i controlli e i messaggi di errore.
 */
const AIEditorPanel = ({
  code,
  onCodeChange,
  visualModel,
  blocklyModel,
  onBlocklyModelChange,
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
  // Gestione modale fullscreen per Blockly
  const {
    isOpen: isBlocklyFullscreen,
    onOpen: onBlocklyFullscreenOpen,
    onClose: onBlocklyFullscreenClose,
  } = useDisclosure();
  // Gestione modale per import/export Blockly
  const {
    isOpen: isExportModalOpen,
    onOpen: onExportModalOpen,
    onClose: onExportModalClose,
  } = useDisclosure();
  const {
    isOpen: isImportModalOpen,
    onOpen: onImportModalOpen,
    onClose: onImportModalClose,
  } = useDisclosure();

  // Gestione modale per il codice generato
  const {
    isOpen: isCodeModalOpen,
    onOpen: onCodeModalOpen,
    onClose: onCodeModalClose,
  } = useDisclosure();

  const [generatedCode, setGeneratedCode] = useState("");
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);

  const [exportedJson, setExportedJson] = useState("");
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState("");
  const [copyExportSuccess, setCopyExportSuccess] = useState(false);

  // Stato locale per determinare se lo script è una FSM standard.
  // Questo risolve il bug logico centralizzando il controllo qui,
  // derivandolo direttamente dal codice ricevuto come prop.
  const [isFsm, setIsFsm] = useState(false);

  useEffect(() => {
    // Ridimensiona l'area di lavoro di Blockly quando si entra/esce dalla modalità a schermo intero
    if (
      activeView === "blockly" &&
      blocklyRef.current?.getWorkspace // Assicurati che BlocklyEditor esponga questo metodo
    ) {
      const workspace = blocklyRef.current.getWorkspace();
      // Un piccolo ritardo per consentire al DOM di aggiornarsi
      setTimeout(() => {
        Blockly.svgResize(workspace);
      }, 50);
    }
  }, [isBlocklyFullscreen, activeView]);

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
      let visualModel = null;
      let blocklyModel = null;

      if (creationMode === "base") {
        // Genera la stringa di codice completa a partire dall'oggetto Base.
        // Questo è l'approccio corretto che sfrutta l'architettura che abbiamo costruito.
        code = stringifyAI(DefaultAIBase);
      } else {
        code = initialPlayerCode;
      }
      onCreateNewScript(newScriptName.trim(), code, visualModel, blocklyModel);
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
  const blocklyRef = useRef();

  const handleGenerateCode = () => {
    if (blocklyRef.current?.getGeneratedCode) {
      const code = blocklyRef.current.getGeneratedCode();
      setGeneratedCode(code);
      setCopyCodeSuccess(false);
      onCodeModalOpen();
    }
  };

  const handleLoadBaseBlockly = () => {
    if (blocklyRef.current && blocklyRef.current.loadWorkspaceJson) {
      // Non è più necessario chiedere conferma qui, dato che l'editor diventerà "dirty"
      // e l'utente dovrà comunque salvare esplicitamente.
      blocklyRef.current.loadWorkspaceJson(baseBlocklyWorkspace);

      // Notifica manualmente il cambiamento del modello Blockly.
      // Questo è il passaggio che mancava.
      onBlocklyModelChange(baseBlocklyWorkspace);

      // Genera il codice corrispondente dal nuovo workspace e notifica il cambiamento.
      // Questo abiliterà il pulsante "Salva Modifiche".
      const newCode = blocklyRef.current.getGeneratedCode();
      onCodeChange(newCode);
    }
  };

  const handleExport = () => {
    // Corretto: Utilizzo getWorkspaceJson come hai indicato.
    if (blocklyRef.current && blocklyRef.current.getWorkspaceJson) {
      const state = blocklyRef.current.getWorkspaceJson();
      setExportedJson(JSON.stringify(state, null, 2));
      setCopyExportSuccess(false);
      onExportModalOpen();
    } else {
      console.error(
        "L'editor Blockly non espone il metodo 'getWorkspaceJson'."
      );
    }
  };

  const handleConfirmImport = () => {
    // Corretto: Per importare, è necessario un metodo che accetti il JSON e lo carichi.
    // Assumo che esista un metodo `loadWorkspaceJson` sul ref.
    if (blocklyRef.current && blocklyRef.current.loadWorkspaceJson) {
      try {
        setImportError("");
        const json = JSON.parse(importJson);
        blocklyRef.current.loadWorkspaceJson(json);
        onImportModalClose();
      } catch (e) {
        setImportError(
          "JSON non valido o incompatibile. Controlla la console per i dettagli."
        );
        console.error("Blockly import error:", e);
      }
    }
  };

  const handleCopyExportedJson = () => {
    navigator.clipboard.writeText(exportedJson).then(() => {
      setCopyExportSuccess(true);
      setTimeout(() => setCopyExportSuccess(false), 2000);
    });
  };

  const handleCopyGeneratedCode = () => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopyCodeSuccess(true);
      setTimeout(() => setCopyCodeSuccess(false), 2000);
    });
  };

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
        {/* Selettore Vista Codice/Visuale/Blockly */}
        <div className="flex mb-2">
          <Button
            onClick={() => onSwitchView("code")}
            variant={activeView === "code" ? "primary" : "ghost"}
            className={`rounded-none ${
              activeView === "code" ? "bg-blue-600" : ""
            }`}
          >
            Edito di Testo
          </Button>
          <Button
            onClick={() => onSwitchView("visual")}
            disabled={!isFsm}
            variant={activeView === "visual" ? "primary" : "ghost"}
            className={`rounded-none ${
              activeView === "visual" ? "bg-blue-600" : ""
            }`}
            title={
              !isFsm
                ? "La vista visuale è disponibile solo per i Base Script"
                : ""
            }
          >
            Edito Visuale (Flow){" "}
            {!isFsm && (
              <span className="ml-1 text-xs text-gray-500">
                (Solo Base Script)
              </span>
            )}
          </Button>
          <Button
            onClick={() => onSwitchView("blockly")}
            variant={activeView === "blockly" ? "primary" : "ghost"}
            className={`rounded-none ${
              activeView === "blockly" ? "bg-blue-600" : ""
            }`}
            title="Editor Blockly (prototipo)"
          >
            Editor a Blocchi
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
          {activeView === "blockly" && (
            <div className="flex flex-col h-full">
              <div className="flex gap-2 mb-2">
                <Button onClick={handleLoadBaseBlockly} variant="primary">
                  Carica Base
                </Button>
                <Button onClick={handleGenerateCode} variant="secondary">
                  Anteprima codice
                </Button>
                <Button onClick={handleExport} variant="secondary">
                  Esporta
                </Button>
                <Button
                  onClick={() => {
                    setImportJson("");
                    setImportError("");
                    onImportModalOpen();
                  }}
                  variant="secondary"
                >
                  Importa
                </Button>
                <Button
                  onClick={onBlocklyFullscreenOpen}
                  variant="secondary"
                  className="px-2"
                  title="Schermo intero"
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
              </div>
              <div
                className={`flex-grow transition-all duration-300 ease-in-out ${
                  isBlocklyFullscreen
                    ? "fixed inset-0 z-50 bg-gray-800 p-4 flex flex-col"
                    : "relative border border-gray-700 rounded-md overflow-hidden"
                }`}
              >
                <BlocklyEditor
                  ref={blocklyRef}
                  initialWorkspace={blocklyModel}
                  onWorkspaceChange={onBlocklyModelChange}
                  onCodeChange={onCodeChange}
                />
                {isBlocklyFullscreen && (
                  <div className="flex-shrink-0 pt-4 text-right">
                    <Button
                      onClick={onBlocklyFullscreenClose}
                      variant="primary"
                    >
                      Chiudi Schermo Intero
                    </Button>
                  </div>
                )}
              </div>
            </div>
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

      {/* Modale per Esportare i blocchi */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={onExportModalClose}
        title="Esporta Struttura Blocchi"
      >
        <div className="flex flex-col gap-4">
          <p>
            Copia il testo sottostante per salvare la tua struttura a blocchi.
          </p>
          <textarea
            readOnly
            className="w-full h-64 p-2 font-mono text-sm bg-gray-900 border border-gray-700 rounded-md"
            value={exportedJson}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={handleCopyExportedJson} variant="secondary">
              {copyExportSuccess ? "Copiato!" : "Copia"}
            </Button>
            <Button onClick={onExportModalClose} variant="primary">
              Chiudi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modale per Importare i blocchi */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={onImportModalClose}
        title="Importa Struttura Blocchi"
      >
        <div className="flex flex-col gap-4">
          <p>
            Incolla qui la struttura a blocchi che vuoi caricare. L'area di
            lavoro corrente verrà sovrascritta.
          </p>
          <textarea
            className="w-full h-64 p-2 font-mono text-sm bg-gray-900 border border-gray-700 rounded-md"
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder="Incolla qui il JSON esportato..."
          />
          {importError && <Alert variant="danger">{importError}</Alert>}
          <div className="flex justify-end gap-2">
            <Button onClick={onImportModalClose} variant="secondary">
              Annulla
            </Button>
            <Button onClick={handleConfirmImport} variant="primary">
              Importa
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modale per Visualizzare il Codice Generato */}
      <Modal
        isOpen={isCodeModalOpen}
        onClose={onCodeModalClose}
        title="Anteprima Codice Generato"
      >
        <div className="flex flex-col gap-4">
          <p>
            Anteprima del codice JavaScript generato dai blocchi. Questo codice
            viene aggiornato automaticamente nell'editor principale.
          </p>
          <textarea
            readOnly
            className="w-full h-64 p-2 font-mono text-sm bg-gray-900 border border-gray-700 rounded-md"
            value={generatedCode}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={handleCopyGeneratedCode} variant="secondary">
              {copyCodeSuccess ? "Copiato!" : "Copia"}
            </Button>
            <Button onClick={onCodeModalClose} variant="primary">
              Chiudi
            </Button>
          </div>
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
  blocklyModel: PropTypes.object,
  onBlocklyModelChange: PropTypes.func,
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
