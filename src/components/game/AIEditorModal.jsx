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
} from "../../game/ai/compiler";
import DefaultAIBase from "../../game/ai/DefaultAIBase.js";

const AIEditorModal = ({
  isOpen,
  onClose,
  onUpdate,
  onSaveOnly,
  gameStateStatus,
  scripts,
  activeScript,
  code,
  onCodeChange,
  visualModel,
  onVisualModelChange,
  compileError,
  onSelectScript,
  onDeleteScript,
  onCreateNewScript,
  onUpdateSettings,
  isLoading,
  onBotSettingsOpen,
}) => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onClose: onSettingsClose,
  } = useDisclosure();
  const [isDirty, setIsDirty] = useState(false);
  const [activeView, setActiveView] = useState("code");
  const [visualParseError, setVisualParseError] = useState(null);

  // Resetta lo stato "dirty" quando si cambia script o si chiude la modale,
  // per evitare che un avviso di "modifiche non salvate" persista erroneamente.
  useEffect(() => {
    setIsDirty(false);
    setActiveView("code"); // Torna sempre alla vista codice
    setVisualParseError(null);
  }, [activeScript, isOpen]);

  // Funzione da passare al pannello dell'editor per segnalare una modifica.
  const handleDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const handleBotSettingsButtonClick = () => {
    onSettingsOpen();
    if (onBotSettingsOpen) {
      onBotSettingsOpen();
    }
  };

  const handleSaveClick = useCallback(async () => {
    let codeToSave = code;
    if (activeView === "visual") {
      try {
        // 1. Genera il codice parziale dal modello visuale.
        const partialCode = generateAICodeFromVisualModel(visualModel);

        // 2. Valuta il codice parziale per ottenere un oggetto.
        // Avvolgiamo il codice tra parentesi per assicurarci che un oggetto letterale
        // venga interpretato come un'espressione, risolvendo l'errore "Unexpected token '{'".
        // Questa modifica rende la funzione robusta, funzionando sia che partialCode
        // contenga già le parentesi, sia che non le contenga.
        const partialAiObject = new Function(`return (${partialCode})`)();
        // 3. Esegui il "merge" con DefaultAIBase per creare l'oggetto completo.
        const finalAiObject = { ...DefaultAIBase, ...partialAiObject };

        // 4. Riconverti l'oggetto completo e normalizzato in una stringa.
        codeToSave = stringifyAI(finalAiObject);
      } catch (e) {
        addToast(
          `Errore nella generazione del codice: ${e.message}`,
          "danger"
        );
        return; // Interrompe il processo di salvataggio
      }
    }

    const { success } = await onSaveOnly(codeToSave);
    if (success) {
      setIsDirty(false); // Resetta lo stato dirty dopo un salvataggio riuscito
      addToast("Script salvato con successo!", "success");
    } else {
      addToast("Salvataggio fallito. Controlla gli errori.", "danger");
    }
  }, [
    onSaveOnly,
    addToast,
    setIsDirty,
    code,
    visualModel,
    activeView,
  ]);

  const handleUpdateClick = useCallback(async () => {
    if (isDirty) {
      addToast("Salva le modifiche prima di applicarle.", "warning");
      return;
    }

    // La logica di "Applica" usa sempre il codice sorgente corrente,
    // che è già stato normalizzato e salvato.
    const { success } = await onUpdate(code);
    if (success) {
      addToast("Script applicato con successo! Riavvio partita...", "success");
      onClose();
    } else {
      addToast("Applicazione fallita. Controlla gli errori.", "danger");
    }
  }, [onUpdate, addToast, onClose, isDirty, code]);

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
        const aiObject = compileAI(code);
        if (!aiObject || typeof aiObject.states !== "object") {
          throw new Error(
            "Il codice non è una macchina a stati valida (manca la proprietà 'states' o non è un oggetto)."
          );
        }
        const newVisualModel = generateVisualModelFromAIObject(aiObject);
        onVisualModelChange(newVisualModel);
        setActiveView("visual");
      } catch (e) {
        setVisualParseError(`Impossibile generare la vista visuale: ${e.message}`);
      }
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
            code={code}
            onCodeChange={onCodeChange}
            visualModel={visualModel}
            onVisualModelChange={onVisualModelChange}
            compileError={compileError}
            onSelectScript={onSelectScript}
            onDeleteScript={onDeleteScript}
            onCreateNewScript={onCreateNewScript}
            isLoading={isLoading}
            onDirty={handleDirty}
            activeView={activeView}
            onSwitchView={handleAttemptSwitchView}
            visualParseError={visualParseError}
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
  onCodeChange: PropTypes.func.isRequired,
  visualModel: PropTypes.object,
  onVisualModelChange: PropTypes.func,
  compileError: PropTypes.string,
  onSelectScript: PropTypes.func.isRequired,
  onDeleteScript: PropTypes.func.isRequired,
  onCreateNewScript: PropTypes.func.isRequired,
  onUpdateSettings: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  onBotSettingsOpen: PropTypes.func,
};

export default AIEditorModal;
