import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Label from "../ui/Label";
import Button from "../ui/Button";
import CardFooter from "../ui/CardFooter";
import CodeEditor from "./CodeEditor";
import { generateAITypings } from "../../game/ai/ai-typings";

const TransitionEditorModal = ({ edge, isOpen, onClose, onSave }) => {
  const [label, setLabel] = useState("");
  const [condition, setCondition] = useState("");

  useEffect(() => {
    if (edge) {
      setLabel(edge.label || "");
      setCondition(
        edge.data?.condition ||
          "(api, memory, context, events) => {\n  return true;\n}"
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
          <div className={editorContainerStyle}>
            <CodeEditor
              value={condition}
              onChange={(value) => setCondition(value || "")}
              extraLibs={conditionLibs}
            />
          </div>
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
