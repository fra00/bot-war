import React, { useCallback } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import AIEditorPanel from "./AIEditorPanel";
import CardFooter from "../ui/CardFooter";
import Button from "../ui/Button";
import { useToast } from "../ui/toast/ToastProvider";

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
  compileError,
  onSelectScript,
  onDeleteScript,
  onCreateNewScript,
}) => {
  const { addToast } = useToast();

  const handleSaveClick = useCallback(() => {
    const { success } = onSaveOnly();
    if (success) {
      addToast("Script salvato con successo!", "success");
    } else {
      // Aggiunge un feedback visibile anche in caso di fallimento.
      // Il messaggio di errore dettagliato è già visibile nell'Alert sotto l'editor.
      addToast("Salvataggio fallito. Controlla gli errori.", "danger");
    }
  }, [onSaveOnly, addToast]);

  const handleUpdateClick = useCallback(() => {
    const { success } = onUpdate();
    if (success) {
      addToast("Script applicato con successo! Riavvio partita...", "success");
      onClose(); // Chiude la modale in caso di successo
    } else {
      addToast("Applicazione fallita. Controlla gli errori.", "danger");
    }
  }, [onUpdate, addToast, onClose]);

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
            compileError={compileError}
            onSelectScript={onSelectScript}
            onDeleteScript={onDeleteScript}
            onCreateNewScript={onCreateNewScript}
          />
        </div>
        <CardFooter>
          <Button onClick={handleSaveClick} variant="secondary">
            Salva Modifiche
          </Button>
          <Button
            onClick={handleUpdateClick}
            disabled={gameStateStatus === "running"}
            className="bg-green-600 hover:bg-green-700"
          >
            {activeScript
              ? `Applica "${activeScript.name}" e Riavvia`
              : "Applica e Riavvia"}
          </Button>
          {gameStateStatus === "running" && (
            <span className="text-sm text-yellow-400 ml-4">
              (La partita in corso verrà terminata per applicare le modifiche)
            </span>
          )}
        </CardFooter>
      </div>
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
  compileError: PropTypes.string,
  onSelectScript: PropTypes.func.isRequired,
  onDeleteScript: PropTypes.func.isRequired,
  onCreateNewScript: PropTypes.func.isRequired,
};

export default AIEditorModal;
