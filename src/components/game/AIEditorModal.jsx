import React, { useCallback, useState, useEffect, useRef } from "react";
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
  onOpen,
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
  onClearBlocklyModel,
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
  const {
    isOpen: isWarningModalOpen,
    onOpen: onWarningModalOpen,
    onClose: onWarningModalClose,
  } = useDisclosure();

  // Stato interno per gestire il codice nell'editor e il flag FSM
  const [internalCode, setInternalCode] = useState("");
  const [isFsm, setIsFsm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeView, setActiveView] = useState("code");
  // Stato per memorizzare un'azione (es. modifica del codice) in attesa di conferma
  // da parte dell'utente, per evitare di perdere il modello Blockly.
  const [pendingAction, setPendingAction] = useState(null);

  // Ref per tenere traccia dell'ID dello script attualmente visualizzato nella modale.
  const displayedScriptId = useRef(null);

  // Un modello Blockly è considerato "non vuoto" se contiene almeno un blocco.
  // Questo previene l'avviso per script nuovi o per quelli in cui Blockly è stato cancellato.
  const isBlocklyWorkspaceNonEmpty =
    blocklyModel &&
    blocklyModel.blocks &&
    Array.isArray(blocklyModel.blocks.blocks) &&
    blocklyModel.blocks.blocks.length > 0;

  const [visualParseError, setVisualParseError] = useState(null);

  useEffect(() => {
    // Questo effetto si attiva all'apertura della modale o al cambio dello script attivo.
    if (isOpen) {
      // Resetta la vista solo se lo script selezionato è DIVERSO da quello già visualizzato.
      // Questo evita il reset durante un salvataggio dello stesso script.
      if (activeScript?.id !== displayedScriptId.current) {
        displayedScriptId.current = activeScript?.id;

        if (code) {
          const isFsmScript = isStandardFSM(code);
          setIsFsm(isFsmScript);
          const cleanCode = prepareCodeForEditor(code);
          setInternalCode(cleanCode);
          setIsDirty(false);
          setActiveView("code");
          setVisualParseError(null);
        }
      }
    } else {
      // Quando la modale si chiude, resettiamo il ref per la prossima apertura.
      displayedScriptId.current = null;
    }
  }, [isOpen, activeScript, code]);

  /**
   * Esegue un'azione solo dopo aver verificato se è necessario un avviso
   * per la sovrascrittura del modello Blockly.
   */
  const checkAndPerformAction = (action) => {
    if (isBlocklyWorkspaceNonEmpty && activeView !== "blockly") {
      setPendingAction(() => action); // Salva l'azione da eseguire dopo la conferma
      onWarningModalOpen();
    } else {
      action(); // Esegui subito se non ci sono rischi
    }
  };

  const handleCodeChange = (newCode) => {
    checkAndPerformAction(() => {
      setInternalCode(newCode || "");
      setIsDirty(true);
      onCodeChangeProp(newCode);
    });
  };

  const handleVisualModelChange = (newModel) => {
    checkAndPerformAction(() => {
      onVisualModelChange(newModel); // Notifica il genitore
      try {
        const newCode = generateAICodeFromVisualModel(newModel, internalCode);
        setInternalCode(newCode);
        onCodeChangeProp(newCode); // Notifica anche la modifica del codice
        setIsDirty(true);
      } catch (e) {
        addToast(`Errore nella generazione del codice: ${e.message}`, "danger");
      }
    });
  };

  const handleConfirmWarning = () => {
    if (pendingAction) {
      onClearBlocklyModel(activeScript.id);
      pendingAction();
      setPendingAction(null);
      onWarningModalClose();
    }
  };

  const handleBotSettingsButtonClick = () => {
    onSettingsOpen();
    if (onBotSettingsOpen) {
      onBotSettingsOpen();
    }
  };

  const handleSaveClick = useCallback(async () => {
    const { success, updatedScript } = await onSaveOnly(activeView);
    if (success && updatedScript) {
      setIsDirty(false);
      addToast("Script salvato.", "success");
      // Se il salvataggio proviene dall'editor a blocchi, chiudi e riapri la modale
      // per forzare un ricaricamento completo dello stato.
      if (activeView === "blockly") {
        onClose();
        setTimeout(() => onOpen(), 50);
      }
    } else {
      addToast("Salvataggio fallito. Controlla gli errori.", "danger");
    }
  }, [onSaveOnly, activeView, addToast, setIsDirty, onClose, onOpen]);

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
            isFsm={isFsm}
          />
        </div>
        <CardFooter>
          <div className="flex-grow flex items-center gap-4">
            {isBlocklyWorkspaceNonEmpty &&
              (activeView === "code" || activeView === "visual") && (
                <div className="text-sm text-yellow-400 flex items-center gap-2">
                  <span role="img" aria-label="Attenzione">
                    ⚠️
                  </span>
                  <span>
                    Script Blockly: usa l'editor a blocchi per evitare
                    conflitti.
                  </span>
                </div>
              )}
            {gameStateStatus === "running" && (
              <span className="text-sm text-gray-400">
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
      <Modal
        isOpen={isWarningModalOpen}
        onClose={onWarningModalClose}
        title="⚠️ Attenzione: Modello Blockly Rilevato"
      >
        <div className="p-4 space-y-4">
          <p>
            Questo script è stato creato o modificato con l'editor a blocchi
            (Blockly).
          </p>
          <p>
            Modificandolo con l'editor testuale o visuale, la struttura a
            blocchi andrà persa e non potrai più usare l'editor Blockly per
            questo script.
          </p>
          <p className="font-semibold">Vuoi procedere comunque?</p>
        </div>
        <CardFooter>
          <Button onClick={onWarningModalClose} variant="secondary">
            Annulla
          </Button>
          <Button onClick={handleConfirmWarning} variant="danger">
            Sì, procedi e rimuovi i blocchi
          </Button>
        </CardFooter>
      </Modal>
    </Modal>
  );
};

AIEditorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onOpen: PropTypes.func.isRequired,
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
  onClearBlocklyModel: PropTypes.func.isRequired,
  onBotSettingsOpen: PropTypes.func,
  onVisualEditorGuideOpen: PropTypes.func,
};

export default AIEditorModal;
