import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import MatchReportModal from "./MatchReportModal";
import { calculateFinalStats } from "../../game/statsCalculator";

/**
 * Modale visualizzato alla fine della partita.
 * Mostra il vincitore (o un pareggio) e offre opzioni per ricominciare o chiudere.
 */
const GameOverModal = ({ isOpen, gameState, onRestart, onClose }) => {
  const { winner } = gameState;
  const winnerName = winner?.name || winner?.id || "Vincitore Sconosciuto";
  const title = "Partita Terminata!";
  const message = winner
    ? `Congratulazioni a ${winnerName} per la vittoria!`
    : "Entrambi i bot sono stati distrutti. È un pareggio!";

  const finalStats = useMemo(() => {
    return calculateFinalStats(gameState);
  }, [gameState]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center p-4">
        <h2 className="text-2xl font-bold mb-2">
          {winner ? `Ha vinto ${winnerName}!` : "Pareggio!"}
        </h2>
        <p className="text-lg">{message}</p>
        <MatchReportModal stats={finalStats} />
        <div className="flex justify-center gap-4 mt-6">
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
  /**
   * Lo stato completo del gioco alla fine della partita.
   * Contiene il vincitore, i bot e le statistiche.
   */
  gameState: PropTypes.object.isRequired,
  /** Funzione da eseguire quando si clicca su "Ricomincia". */
  onRestart: PropTypes.func.isRequired,
  /** Funzione da eseguire per chiudere il modale. */
  onClose: PropTypes.func.isRequired,
};

export default GameOverModal;
