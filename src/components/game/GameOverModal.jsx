import React from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

/**
 * Modale visualizzato alla fine della partita.
 * Mostra il vincitore (o un pareggio) e offre opzioni per ricominciare o chiudere.
 */
const GameOverModal = ({ isOpen, winner, onRestart, onClose }) => {
  const winnerName = winner?.name || winner?.id || "Vincitore Sconosciuto";
  const title = "Partita Terminata!";
  const message = winner
    ? `Congratulazioni a ${winnerName} per la vittoria!`
    : "Entrambi i bot sono stati distrutti. È un pareggio!";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center p-4">
        <h2 className="text-2xl font-bold mb-2">
          {winner ? `Ha vinto ${winnerName}!` : "Pareggio!"}
        </h2>
        <p className="text-lg mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <Button
            onClick={onRestart}
            className="bg-green-600 hover:bg-green-700"
          >
            Ricomincia
          </Button>
          <Button onClick={onClose} variant="secondary">
            Chiudi
          </Button>
        </div>
      </div>
    </Modal>
  );
};

GameOverModal.propTypes = {
  /** Controlla se il modale è visibile. */
  isOpen: PropTypes.bool.isRequired,
  /** L'oggetto del bot vincitore. Se null, indica un pareggio. */
  winner: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  /** Funzione da eseguire quando si clicca su "Ricomincia". */
  onRestart: PropTypes.func.isRequired,
  /** Funzione da eseguire per chiudere il modale. */
  onClose: PropTypes.func.isRequired,
};

export default GameOverModal;
