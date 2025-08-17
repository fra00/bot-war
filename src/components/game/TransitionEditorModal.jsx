import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Label from "../ui/Label";
import Button from "../ui/Button";
import CardFooter from "../ui/CardFooter";

// Un semplice textarea per gli snippet di codice, riutilizzabile.
const CodeTextarea = ({ value, onChange, ...props }) => (
  <textarea
    value={value}
    onChange={onChange}
    className="w-full h-48 p-2 font-mono text-sm bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white"
    {...props}
  />
);

CodeTextarea.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};

const TransitionEditorModal = ({ edge, isOpen, onClose, onSave }) => {
  const [label, setLabel] = useState("");
  const [condition, setCondition] = useState("");

  useEffect(() => {
    if (edge) {
      setLabel(edge.label || "");
      setCondition(
        edge.data?.condition || "(api, memory, context, events) => {\n  return true;\n}"
      );
    }
  }, [edge]);

  const handleSave = () => {
    if (!edge) return;
    const updatedEdge = {
      ...edge,
      label,
      data: {
        ...edge.data,
        condition,
      },
    };
    onSave(updatedEdge);
    onClose();
  };

  if (!edge) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifica Transizione`}
      fullscreen={true}
    >
      <div className="p-6 space-y-4">
        <div>
          <Label htmlFor="transition-label">Etichetta (Descrizione)</Label>
          <Input
            id="transition-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="es. Nemico rilevato"
          />
        </div>
        <div>
          <Label htmlFor="transition-condition">Condizione (JavaScript)</Label>
          <CodeTextarea
            id="transition-condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="(api, memory, context) => context.enemy"
          />
          <p className="mt-1 text-xs text-gray-400">
            La condizione deve essere una funzione JavaScript che ritorna `true`
            o `false`.
          </p>
        </div>
      </div>
      <CardFooter>
        <Button onClick={onClose} variant="secondary">
          Annulla
        </Button>
        <Button onClick={handleSave}>Salva Modifiche</Button>
      </CardFooter>
    </Modal>
  );
};

TransitionEditorModal.propTypes = {
  edge: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default TransitionEditorModal;
