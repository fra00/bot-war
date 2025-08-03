import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "../ui/Modal";
import CardFooter from "../ui/CardFooter";
import Button from "../ui/Button";
import ToggleSwitch from "../ui/ToggleSwitch";
import Box from "../ui/Box";

const BotSettingsModal = ({ isOpen, onClose, bot, onSave }) => {
  const [settings, setSettings] = useState({
    visibility: "private",
    isMultiplayerEligible: false,
  });

  // Aggiorna lo stato interno quando il bot cambia
  useEffect(() => {
    if (bot) {
      setSettings({
        visibility: bot.visibility || "private",
        isMultiplayerEligible: bot.isMultiplayerEligible || false,
      });
    }
  }, [bot]);

  // Modificato per invertire lo stato precedente, rendendolo più robusto.
  const handleToggleVisibility = () => {
    setSettings((prev) => ({
      ...prev,
      visibility: prev.visibility === "public" ? "private" : "public",
    }));
  };

  // Modificato per invertire lo stato precedente.
  const handleToggleMultiplayer = () => {
    setSettings((prev) => ({ ...prev, isMultiplayerEligible: !prev.isMultiplayerEligible }));
  };

  const handleSaveClick = () => {
    onSave(settings);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Impostazioni di "${bot?.name}"`}>
      <Box className="p-4 space-y-6">
        <ToggleSwitch
          label="Bot Pubblico"
          description="Se attivo, altri giocatori potranno vedere questo bot (ma non il codice)."
          checked={settings.visibility === "public"}
          onChange={handleToggleVisibility}
        />
        <ToggleSwitch
          label="Abilita per Multiplayer"
          description="Se attivo, questo bot potrà essere usato nelle sfide multiplayer."
          checked={settings.isMultiplayerEligible}
          onChange={handleToggleMultiplayer}
        />
      </Box>
      <CardFooter>
        <Button onClick={onClose} variant="secondary">
          Annulla
        </Button>
        <Button onClick={handleSaveClick}>Salva Impostazioni</Button>
      </CardFooter>
    </Modal>
  );
};

BotSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bot: PropTypes.object,
  onSave: PropTypes.func.isRequired,
};

export default BotSettingsModal;