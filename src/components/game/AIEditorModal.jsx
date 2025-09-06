import React, { useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import AIEditorPanel from "./AIEditorPanel";
import CardFooter from "../ui/CardFooter";
import Button from "../ui/Button";
import { useToast } from "../ui/toast/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import useDisclosure from "../ui/useDisclosure";
import BotSettingsModal from "./BotSettingsModal";
import Tooltip from "../ui/Tooltip";
import {
  compileAI,
  generateVisualModelFromAIObject,
  generateAICodeFromVisualModel,
  stringifyAI,
  isStandardFSM,
  prepareCodeForEditor,
  prepareCodeForSaving,
} from "../../game/ai/compiler";

const AIEditorModal = ({
  isOpen,
  onClose,
  onUpdate,
  onSaveOnly,
  gameStateStatus,
  scripts,
  activeScript,
  code,
  onCodeChange: onCodeChangeProp,
  visualModel,
  blocklyModel,
  onBlocklyModelChange,
  compileError,
  onSelectScript,
  onDeleteScript,
  onCreateNewScript,
  onUpdateSettings,
  onVisualModelChange,
  isLoading,
  onBotSettingsOpen,
  onVisualEditorGuideOpen,
}) => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onClose: onSettingsClose,
  } = useDisclosure();

  // Stato interno per gestire il codice nell'editor e il flag FSM
  const [internalCode, setInternalCode] = useState("");
  const [isFsm, setIsFsm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeView, setActiveView] = useState("code");
  const [visualParseError, setVisualParseError] = useState(null);

  useEffect(() => {
    // Quando la prop 'code' esterna cambia (es. cambio script),
    // la modale si aggiorna.
    if (code) {
      // 1. Determina se è una FSM standard
      const isFsmScript = isStandardFSM(code);
      setIsFsm(isFsmScript);

      // 2. "Pulisce" il codice se è una FSM, altrimenti lo lascia inalterato.
      const cleanCode = prepareCodeForEditor(code);
      setInternalCode(cleanCode);

      // 3. Resetta lo stato dirty e la vista
      setIsDirty(false);
      setActiveView("code");
      setVisualParseError(null);
    }
  }, [activeScript, isOpen]); // Rimosso 'code' per evitare reset durante la digitazione

  const handleCodeChange = (newCode) => {
    // Aggiorna lo stato interno direttamente con il codice dall'editor.
    setInternalCode(newCode || "");
    setIsDirty(true);
    // Notifica il genitore del cambiamento. Il useEffect non dipende più da 'code', quindi non ci saranno salti.
    onCodeChangeProp(newCode);
  };

  const handleVisualModelChange = (newModel) => {
    onVisualModelChange(newModel); // Notifica il genitore
    try {
      // Genera il codice dal modello visuale, usando il codice corrente
      // come base per preservare le funzioni helper e altre proprietà custom.
      const newCode = generateAICodeFromVisualModel(newModel, internalCode);
      setInternalCode(newCode);
      onCodeChangeProp(newCode); // Notifica anche la modifica del codice
      setIsDirty(true);
    } catch (e) {
      addToast(`Errore nella generazione del codice: ${e.message}`, "danger");
    }
  };

  const handleBotSettingsButtonClick = () => {
    onSettingsOpen();
    if (onBotSettingsOpen) {
      onBotSettingsOpen();
    }
  };

  const handleSaveClick = useCallback(async () => {
    // Passa la vista attiva alla funzione di salvataggio.
    const { success } = await onSaveOnly(activeView);
    if (success) {
      setIsDirty(false);
      addToast("Script salvato.", "success");
      onSelectScript(activeScript.id);
    } else {
      addToast("Salvataggio fallito. Controlla gli errori.", "danger");
    }
  }, [
    onSaveOnly,
    addToast,
    setIsDirty,
    onSelectScript,
    activeScript,
    activeView,
  ]);

  const handleUpdateClick = useCallback(async () => {
    if (isDirty) {
      // Salva prima di applicare, usando la logica centralizzata
      const { success } = await onSaveOnly(activeView);
      if (!success) {
        addToast("Salvataggio fallito. Impossibile applicare.", "danger");
        return;
      }
    }

    // La logica di "Applica" usa sempre il codice sorgente corrente,
    // che `onUpdate` prenderà dal suo stato (useAIScripts).
    const { success } = await onUpdate(activeView);
    if (success) {
      addToast("Script applicato con successo! Riavvio partita...", "success");
      onClose();
    } else {
      addToast("Applicazione fallita. Controlla gli errori.", "danger");
    }
  }, [onUpdate, onSaveOnly, addToast, onClose, isDirty, activeView]);

  const handleSaveSettings = (settings) => {
    if (activeScript) {
      onUpdateSettings(activeScript.id, settings);
    }
  };

  const handleAttemptSwitchView = (targetView) => {
    if (isDirty) {
      addToast("Salva le modifiche prima di cambiare editor.", "warning");
      return;
    }

    if (targetView === "visual") {
      setVisualParseError(null);
      try {
        const aiObject = compileAI(code); // Usa il codice aggiornato dalle prop
        if (!aiObject || typeof aiObject.states !== "object") {
          throw new Error(
            "Il codice non è una macchina a stati valida (manca la proprietà 'states' o non è un oggetto)."
          );
        }
        const newVisualModel = generateVisualModelFromAIObject(aiObject);
        onVisualModelChange(newVisualModel); // Aggiorna il genitore
        setActiveView("visual");
      } catch (e) {
        setVisualParseError(
          `Impossibile generare la vista visuale: ${e.message}`
        );
      }
    } else if (targetView === "blockly") {
      setActiveView("blockly");
    } else {
      setActiveView(targetView);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Editor"
      fullscreen={true}
    >
      <div className="flex flex-col" style={{ height: "75vh" }}>
        <div className="flex-grow overflow-hidden">
          <AIEditorPanel
            scripts={scripts}
            activeScript={activeScript}
            code={internalCode}
            onCodeChange={handleCodeChange}
            visualModel={visualModel}
            blocklyModel={blocklyModel}
            onBlocklyModelChange={onBlocklyModelChange}
            onVisualModelChange={handleVisualModelChange}
            compileError={compileError}
            onSelectScript={onSelectScript}
            onDeleteScript={onDeleteScript}
            onCreateNewScript={onCreateNewScript}
            isLoading={isLoading}
            activeView={activeView}
            onSwitchView={handleAttemptSwitchView}
            visualParseError={visualParseError}
            onHelpOpen={onVisualEditorGuideOpen}
          />
        </div>
        <CardFooter>
          <div className="flex-grow">
            {gameStateStatus === "running" && (
              <span className="text-sm text-yellow-400">
                (La partita in corso verrà terminata per applicare le modifiche)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Tooltip
              content="Devi effettuare il login per modificare le impostazioni cloud."
              disabled={!!user}
            >
              {/* Il Tooltip ha bisogno di un div wrapper per funzionare su elementi disabilitati */}
              <div>
                <Button
                  data-tutorial-id="bot-settings-button"
                  onClick={handleBotSettingsButtonClick}
                  variant="ghost"
                  disabled={!activeScript || !user}
                >
                  Impostazioni Bot
                </Button>
              </div>
            </Tooltip>
            <Button
              onClick={handleSaveClick}
              variant={isDirty ? "primary" : "secondary"}
            >
              {isDirty ? "Salva Modifiche*" : "Salva Modifiche"}
            </Button>
            <Button
              data-tutorial-id="apply-and-restart-button"
              onClick={handleUpdateClick}
              disabled={gameStateStatus === "running" || isDirty}
              className="bg-green-600 hover:bg-green-700"
            >
              {activeScript
                ? `Applica "${activeScript.name}" e Riavvia`
                : "Applica e Riavvia"}
            </Button>
          </div>
        </CardFooter>
      </div>
      <BotSettingsModal
        isOpen={isSettingsOpen}
        onClose={onSettingsClose}
        bot={activeScript}
        onSave={handleSaveSettings}
      />
    </Modal>
  );
};

AIEditorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onSaveOnly: PropTypes.func.isRequired,
  gameStateStatus: PropTypes.string,
  scripts: PropTypes.array.isRequired,
  activeScript: PropTypes.object,
  code: PropTypes.string.isRequired,
  onCodeChange: PropTypes.func.isRequired, // Rinominato in onCodeChangeProp internamente
  visualModel: PropTypes.object,
  blocklyModel: PropTypes.object,
  onBlocklyModelChange: PropTypes.func,
  compileError: PropTypes.string,
  onSelectScript: PropTypes.func.isRequired,
  onDeleteScript: PropTypes.func.isRequired,
  onCreateNewScript: PropTypes.func.isRequired,
  onUpdateSettings: PropTypes.func.isRequired,
  onVisualModelChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  onBotSettingsOpen: PropTypes.func,
  onVisualEditorGuideOpen: PropTypes.func,
};

export default AIEditorModal;
