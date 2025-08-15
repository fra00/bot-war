import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Label from "../ui/Label";
import Button from "../ui/Button";
import CardFooter from "../ui/CardFooter";

// Un semplice textarea per gli snippet di codice.
const CodeTextarea = ({ value, onChange, ...props }) => (
  <textarea
    value={value}
    onChange={onChange}
    className="w-full h-32 p-2 font-mono text-sm bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white"
    {...props}
  />
);

CodeTextarea.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};

const StateNodeEditorModal = ({ node, isOpen, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [onEnter, setOnEnter] = useState("");
  const [onExecute, setOnExecute] = useState("");
  const [onExit, setOnExit] = useState("");

  useEffect(() => {
    if (node?.data) {
      setName(node.data.name || "");
      setOnEnter(node.data.onEnter || "");
      setOnExecute(node.data.onExecute || "");
      setOnExit(node.data.onExit || "");
    }
  }, [node]);

  const handleSave = () => {
    if (!node) return;
    const updatedData = {
      ...node.data,
      name,
      onEnter,
      onExecute,
      onExit,
    };
    onSave(node.id, updatedData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifica Stato: ${node?.data?.name || ""}`}
    >
      <div className="p-6 space-y-4">
        <div>
          <Label htmlFor="state-name">Nome Stato</Label>
          <Input
            id="state-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="es. ATTACKING"
          />
        </div>
        <div>
          <Label htmlFor="on-enter-code">Codice onEnter</Label>
          <CodeTextarea
            id="on-enter-code"
            value={onEnter}
            onChange={(e) => setOnEnter(e.target.value)}
            placeholder="api.log('Entrato nello stato...');"
          />
        </div>
        <div>
          <Label htmlFor="on-execute-code">Codice onExecute</Label>
          <CodeTextarea
            id="on-execute-code"
            value={onExecute}
            onChange={(e) => setOnExecute(e.target.value)}
            placeholder="if (context.enemy) { api.fire(); }"
          />
        </div>
        <div>
          <Label htmlFor="on-exit-code">Codice onExit</Label>
          <CodeTextarea
            id="on-exit-code"
            value={onExit}
            onChange={(e) => setOnExit(e.target.value)}
            placeholder="api.log('Uscito dallo stato...');"
          />
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

StateNodeEditorModal.propTypes = {
  node: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default StateNodeEditorModal;
