import React from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import CardFooter from "../ui/CardFooter";

/**
 * Un modale che viene visualizzato alla fine della partita,
 * mostrando il vincitore e offrendo opzioni per riavviare o chiudere.
 */
const GameOverModal = ({ isOpen, winner, onRestart, onClose }) => {
  const winnerMessage = winner
    ? `Il vincitore è: ${winner}!`
    : "La partita è finita in pareggio!";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Partita Terminata">
      <div className="p-4 text-center text-lg">
        <p>{winnerMessage}</p>
      </div>
      <CardFooter>
        <Button variant="secondary" onClick={onClose}>
          Chiudi
        </Button>
        <Button onClick={onRestart}>Ricomincia</Button>
      </CardFooter>
    </Modal>
  );
};

GameOverModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  winner: PropTypes.string,
  onRestart: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default GameOverModal;
