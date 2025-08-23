import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Label from "../ui/Label";
import Button from "../ui/Button";
import CardFooter from "../ui/CardFooter";
import Select from "../ui/Select";
import CodeEditor from "./CodeEditor";
import { generateAITypings } from "../../game/ai/ai-typings";

const GlobalTransitionEditorModal = ({
  transition,
  isOpen,
  onClose,
  type, // 'emergency' or 'tactical'
  onSave,
  availableStates,
}) => {
  const [label, setLabel] = useState("");
  const [target, setTarget] = useState("");
  const [condition, setCondition] = useState("");

  useEffect(() => {
    if (transition) {
      setLabel(transition.label || "");
      setTarget(transition.target || "");
      setCondition(
        transition.data?.condition ||
          "(api, memory, context, events) => {\n  return false;\n}"
      );
    } else {
      // Defaults for a new transition
      setLabel(
        `Nuova transizione ${type === "emergency" ? "di emergenza" : "tattica"}`
      );
      setTarget(availableStates.length > 0 ? availableStates[0].value : "");
      setCondition("(api, memory, context, events) => {\n  return false;\n}");
    }
  }, [transition, isOpen, availableStates, type]);

  const handleSave = () => {
    const updatedTransition = {
      ...(transition || { id: `global_${Date.now()}` }),
      label,
      target,
      data: {
        condition,
      },
    };
    onSave(updatedTransition, type);
    onClose();
  };

  const stateOptions =
    availableStates.length > 0
      ? availableStates
      : [{ value: "", label: "Nessuno stato disponibile", disabled: true }];

  const conditionLibs = useMemo(
    () => [
      {
        content: generateAITypings(["api", "memory", "context", "events"]),
        filePath: "file:///ai-typings/condition.d.ts",
      },
    ],
    []
  );

  const editorContainerStyle =
    "h-64 w-full rounded-md overflow-hidden border border-gray-600";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        transition
          ? `Modifica Transizione ${
              type === "emergency" ? "di Emergenza" : "Tattica"
            }`
          : `Nuova Transizione ${
              type === "emergency" ? "di Emergenza" : "Tattica"
            }`
      }
      fullscreen={true}
    >
      <div className="p-6 space-y-4">
        <div>
          <Label htmlFor="global-transition-label">
            Etichetta (Descrizione)
          </Label>
          <Input
            id="global-transition-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="es. Colpito da proiettile"
          />
        </div>
        <div>
          <Label htmlFor="global-transition-target">
            Stato di Destinazione
          </Label>
          <Select
            id="global-transition-target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            options={stateOptions}
          />
        </div>
        <div>
          <Label htmlFor="global-transition-condition">
            Condizione (JavaScript)
          </Label>
          <div className={editorContainerStyle}>
            <CodeEditor
              value={condition}
              onChange={(value) => setCondition(value || "")}
              extraLibs={conditionLibs}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            La condizione deve essere una funzione che ritorna `true` o `false`.
          </p>
        </div>
      </div>
      <CardFooter>
        <Button onClick={onClose} variant="secondary">
          Annulla
        </Button>
        <Button onClick={handleSave} disabled={!target}>
          Salva Modifiche
        </Button>
      </CardFooter>
    </Modal>
  );
};

GlobalTransitionEditorModal.propTypes = {
  transition: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(["emergency", "tactical"]).isRequired,
  onSave: PropTypes.func.isRequired,
  availableStates: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default GlobalTransitionEditorModal;
