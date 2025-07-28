import React, { useMemo, useState } from 'react';
import PropTypes from "prop-types";
import { marked } from "marked";
import DOMPurify from "dompurify";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import CardFooter from "../ui/CardFooter";
import Article from "../ui/Article";
import apiDocsContent from "../../docs/api.md?raw";

/**
 * Un modal che carica, converte e visualizza la documentazione dall'api.md.
 */
const ApiDocsModal = ({ isOpen, onClose }) => {
  const [copyStatus, setCopyStatus] = useState('Copy');
  // Converte il markdown in HTML in modo sicuro solo quando il modal si apre.
  const htmlContent = useMemo(() => {
    if (!isOpen) return "";
    const rawHtml = marked.parse(apiDocsContent, { gfm: true, breaks: true });
    return DOMPurify.sanitize(rawHtml);
  }, [isOpen]);

  // Gestisce la copia del contenuto markdown negli appunti.
  const handleCopy = () => {
    navigator.clipboard.writeText(apiDocsContent).then(
      () => {
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy'), 2000); // Resetta dopo 2 secondi
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
      title="API Documentation"
      fullscreen
    >
      <div className="flex-grow min-h-0 overflow-y-auto">
        <Article
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
      {/* Il footer ora usa flexbox per allineare i pulsanti */}
      <CardFooter className="flex items-center">
        <Button onClick={handleCopy} variant="secondary">
          {copyStatus}
        </Button>
        <Button onClick={handleDownload} variant="secondary" className="ml-2">
          Download .md
        </Button>
        <div className="flex-grow" /> {/* Questo spinge il pulsante Close a destra */}
        <Button onClick={onClose} variant="secondary">
          Close
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
