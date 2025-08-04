import Robot from "./Robot.js";
import {
  checkLineOfSight,
  isPositionWalkable,
  checkForObstacleAhead,
} from "./systems/perceptionSystem.js";
import { createNavigationGrid } from "./systems/navigationGrid.js";
import { findPath } from "./systems/pathfindingSystem.js";
import {
  generateCommandsForPath,
  generateAimCommand,
} from "./systems/navigationSystem.js";

/**
 * Fornisce un'API sicura che l'IA può utilizzare per interagire con il mondo.
 * Queste funzioni non modificano direttamente lo stato del robot, ma accodano
 * azioni che verranno elaborate dal motore di gioco.
 */
class RobotAPI {
  /**
   * @param {Robot} robot - L'istanza del robot da controllare.
   * @param {import('./Game.js').GameState} gameState - Lo stato attuale del gioco.
   */
  constructor(robot, gameState) {
    this.robot = robot;
    this.gameState = gameState;
  }

  // --- Private helpers ---

  /** @private */
  _setAction(type, payload = {}) {
    this.robot.nextActions.push({ type, payload });
  }

  // --- Public API methods ---

  // --- Azioni di Debug ---
  log = (...args) => {
    const message = args
      .map((arg) => {
        if (typeof arg === "object" && arg !== null) {
          return JSON.stringify(arg);
        }
        return String(arg);
      })
      .join(" ");
    this.robot.logs.push(message);
    if (this.robot.logs.length > 100) {
      this.robot.logs.shift();
    }
  };

  // --- Azioni Asincrone ---
  move = (distance, speedPercentage = 100) => {
    const angleRad = this.robot.rotation * (Math.PI / 180);
    const destX = this.robot.x + distance * Math.cos(angleRad);
    const destY = this.robot.y + distance * Math.sin(angleRad);
    this.robot.destination = { x: destX, y: destY };
    this.robot.path = [
      { x: this.robot.x, y: this.robot.y },
      { x: destX, y: destY },
    ];
    this._setAction("START_MOVE", { distance, speedPercentage });
  };

  moveTo = (targetX, targetY, speedPercentage = 100) => {
    this.robot.destination = { x: targetX, y: targetY };
    this.robot.path = null;

    const cellSize = Robot.RADIUS * 2;
    const grid = createNavigationGrid(this.gameState.arena, Robot.RADIUS);

    const startCoords = {
      x: Math.floor(this.robot.x / cellSize),
      y: Math.floor(this.robot.y / cellSize),
    };
    let endCoords = {
      x: Math.floor(targetX / cellSize),
      y: Math.floor(targetY / cellSize),
    };

    if (!grid[endCoords.y]?.[endCoords.x]?.walkable) {
      this.log(
        `Destinazione (${endCoords.x},${endCoords.y}) non calpestabile. Cerco un'alternativa...`
      );
      let foundValidAlternative = false;
      for (let radius = 1; radius < 5; radius++) {
        for (let i = -radius; i <= radius; i++) {
          for (let j = -radius; j <= radius; j++) {
            if (i === 0 && j === 0) continue;
            const newY = endCoords.y + i;
            const newX = endCoords.x + j;
            if (grid[newY]?.[newX]?.walkable) {
              endCoords = { x: newX, y: newY };
              this.log(`Trovata alternativa valida a (${newX},${newY})`);
              foundValidAlternative = true;
              break;
            }
          }
          if (foundValidAlternative) break;
        }
        if (foundValidAlternative) break;
      }
    }

    const path = findPath(grid, startCoords, endCoords);

    if (path && path.length > 1) {
      const worldPath = path.map((node) => ({
        x: node.x * cellSize + cellSize / 2,
        y: node.y * cellSize + cellSize / 2,
      }));
      worldPath.unshift({ x: this.robot.x, y: this.robot.y });
      this.robot.path = worldPath;

      path.shift();
      const actions = generateCommandsForPath(
        path,
        { x: this.robot.x, y: this.robot.y },
        this.robot.rotation,
        cellSize,
        speedPercentage
      );
      this.robot.nextActions.push(...actions, { type: "END_SEQUENCE" });
    }
  };

  rotate = (angle, speedPercentage = 100) =>
    this._setAction("START_ROTATE", { angle, speedPercentage });

  stop = () => {
    this.robot.destination = null;
    this.robot.path = null;
    this.robot.nextActions = [{ type: "STOP_ACTION" }];
  };

  aimAt = (targetX, targetY, speedPercentage = 100) => {
    const command = generateAimCommand(
      { x: this.robot.x, y: this.robot.y },
      this.robot.rotation,
      { x: targetX, y: targetY },
      speedPercentage
    );
    if (command) {
      this._setAction(command.type, command.payload);
    }
  };

  sequence = (actions) => {
    this.robot.nextActions.push(...actions);
    this.robot.nextActions.push({ type: "END_SEQUENCE" });
  };

  // --- Azioni Sincrone ---
  fire = () => this._setAction("FIRE");

  // --- Azioni di scansione/percezione ---
  scan = () => this.robot.lastScanResult;
  scanObstacles = () => this.robot.lastObstaclesScan;

  // --- Informazioni sull'arena ---
  getArenaDimensions = () => this.gameState.arena;

  // --- Informazioni sullo stato del proprio robot ---
  getState = () => ({
    x: this.robot.x,
    y: this.robot.y,
    rotation: this.robot.rotation,
    hp: this.robot.hullHp + this.robot.armor.hp,
    energy: this.robot.battery.energy,
  });

  getBatteryState = () => ({
    energy: this.robot.battery.energy,
    maxEnergy: this.robot.battery.maxEnergy,
  });

  getArmorState = () => ({
    hp: this.robot.armor.hp,
    maxHp: this.robot.armor.maxHp,
  });

  getHullState = () => ({ hp: this.robot.hullHp, maxHp: this.robot.maxHullHp });

  isQueueEmpty = () => this.robot.commandQueue.length === 0;

  isLineOfSightClear = (targetPosition) =>
    checkLineOfSight(
      { x: this.robot.x, y: this.robot.y },
      targetPosition,
      this.robot.cannon.projectileRadius,
      this.gameState.arena.obstacles
    );

  isPositionValid = (position) =>
    isPositionWalkable(position, Robot.RADIUS, this.gameState.arena);

  // --- Eventi ---
  getEvents = () => {
    return this.gameState.events.filter((e) => {
      switch (e.type) {
        case "HIT_BY_PROJECTILE":
          return e.robotId === this.robot.id;
        case "ENEMY_HIT":
        case "PROJECTILE_HIT_WALL":
        case "PROJECTILE_HIT_OBSTACLE":
          return e.ownerId === this.robot.id;
        case "MOVE_COMPLETED":
        case "ROTATION_COMPLETED":
        case "ACTION_STOPPED":
        case "ENEMY_DETECTED":
        case "SEQUENCE_COMPLETED":
          return e.robotId === this.robot.id;
        default:
          return false;
      }
    });
  };

  isObstacleAhead = (probeDistance = 30) =>
    checkForObstacleAhead(this.robot, this.gameState.arena, probeDistance);
}

export default RobotAPI;
