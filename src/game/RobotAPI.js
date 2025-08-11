import Robot from "./Robot.js";
import {
  checkLineOfSight,
  isPositionWalkable,
  checkForObstacleAhead,
} from "./systems/perceptionSystem.js"; 
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

  /**
   * Calcola e avvia un percorso verso una destinazione, evitando gli ostacoli.
   * @returns {boolean} True se un percorso è stato trovato e avviato, altrimenti false.
   */
  moveTo = (targetX, targetY, speedPercentage = 100) => {
    this.robot.destination = { x: targetX, y: targetY };
    this.robot.path = null;

    const cellSize = Robot.RADIUS * 2;
    const grid = this.gameState.arena.navigationGrid;
    
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
      return true;
    } else {
      this.log(`Impossibile trovare un percorso valido per (${targetX}, ${targetY}).`);
      this.robot.destination = null; // Pulisce il marcatore di destinazione in caso di fallimento
      this.robot.path = null; // Pulisce il percorso visuale in caso di fallimento
      return false;
    }
  };

  rotate = (angle, speedPercentage = 100) =>
    this._setAction("START_ROTATE", { angle, speedPercentage });

  stop = (source = "AI_REQUEST") => {
    this.robot.destination = null;
    this.robot.path = null;
    // Passiamo la 'source' nel payload per poterla usare nell'evento
    this.robot.nextActions = [{ type: "STOP_ACTION", payload: { source } }];
  };

  /**
   * Un comando "continuo" per mirare a una destinazione. Se chiamato ripetutamente,
   * il bot continuerà a correggere la sua mira verso il bersaglio.
   * Interrompe altre azioni di movimento/rotazione per dare priorità alla mira.
   */
  aimAt = (targetX, targetY, speedPercentage = 100) => {
    const aimCommand = generateAimCommand(
      { x: this.robot.x, y: this.robot.y },
      this.robot.rotation,
      { x: targetX, y: targetY },
      speedPercentage
    );

    // Se non c'è bisogno di ruotare, non fare nulla.
    if (!aimCommand) return;

    // Rende il comando idempotente. Se il bot non sta già eseguendo questa esatta rotazione,
    // la avvia, interrompendo qualsiasi altra azione di movimento/rotazione.
    // Questo semplifica enormemente la logica dell'IA.
    this._setAction("AIM_AT_CONTINUOUS", aimCommand.payload);
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

  isPositionValid = (position) => {
    // Ora passiamo anche lo stato di tutti i robot e l'ID del nostro bot
    // per un controllo delle collisioni completo.
    const allRobotStates = this.gameState.robots;
    const selfId = this.robot.id;
    return isPositionWalkable(position, Robot.RADIUS, this.gameState.arena, allRobotStates, selfId);
  }

  // --- Memoria Persistente ---

  /**
   * Restituisce l'oggetto di memoria persistente del robot.
   * Le modifiche a questo oggetto verranno mantenute tra i tick.
   * @returns {Object}
   */
  getMemory = () => this.robot.memory;

  /**
   * Aggiorna o aggiunge proprietà all'oggetto di memoria del robot.
   * Esegue un merge superficiale delle nuove proprietà nell'oggetto esistente.
   * @param {Object} propertiesToUpdate - Le nuove proprietà da impostare o aggiornare.
   * @returns {Object} Il nuovo oggetto di memoria aggiornato.
   */
  updateMemory = (propertiesToUpdate) => {
    // La precedente implementazione con lo spread operator `{ ... }` creava un *nuovo* oggetto di memoria ad ogni chiamata.
    // Questo invalidava la variabile `memory` locale in `DefaultAIBase.js`, che continuava a puntare
    // alla vecchia versione dell'oggetto, portando a leggere dati non aggiornati.
    // this.robot.memory = { ...this.robot.memory, ...propertiesToUpdate };

    // La nuova implementazione con `Object.assign` *modifica* l'oggetto di memoria esistente.
    // In questo modo, la variabile `memory` in `DefaultAIBase.js` mantiene un riferimento
    // sempre valido e aggiornato per tutto il tick.
    Object.assign(this.robot.memory, propertiesToUpdate);
    return this.robot.memory;
  };
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
