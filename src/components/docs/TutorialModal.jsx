import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import CardFooter from "../ui/CardFooter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import tutorialContent from "../../docs/tutorial.md?raw";

/**
 * Un modal che carica, converte e visualizza la documentazione da tutorial.md.
 */
const TutorialModal = ({ isOpen, onClose }) => {
  const [copyStatus, setCopyStatus] = useState("Copia");

  // Gestisce la copia del contenuto markdown negli appunti.
  const handleCopy = () => {
    navigator.clipboard.writeText(tutorialContent).then(
      () => {
        setCopyStatus("Copiato!");
        setTimeout(() => setCopyStatus("Copia"), 2000); // Resetta dopo 2 secondi
      },
      (err) => {
        console.error("Failed to copy tutorial markdown: ", err);
        setCopyStatus("Errore!");
        setTimeout(() => setCopyStatus("Copia"), 2000);
      }
    );
  };

  // Gestisce il download del file .md.
  const handleDownload = () => {
    const blob = new Blob([tutorialContent], {
      type: "text/markdown;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "tutorial.md");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tutorial di Gioco"
      fullscreen
    >
      <div className="p-6 prose prose-invert max-w-none bg-gray-800 h-full overflow-y-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {tutorialContent}
        </ReactMarkdown>
      </div>
      <CardFooter className="flex items-center">
        <Button onClick={handleCopy} variant="secondary">
          {copyStatus}
        </Button>
        <Button onClick={handleDownload} variant="secondary" className="ml-2">
          Download .md
        </Button>
        <div className="flex-grow" />
        <Button onClick={onClose} variant="primary">
          Chiudi
        </Button>
      </CardFooter>
    </Modal>
  );
};

TutorialModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TutorialModal;
