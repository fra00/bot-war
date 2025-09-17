import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Label from "../ui/Label";
import Button from "../ui/Button";
import CardFooter from "../ui/CardFooter";
import CodeEditor from "./CodeEditor";
import { generateAITypings } from "../../game/ai/ai-typings";

const StateNodeEditorModal = ({ node, isOpen, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [onEnter, setOnEnter] = useState("");
  const [onExecute, setOnExecute] = useState("");
  const [onExit, setOnExit] = useState("");

  useEffect(() => {
    if (node?.data) {
      setName(node.data.name || "");
      setOnEnter(node.data.onEnter || "onEnter(api, memory, context) {\n  \n}");
      setOnExecute(
        node.data.onExecute ||
          "onExecute(api, memory, context, events) {\n  \n}"
      );
      setOnExit(node.data.onExit || "onExit(api, memory) {\n  \n}");
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

  // Genera le definizioni dei tipi per ogni handler usando useMemo per performance
  const onEnterLibs = useMemo(
    () => [
      {
        content: generateAITypings(["api", "memory", "context"]),
        filePath: "file:///ai-typings/onEnter.d.ts",
      },
    ],
    []
  );

  const onExecuteLibs = useMemo(
    () => [
      {
        content: generateAITypings(["api", "memory", "context", "events"]),
        filePath: "file:///ai-typings/onExecute.d.ts",
      },
    ],
    []
  );

  const onExitLibs = useMemo(
    () => [
      {
        content: generateAITypings(["api", "memory"]),
        filePath: "file:///ai-typings/onExit.d.ts",
      },
    ],
    []
  );

  // Stile comune per gli editor per ridurre la duplicazione
  const editorContainerStyle =
    "h-48 w-full rounded-md overflow-hidden border border-gray-600";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifica Stato: ${node?.data?.name || ""}`}
      fullscreen={true}
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
          <div className={editorContainerStyle}>
            <CodeEditor
              value={onEnter}
              onChange={(value) => setOnEnter(value || "")}
              extraLibs={onEnterLibs}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="on-execute-code">Codice onExecute</Label>
          <div className={editorContainerStyle}>
            <CodeEditor
              value={onExecute}
              onChange={(value) => setOnExecute(value || "")}
              extraLibs={onExecuteLibs}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="on-exit-code">Codice onExit</Label>
          <div className={editorContainerStyle}>
            <CodeEditor
              value={onExit}
              onChange={(value) => setOnExit(value || "")}
              extraLibs={onExitLibs}
            />
          </div>
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
