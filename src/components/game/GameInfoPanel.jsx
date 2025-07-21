import React from "react";
import PropTypes from "prop-types";
import Box from "../ui/Box";
import Card from "../ui/Card";
import CardHeader from "../ui/CardHeader";
import ProgressBar from "../ui/ProgressBar";
import { standardArmor, standardBattery } from "../../game/components.js";

const BotInfo = ({ bot, color }) => (
  <Card className="mb-4">
    <CardHeader>
      <span style={{ color }} className="font-bold capitalize">
        {bot.id}
      </span>
    </CardHeader>
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
            {Math.round(bot.armorHp)} / {standardArmor.maxHp}
          </span>
        </div>
        <ProgressBar progress={(bot.armorHp / standardArmor.maxHp) * 100} />
      </div>
      <div>
        <div className="flex justify-between">
          <span>Energy</span>
          <span>
            {Math.round(bot.energy)} / {standardBattery.maxEnergy}
          </span>
        </div>
        <ProgressBar progress={(bot.energy / standardBattery.maxEnergy) * 100} />
      </div>
      <div className="pt-2">
        <p>
          Weight: {bot.totalWeight}{" "}
          {bot.isOverweight && (
            <span className="text-yellow-400 font-bold">(Overweight)</span>
          )}
        </p>
        <p>
          Position: ({Math.round(bot.x)}, {Math.round(bot.y)})
        </p>
        <p>Angle: {Math.round(bot.rotation)}°</p>
      </div>
    </div>
  </Card>
);

BotInfo.propTypes = {
  bot: PropTypes.shape({
    id: PropTypes.string.isRequired,
    hullHp: PropTypes.number.isRequired,
    armorHp: PropTypes.number.isRequired,
    energy: PropTypes.number.isRequired,
    totalWeight: PropTypes.number.isRequired,
    isOverweight: PropTypes.bool.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    rotation: PropTypes.number.isRequired,
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
          <span>
            {standardArmor.maxHp} / {standardArmor.maxHp}
          </span>
        </div>
        <ProgressBar progress={100} />
      </div>
      <div>
        <div className="flex justify-between">
          <span>Energy</span>
          <span>
            {standardBattery.maxEnergy} / {standardBattery.maxEnergy}
          </span>
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
