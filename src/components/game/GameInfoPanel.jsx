import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Box from "../ui/Box";
import Dialog from "../ui/Dialog";
import Card from "../ui/Card";
import CardHeader from "../ui/CardHeader";
import ProgressBar from "../ui/ProgressBar";
import Button from "../ui/Button";
import Textarea from "../ui/Textarea";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "../ui/Tabs";
import { useToast } from "../ui/toast/ToastProvider";

const BotInfo = ({
  bot,
  color,
  onSelectLog,
  isLogActive,
  isMultiplayer,
  isRight,
}) => {
  // Applica il background solo all'immagine, non al contenuto
  const bgFilter = isRight
    ? "hue-rotate(140deg) saturate(1.3) brightness(1.1)"
    : "hue-rotate(-40deg) saturate(1.3) brightness(1.1)";
  const bgTransform = isRight ? "scaleX(-1)" : "none";
  return (
    <Card
      className="flex flex-1 flex-col relative overflow-hidden"
      style={{ minHeight: "260px" }}
    >
      {/* Background image assoluto, filtri e mirror solo qui */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundImage: "url('/hover tank 2.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: bgFilter,
          transform: bgTransform,
          pointerEvents: "none",
        }}
      />
      {/* Contenuto sopra il background */}
      <div
        className="relative z-10"
        style={{
          background: "rgba(24, 28, 40, 0.72)",
          borderRadius: "inherit",
        }}
      >
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center">
            <span style={{ color }} className="font-bold">
              {bot.name || bot.id}
            </span>
            {bot.isCustomAI && (
              <span
                title="Questa IA è controllata da uno script personalizzato"
                className="ml-2"
              >
                🧠
              </span>
            )}
          </div>
          <div className="mt-1">
            <Button
              onClick={() => onSelectLog(bot)}
              size="small"
              variant={isLogActive ? "primary" : "ghost"}
            >
              Log
            </Button>
          </div>
        </CardHeader>
        <div className="p-3 text-xs space-y-2">
          <div>
            <div className="flex justify-between">
              <span>Hull</span>
              <span>{Math.round(bot.hullHp)} / 100</span>
            </div>
            <ProgressBar progress={bot.hullHp} height={6} color="#2ecc71" />
          </div>
          <div>
            <div className="flex justify-between">
              <span>Armor</span>
              <span>
                {bot.armorHp.toFixed(0)} / {bot.maxArmorHp}
              </span>
            </div>
            <ProgressBar
              progress={
                bot.maxArmorHp > 0 ? (bot.armorHp / bot.maxArmorHp) * 100 : 0
              }
              height={6}
              color="#e74c3c"
            />
          </div>
          <div>
            <div className="flex justify-between">
              <span>Energy</span>
              <span>
                {bot.energy.toFixed(1)} / {bot.maxEnergy}
              </span>
            </div>
            <ProgressBar
              progress={
                bot.maxEnergy > 0 ? (bot.energy / bot.maxEnergy) * 100 : 0
              }
              height={6}
              color="#3498db" // Blu per l'energia
            />
          </div>
          <div className="pt-1">
            <p>
              Weight: {bot.totalWeight}{" "}
              {bot.isOverweight && (
                <span className="text-yellow-400 font-bold">(Overweight)</span>
              )}
            </p>
            {/* Mostra esplicitamente lo script AI per il bot del giocatore */}
            {bot.id === "player" && bot.name && (
              <p className="text-xs text-gray-400 mt-1">
                Script AI: <span className="font-semibold">{bot.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

BotInfo.propTypes = {
  bot: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string, // Il nome viene aggiunto in App.jsx
    isCustomAI: PropTypes.bool,
    hullHp: PropTypes.number.isRequired,
    armorHp: PropTypes.number.isRequired,
    maxArmorHp: PropTypes.number.isRequired,
    energy: PropTypes.number.isRequired,
    maxEnergy: PropTypes.number.isRequired,
    totalWeight: PropTypes.number.isRequired,
    isOverweight: PropTypes.bool.isRequired,
    logs: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  color: PropTypes.string.isRequired,
  onSelectLog: PropTypes.func.isRequired,
  isLogActive: PropTypes.bool.isRequired,
  isMultiplayer: PropTypes.bool,
};

const BotInfoPlaceholder = ({ name, color }) => (
  <Card className="flex-1 opacity-60">
    <CardHeader>
      <span style={{ color }} className="font-bold">
        {name}
      </span>
    </CardHeader>
    <div className="p-3 text-xs space-y-2">
      <div>
        <div className="flex justify-between">
          <span>Hull</span>
          <span>100 / 100</span>
        </div>
        <ProgressBar progress={100} height={6} />
      </div>
      <div>
        <div className="flex justify-between">
          <span>Armor</span>
          <span>50 / 50</span>
        </div>
        <ProgressBar progress={100} height={6} />
      </div>
      <div>
        <div className="flex justify-between">
          <span>Energy</span>
          <span>100 / 100</span>
        </div>
        <ProgressBar progress={100} height={6} />
      </div>
      <div className="pt-1">
        <p>Weight: ...</p>
      </div>
    </div>
  </Card>
);

BotInfoPlaceholder.propTypes = {
  name: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};

const GameInfoPanel = ({ gameState, index, isMultiplayer }) => {
  if (gameState?.bots == null || gameState.bots.length <= index) {
    return <div>Loading...</div>;
  }
  const botColors = ["#61dafb", "#e06c75"]; // Player, Enemy
  const currentBot = gameState?.bots[index];

  const { addToast } = useToast();

  // Troviamo l'oggetto bot più aggiornato dall'attuale gameState usando l'ID memorizzato.
  const [logSource, setLogSource] = useState(null);

  const handleSelectLog = (bot) => {
    // Se il pannello è già visibile e si clicca sullo stesso bot, lo nasconde.
    // Altrimenti, mostra i log per il bot cliccato
    setLogSource(!!logSource ? null : currentBot);
  };

  const handleCloseLogPanel = useCallback(() => {
    setLogSource(null);
  }, []);

  const renderLogContent = useCallback(() => {
    if (!logSource) {
      // logSource qui è l'oggetto bot aggiornato
      return "Seleziona un bot per visualizzare i log.";
    }
    if (!logSource.logs || logSource.logs.length === 0) {
      return "Nessun log per questo bot.";
    }
    // Crea una copia invertita per mostrare i log più recenti per primi, senza mutare lo stato originale
    return [...logSource.logs].reverse().join("\n");
  }, [logSource]);

  const handleCopyLogs = useCallback(() => {
    if (!logSource || !logSource.logs || !logSource.logs.length) {
      // Anche qui, usa l'oggetto aggiornato
      addToast("Nessun log da copiare.", "warning");
      return;
    }
    const logText = renderLogContent();
    navigator.clipboard.writeText(logText).then(
      () => {
        addToast("Log copiati negli appunti!", "success");
      },
      (err) => {
        addToast("Impossibile copiare i log.", "danger");
        console.error("Could not copy text: ", err);
      }
    );
  }, [logSource, addToast, renderLogContent]);

  if (currentBot === null) {
    return (
      <div className="flex flex-col h-full gap-4">
        <Box className="flex gap-4">
          <BotInfoPlaceholder
            name={index == 0 ? "Player" : "Enemy"}
            color={botColors[index]}
          />
        </Box>
        <div className="flex-grow p-3 text-xs text-gray-400">
          In attesa dell'inizio della partita...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <BotInfo
        key={currentBot.id}
        bot={currentBot}
        color={botColors[index]}
        onSelectLog={handleSelectLog}
        isLogActive={logSource != null}
        isMultiplayer={isMultiplayer}
        isRight={index === 1}
      />
      {logSource != null && (
        <Dialog
          isOpen={logSource != null} // La visibilità dipende dall'esistenza di un logSource valido
          onClose={handleCloseLogPanel}
          title={`Log - ${logSource?.name || "N/A"}`}
        >
          <div className="flex flex-col h-full">
            <div className="flex flex-col gap-1 h-full">
              <div className="flex justify-end">
                <Button
                  onClick={handleCopyLogs}
                  size="small"
                  variant="ghost"
                  className="p-1"
                  aria-label="Copia log"
                  title="Copia log negli appunti"
                >
                  📋
                </Button>
              </div>
              <Textarea
                id="bot-log-textarea"
                readOnly
                value={renderLogContent()}
                className="w-full text-xs resize-none bg-gray-800 border-gray-600 focus:ring-blue-500 focus:border-blue-500 flex-grow"
                placeholder="I log del bot selezionato appariranno qui."
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

GameInfoPanel.propTypes = {
  gameState: PropTypes.shape({
    // La logica in App.jsx arricchisce i bot con i loro nomi
    bots: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        isCustomAI: PropTypes.bool,
        hullHp: PropTypes.number.isRequired,
        armorHp: PropTypes.number.isRequired,
        maxArmorHp: PropTypes.number.isRequired,
        energy: PropTypes.number.isRequired,
        maxEnergy: PropTypes.number.isRequired,
      })
    ),
  }).isRequired,
  index: PropTypes.oneOf([0, 1]).isRequired,
  isMultiplayer: PropTypes.bool,
};

GameInfoPanel.defaultProps = {
  isMultiplayer: false,
};

export default GameInfoPanel;
