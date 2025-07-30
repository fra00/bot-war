import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Box from "../ui/Box";
import Card from "../ui/Card";
import CardHeader from "../ui/CardHeader";
import ProgressBar from "../ui/ProgressBar";
import Button from "../ui/Button";
import Textarea from "../ui/Textarea";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "../ui/Tabs";

const BotInfo = ({ bot, color, onSelectLog }) => {
  return (
    <Card
      className="flex flex-1 flex-col" // flex-1 per occupare lo spazio, rimosso mb-4
      style={{ minHeight: "260px" }}
    >
      <CardHeader className="flex justify-between items-center flex-shrink-0">
        <span style={{ color }} className="font-bold capitalize">
          {bot.id}
        </span>
        <Button onClick={() => onSelectLog(bot)} size="small" variant="ghost">
          Log
        </Button>
      </CardHeader>
      <div className="p-3 text-xs space-y-2">
        <div>
          <div className="flex justify-between">
            <span>Hull</span>
            <span>{Math.round(bot.hullHp)} / 100</span>
          </div>
          <ProgressBar progress={bot.hullHp} height={6} />
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
          />
        </div>
        <div className="pt-1">
          <p>
            Weight: {bot.totalWeight}{" "}
            {bot.isOverweight && (
              <span className="text-yellow-400 font-bold">(Overweight)</span>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
};

BotInfo.propTypes = {
  bot: PropTypes.shape({
    id: PropTypes.string.isRequired,
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

const GameInfoPanel = ({ gameState }) => {
  const botColors = ["#61dafb", "#e06c75"]; // Player, Enemy
  const robots = gameState?.robots || [];
  const [logSource, setLogSource] = useState(null);

  // Imposta il log del giocatore come predefinito all'avvio e quando il gioco si riavvia
  useEffect(() => {
    if (robots.length > 0) {
      // Se logSource non è impostato o non è più valido (es. dopo un reset), reimpostalo.
      const currentLogSourceIsValid =
        logSource && robots.some((r) => r.id === logSource.id);
      if (!currentLogSourceIsValid) {
        setLogSource(robots[0]);
      }
    } else {
      setLogSource(null);
    }
  }, [robots, logSource]);

  const handleSelectLog = (bot) => {
    setLogSource(bot);
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

  if (robots.length === 0) {
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
        {robots.map((bot, index) => (
          <BotInfo
            key={bot.id}
            bot={bot}
            color={botColors[index]}
            onSelectLog={handleSelectLog}
          />
        ))}
      </Box>
      <Tabs defaultIndex={0}>
        <TabList>
          <Tab>Logs {logSource ? `(${logSource.id})` : ""}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Textarea
              id="bot-log-textarea" // Aggiunto id per soddisfare i propTypes
              readOnly
              value={renderLogContent()}
              onChange={() => {}} // Aggiunto onChange vuoto per soddisfare i propTypes
              rows={8}
              className="w-full text-xs resize-none bg-gray-800 border-gray-600 focus:ring-blue-500 focus:border-blue-500"
              placeholder="I log del bot selezionato appariranno qui."
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

GameInfoPanel.propTypes = {
  gameState: PropTypes.object.isRequired,
};

export default GameInfoPanel;
