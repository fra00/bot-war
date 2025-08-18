import React from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import CardFooter from "../ui/CardFooter";
import Button from "../ui/Button";
import Box from "../ui/Box";

const OpponentSelectionModal = ({
  isOpen,
  onClose,
  scripts,
  selectedOpponentId,
  onSelectOpponent,
}) => {
  const opponentOptions = [
    { value: "", label: "Default AI" },
    ...scripts.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Seleziona Avversario">
      <Box className="p-4">
        <label
          htmlFor="opponent-select-modal"
          className="block mb-2 text-sm font-medium"
        >
          Scegli l'IA per il tuo avversario
        </label>
        <Select
          id="opponent-select-modal"
          options={opponentOptions}
          value={selectedOpponentId || ""}
          onChange={(e) => onSelectOpponent(e.target.value)}
        />
      </Box>
      <CardFooter>
        <Button onClick={onClose} variant="secondary">
          Annulla
        </Button>
        <Button onClick={onClose}>Conferma</Button>
      </CardFooter>
    </Modal>
  );
};

OpponentSelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  scripts: PropTypes.array.isRequired,
  selectedOpponentId: PropTypes.string,
  onSelectOpponent: PropTypes.func.isRequired,
};

export default OpponentSelectionModal;
