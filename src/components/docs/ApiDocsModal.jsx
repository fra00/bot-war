import React, { useState } from 'react';
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import CardFooter from "../ui/CardFooter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import apiDocsContent from "../../docs/api.md?raw";

/**
 * Un modal che carica, converte e visualizza la documentazione dall'api.md.
 */
const ApiDocsModal = ({ isOpen, onClose }) => {
  const [copyStatus, setCopyStatus] = useState('Copia');

  // Gestisce la copia del contenuto markdown negli appunti.
  const handleCopy = () => {
    navigator.clipboard.writeText(apiDocsContent).then(
      () => {
        setCopyStatus('Copiato!');
        setTimeout(() => setCopyStatus('Copia'), 2000); // Resetta dopo 2 secondi
      },
      (err) => {
        console.error('Failed to copy markdown: ', err);
        setCopyStatus('Error!');
        setTimeout(() => setCopyStatus('Copy'), 2000);
      }
    );
  };

  // Gestisce il download del file .md.
  const handleDownload = () => {
    const blob = new Blob([apiDocsContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'api.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Documentazione API"
      fullscreen
    >
      <div className="p-6 prose prose-invert max-w-none bg-gray-800 h-full overflow-y-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {apiDocsContent}
        </ReactMarkdown>
      </div>
      {/* Il footer ora usa flexbox per allineare i pulsanti */}
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

ApiDocsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ApiDocsModal;
