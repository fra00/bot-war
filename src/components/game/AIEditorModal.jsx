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
  compileError,
  onSelectScript,
  onDeleteScript,
  onCreateNewScript,
  onUpdateSettings,
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
  const [internalVisualModel, setInternalVisualModel] = useState(null);
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
      setInternalVisualModel(null);
      setVisualParseError(null);
    }
  }, [code, activeScript, isOpen]);

  const handleCodeChange = (newCode) => {
    // Aggiorna lo stato interno direttamente con il codice dall'editor.
    setInternalCode(newCode || "");
    setIsDirty(true);
    // Rimuoviamo la notifica al genitore per interrompere il ciclo di re-render che causa il salto del cursore.
    // onCodeChangeProp(newCode);
  };

  const handleVisualModelChange = (newModel) => {
    setInternalVisualModel(newModel);
    try {
      // Genera il codice dal modello visuale, usando il codice corrente
      // come base per preservare le funzioni helper e altre proprietà custom.
      const newCode = generateAICodeFromVisualModel(newModel, internalCode);
      setInternalCode(newCode);
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
    // Usa il codice interno, che è quello che l'utente sta vedendo e modificando.
    // `prepareCodeForSaving` si occuperà di fare il merge con il motore FSM se necessario.
    const codeToSave = prepareCodeForSaving(internalCode);

    const { success } = await onSaveOnly(codeToSave);
    if (success) {
      setIsDirty(false);
      addToast("Script salvato.", "success");
      // Dopo il salvataggio, il codice "pulito" nell'editor potrebbe non corrispondere
      // più al codice completo appena salvato. Ricaricando lo script, forziamo
      // una risincronizzazione, mostrando la versione pulita del codice appena salvato.
      onSelectScript(activeScript);
    } else {
      addToast("Salvataggio fallito. Controlla gli errori.", "danger");
    }
  }, [
    onSaveOnly,
    addToast,
    setIsDirty,
    internalCode,
    onSelectScript,
    activeScript,
  ]);

  const handleUpdateClick = useCallback(async () => {
    if (isDirty) {
      const { success } = await onSaveOnly(prepareCodeForSaving(internalCode));
      if (!success) {
        addToast("Salvataggio fallito. Impossibile applicare.", "danger");
        return;
      }
      setIsDirty(false);
      addToast("Script salvato e applicato.", "success");
    }

    // La logica di "Applica" usa sempre il codice sorgente corrente,
    // che è già stato normalizzato e salvato.
    const { success } = await onUpdate(prepareCodeForSaving(internalCode));
    if (success) {
      addToast("Script applicato con successo! Riavvio partita...", "success");
      onClose();
    } else {
      addToast("Applicazione fallita. Controlla gli errori.", "danger");
    }
  }, [onUpdate, onSaveOnly, addToast, onClose, isDirty, internalCode]);

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
        const aiObject = compileAI(internalCode);
        if (!aiObject || typeof aiObject.states !== "object") {
          throw new Error(
            "Il codice non è una macchina a stati valida (manca la proprietà 'states' o non è un oggetto)."
          );
        }
        const newVisualModel = generateVisualModelFromAIObject(aiObject);
        setInternalVisualModel(newVisualModel);
        setActiveView("visual");
      } catch (e) {
        setVisualParseError(
          `Impossibile generare la vista visuale: ${e.message}`
        );
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
            code={internalCode}
            onCodeChange={handleCodeChange}
            visualModel={internalVisualModel}
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
  compileError: PropTypes.string,
  onSelectScript: PropTypes.func.isRequired,
  onDeleteScript: PropTypes.func.isRequired,
  onCreateNewScript: PropTypes.func.isRequired,
  onUpdateSettings: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  onBotSettingsOpen: PropTypes.func,
  onVisualEditorGuideOpen: PropTypes.func,
};

export default AIEditorModal;
