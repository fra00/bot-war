import React from 'react';
import PropTypes from 'prop-types';
import Card from './Card';
import CardHeader from './CardHeader';
import './Modal.css';
import CardFooter from './CardFooter';

/**
 * Componente per mostrare contenuti in una finestra di dialogo sovrapposta (modale).
 * La sua visibilità è controllata dall'hook `useDisclosure`.
 *
 * @example
 * // Per usare il modale, si gestisce lo stato con l'hook `useDisclosure`.
 * const { isOpen, onOpen, onClose } = useDisclosure();
 *
 * return (
 *   <>
 *     <Button onClick={onOpen}>Apri Modale</Button>
 *
 *     <Modal isOpen={isOpen} onClose={onClose} title="Titolo del Modale">
 *       <p>
 *         Questo è il contenuto del modale. Può contenere form, testo o altri componenti.
 *       </p>
 *       <CardFooter>
 *         <Button variant="secondary" onClick={onClose}>Annulla</Button>
 *         <Button variant="primary" onClick={onClose}>Conferma</Button>
 *       </CardFooter>
 *     </Modal>
 *   </>
 * );
 */
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  const handleContentClick = (e) => e.stopPropagation();

  const childrenArray = React.Children.toArray(children);
  const footer = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === CardFooter
  );
  const content = childrenArray.filter((child) => child !== footer);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleContentClick}>
        <Card className="modal-card">
          {title && <CardHeader>{title}</CardHeader>}
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
          <div className="modal-body">{content}</div>
          {footer}
        </Card>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
};

export default Modal;
