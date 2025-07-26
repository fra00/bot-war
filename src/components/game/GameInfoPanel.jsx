import React, { useState } from "react";
import PropTypes from "prop-types";
import Box from "../ui/Box";
import Card from "../ui/Card";
import CardHeader from "../ui/CardHeader";
import ProgressBar from "../ui/ProgressBar";
import Button from "../ui/Button";
import Textarea from "../ui/Textarea";

const BotInfo = ({ bot, color }) => {
  const [showLogs, setShowLogs] = useState(false);
  const toggleLogs = () => setShowLogs(!showLogs);

  return (
    <Card className="mb-4 flex flex-col" style={{ minHeight: "260px" }}>
      <CardHeader className="flex justify-between items-center flex-shrink-0">
        <span style={{ color }} className="font-bold capitalize">
          {bot.id}
        </span>
        <Button onClick={toggleLogs} size="small" variant="ghost">
          {showLogs ? "Info" : "Log"}
        </Button>
      </CardHeader>
      {showLogs ? (
        <div className="p-2 flex-grow">
          <Textarea
            readOnly
            value={
              bot.logs && bot.logs.length > 0
                ? bot.logs.reverse().join("\n")
                : "Nessun log."
            }
            className="w-full h-full text-xs resize-none bg-transparent border-0 focus:ring-0"
          />
        </div>
      ) : (
        <div className="p-4 text-sm space-y-3">
          <div>
            <div className="flex justify-between">
              <span>Hull</span>
              <span>{Math.round(bot.hullHp)} / 100</span>
            </div>
            <ProgressBar progress={bot.hullHp} />
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
            />
          </div>
          <div className="pt-2">
            <p>
              Weight: {bot.totalWeight}{" "}
              {bot.isOverweight && (
                <span className="text-yellow-400 font-bold">(Overweight)</span>
              )}
            </p>
          </div>
        </div>
      )}
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
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    rotation: PropTypes.number.isRequired,
    logs: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  color: PropTypes.string.isRequired,
};

const BotInfoPlaceholder = ({ name, color }) => (
  <Card className="mb-4 opacity-60">
    <CardHeader>
      <span style={{ color }} className="font-bold">
        {name}
      </span>
    </CardHeader>
    <div className="p-4 text-sm space-y-3">
      <div>
        <div className="flex justify-between">
          <span>Hull</span>
          <span>100 / 100</span>
        </div>
        <ProgressBar progress={100} />
      </div>
      <div>
        <div className="flex justify-between">
          <span>Armor</span>
          <span>50 / 50</span>
        </div>
        <ProgressBar progress={100} />
      </div>
      <div>
        <div className="flex justify-between">
          <span>Energy</span>
          <span>100 / 100</span>
        </div>
        <ProgressBar progress={100} />
      </div>
      <div className="pt-2">
        <p>Weight: ...</p>
        <p>Position: (..., ...)</p>
        <p>Angle: ...°</p>
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

  // Se l'array dei robot è vuoto (es. prima che la partita inizi),
  // mostriamo dei segnaposto per una migliore UX.
  if (robots.length === 0) {
    return (
      <Box>
        <BotInfoPlaceholder name="Player" color={botColors[0]} />
        <BotInfoPlaceholder name="Enemy" color={botColors[1]} />
      </Box>
    );
  }

  return (
    <Box>
      {robots.map((bot, index) => (
        <BotInfo key={bot.id} bot={bot} color={botColors[index]} />
      ))}
    </Box>
  );
};

GameInfoPanel.propTypes = {
  gameState: PropTypes.object.isRequired,
};

export default GameInfoPanel;
