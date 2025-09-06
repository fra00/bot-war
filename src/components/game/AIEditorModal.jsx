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

  // Un modello Blockly è considerato "non vuoto" se contiene almeno un blocco.
  // Questo previene l'avviso per script nuovi o per quelli in cui Blockly è stato cancellato.
  const isBlocklyWorkspaceNonEmpty =
    blocklyModel &&
    blocklyModel.blocks &&
    Array.isArray(blocklyModel.blocks.blocks) &&
    blocklyModel.blocks.blocks.length > 0;

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
      // La chiamata a onSelectScript è ridondante e causa la race condition.
      // La funzione onSaveOnly è già responsabile di aggiornare lo stato.
    } else {
      addToast("Salvataggio fallito. Controlla gli errori.", "danger");
    }
  }, [
    onSaveOnly,
    addToast,
    setIsDirty,
    activeView,
    onSelectScript,
    activeScript,
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
