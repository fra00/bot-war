import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Box from "../ui/Box";
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
}) => {
  return (
    <Card
      className="flex flex-1 flex-col" // flex-1 per occupare lo spazio, rimosso mb-4
      style={{ minHeight: "260px" }}
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
            disabled={isMultiplayer && bot.id !== "player"}
            title={
              isMultiplayer && bot.id !== "player"
                ? "Non puoi visualizzare i log dell'avversario in modalità multiplayer."
                : "Visualizza i log"
            }
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

const GameInfoPanel = ({ gameState, isMultiplayer }) => {
  const botColors = ["#61dafb", "#e06c75"]; // Player, Enemy
  const bots = gameState?.bots || [];
  const [selectedLogBotId, setSelectedLogBotId] = useState(null);
  const [isLogPanelVisible, setIsLogPanelVisible] = useState(false);
  const { addToast } = useToast();

  // Trova il bot selezionato per i log dall'array `bots` più recente.
  const logSource = bots.find((b) => b.id === selectedLogBotId);

  useEffect(() => {
    // Questo effetto gestisce il caso in cui il bot selezionato per i log
    // non esista più (es. dopo un reset del gioco), nascondendo il pannello.
    if (selectedLogBotId && !logSource) {
      setSelectedLogBotId(null);
      setIsLogPanelVisible(false);
    }
  }, [bots, selectedLogBotId, logSource]);

  const handleSelectLog = (bot) => {
    // Se il pannello è già visibile e si clicca sullo stesso bot, lo nasconde.
    // Altrimenti, mostra i log per il bot cliccato.
    if (isLogPanelVisible && selectedLogBotId === bot.id) {
      setIsLogPanelVisible(false);
    } else {
      setSelectedLogBotId(bot.id);
      setIsLogPanelVisible(true);
    }
  };

  const handleCloseLogPanel = () => {
    setIsLogPanelVisible(false);
  };

  const renderLogContent = () => {
    if (!logSource) {
      return "Seleziona un bot per visualizzare i log.";
    }
    if (!logSource.logs || logSource.logs.length === 0) {
      return "Nessun log per questo bot.";
    }
    // Crea una copia invertita per mostrare i log più recenti per primi, senza mutare lo stato originale
    return [...logSource.logs].reverse().join("\n");
  };

  const handleCopyLogs = () => {
    if (!logSource || !logSource.logs || logSource.logs.length === 0) {
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
  };

  if (bots.length === 0) {
    return (
      <div className="flex flex-col h-full gap-4">
        <Box className="flex gap-4">
          <BotInfoPlaceholder name="Player" color={botColors[0]} />
          <BotInfoPlaceholder name="Enemy" color={botColors[1]} />
        </Box>
        <div className="flex-grow p-3 text-xs text-gray-400">
          In attesa dell'inizio della partita...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <Box className="flex gap-4">
        {bots.map((bot, index) => (
          <BotInfo
            key={bot.id}
            bot={bot}
            color={botColors[index]}
            onSelectLog={handleSelectLog}
            isLogActive={isLogPanelVisible && selectedLogBotId === bot.id}
            isMultiplayer={isMultiplayer}
          />
        ))}
      </Box>
      {isLogPanelVisible && logSource && (
        <Tabs defaultIndex={0}>
          <TabList>
            <Tab>Logs ({logSource.name || logSource.id})</Tab>
            <div className="ml-auto flex items-center">
              <Button
                onClick={handleCloseLogPanel}
                size="small"
                variant="ghost"
                className="p-1"
                aria-label="Chiudi pannello log"
                title="Chiudi pannello log"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </TabList>
          <TabPanels>
            <TabPanel>
              <div className="relative">
                <Textarea
                  id="bot-log-textarea"
                  readOnly
                  value={renderLogContent()}
                  onChange={() => {}}
                  rows={8}
                  className="w-full text-xs resize-none bg-gray-800 border-gray-600 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="I log del bot selezionato appariranno qui."
                />
                <Button
                  onClick={handleCopyLogs}
                  size="small"
                  variant="ghost"
                  className="absolute top-1 right-1 p-1"
                  aria-label="Copia log"
                  title="Copia log negli appunti"
                >
                  📋
                </Button>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
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
  isMultiplayer: PropTypes.bool,
};

GameInfoPanel.defaultProps = {
  isMultiplayer: false,
};

export default GameInfoPanel;
