import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Label from "../ui/Label";
import Button from "../ui/Button";
import CardFooter from "../ui/CardFooter";
import Select from "../ui/Select";

const CodeTextarea = ({ value, onChange, ...props }) => (
  <textarea
    value={value}
    onChange={onChange}
    className="w-full h-32 p-2 font-mono text-sm bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white"
    {...props}
  />
);
CodeTextarea.propTypes = { value: PropTypes.string, onChange: PropTypes.func };

const GlobalTransitionEditorModal = ({
  transition,
  isOpen,
  onClose,
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
      setCondition(transition.data?.condition || "() => false");
    } else {
      // Defaults for a new transition
      setLabel("Nuova transizione globale");
      setTarget(availableStates.length > 0 ? availableStates[0].value : "");
      setCondition("(api, memory, context, events) => {\n  return false;\n}");
    }
  }, [transition, isOpen, availableStates]);

  const handleSave = () => {
    const updatedTransition = {
      ...(transition || { id: `global_${Date.now()}` }),
      label,
      target,
      data: {
        condition,
      },
    };
    onSave(updatedTransition);
    onClose();
  };

  if (!isOpen) return null;

  const stateOptions =
    availableStates.length > 0
      ? availableStates
      : [{ value: "", label: "Nessuno stato disponibile", disabled: true }];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        transition ? "Modifica Transizione Globale" : "Crea Transizione Globale"
      }
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
          <CodeTextarea
            id="global-transition-condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          />
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
  onSave: PropTypes.func.isRequired,
  availableStates: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default GlobalTransitionEditorModal;
