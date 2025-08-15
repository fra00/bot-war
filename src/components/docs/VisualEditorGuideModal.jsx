import React from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import visualEditorGuide from "../../docs/visual-editor-guide.md?raw"; // Importa come stringa raw

const VisualEditorGuideModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Guida all'Editor Visuale"
      fullscreen
    >
      <div className="p-6 prose prose-invert max-w-none bg-gray-800 h-full overflow-y-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {visualEditorGuide}
        </ReactMarkdown>
      </div>
    </Modal>
  );
};

VisualEditorGuideModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default VisualEditorGuideModal;
