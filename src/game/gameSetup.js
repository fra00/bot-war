import Arena from "./Arena.js";
import Robot from "./Robot.js";
import * as components from "./components.js";

/**
 * Configura lo stato iniziale del gioco, inclusa l'arena e i robot.
 * @param {Object} playerAI - L'IA del giocatore.
 * @param {Object} defaultAI - L'IA di default per l'avversario.
 * @returns {{arena: Arena, robots: Array<Robot>}} Lo stato iniziale del gioco.
 */
export function setupGame(playerAI, defaultAI) {
  const arena = new Arena(800, 600);

  // Definisce i punti di partenza dei robot per usarli come zone sicure
  const spawnPoints = [
    { x: 100, y: 300 },
    { x: 700, y: 300 },
  ];

  // Genera ostacoli casuali, evitando le zone di partenza
  arena.generateObstacles(5, spawnPoints);

  // Definisce le configurazioni (loadout) dei robot
  const playerLoadout = {
    armor: { ...components.standardArmor },
    cannon: { ...components.standardCannon },
    battery: { ...components.standardBattery },
    motor: { ...components.standardMotor },
    radar: { ...components.standardRadar },
  };

  const opponentLoadout = {
    armor: { ...components.standardArmor },
    cannon: { ...components.standardCannon },
    battery: { ...components.standardBattery },
    motor: { ...components.standardMotor },
    radar: { ...components.standardRadar },
  };

  const robots = [
    new Robot({
      id: "player",
      x: spawnPoints[0].x,
      y: spawnPoints[0].y,
      rotation: 0, // Face right
      ai: playerAI,
      ...playerLoadout,
    }),
    new Robot({
      id: "opponent",
      x: spawnPoints[1].x,
      y: spawnPoints[1].y,
      rotation: 180, // Face left
      ai: defaultAI,
      ...opponentLoadout,
    }),
  ];

  return { arena, robots };
}
