import {
  scanForEnemy,
  checkLineOfSight,
  scanForObstacles,
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
 * @typedef {Object} RobotState
 * @property {string} id
 * @property {number} x - Posizione X
 * @property {number} y - Posizione Y
 * @property {number} rotation - Angolo in gradi
 * @property {number} hullHp - Punti vita dello scafo
 * @property {number} armorHp - Punti vita dell'armatura
 * @property {number} energy - Energia della batteria
 * @property {number} totalWeight - Peso totale
 * @property {boolean} isOverweight - Se il robot è in sovrappeso
 */

/**
 * Rappresenta un singolo robot nell'arena.
 * La sua funzionalità è determinata dai componenti che lo equipaggiano.
 */
class Robot {
  // Definiamo il raggio come una costante statica della classe.
  // In questo modo è centralizzato e facile da modificare.
  static RADIUS = 15;
  /**
   * @param {Object} options - Opzioni di configurazione del robot.
   * @param {string} options.id - Identificatore univoco.
   * @param {number} options.x - Posizione iniziale X.
   * @param {number} options.y - Posizione iniziale Y.
   * @param {Object} options.ai - L'intelligenza artificiale che controlla il robot.
   * @param {Object} options.armor - Componente armatura.
   * @param {Object} options.cannon - Componente cannone.
   * @param {Object} options.battery - Componente batteria.
   * @param {Object} options.motor - Componente motore.
   * @param {Object} options.radar - Componente radar.
   */
  constructor({
    id,
    x,
    y,
    ai,
    rotation,
    armor,
    cannon,
    battery,
    motor,
    radar,
  }) {
    /** @type {string} */
    this.id = id;
    /** @type {number} */
    this.x = x;
    /** @type {number} */
    this.y = y;
    /** @type {number} */
    this.rotation =
      typeof rotation === "number" ? rotation : Math.random() * 360; // Usa il valore passato, altrimenti casuale

    // Componenti
    this.armor = armor;
    this.cannon = cannon;
    this.battery = battery;
    this.motor = motor;
    this.radar = radar;

    /**
     * The destination of the current move command, if any.
     * @type {{x: number, y: number} | null}
     */
    this.destination = null;

    /**
     * The visual path for the current move command.
     * @type {Array<{x: number, y: number}> | null}
     */
    this.path = null;

    // Stato derivato dai componenti
    this.maxHullHp = 100; // La vita dello "scafo" è fissa
    this.hullHp = this.maxHullHp;
    this.armor.hp = this.armor.maxHp; // Inizializza l'armatura al massimo
    this.battery.energy = this.battery.maxEnergy; // Inizializza l'energia al massimo

    // Calcolo del peso
    this.totalWeight =
      armor.weight +
      cannon.weight +
      battery.weight +
      motor.weight +
      radar.weight;
    this.isOverweight = this.totalWeight > this.motor.maxWeight;

    /** @type {Object} */
    this.ai = ai;
    /** @type {number} */
    this.cannonCooldown = 0;

    /**
     * Le azioni che il robot intende eseguire nel prossimo tick.
     * @type {Array<{type: string, payload: any}>}
     * @private
     */
    this.nextActions = [];

    /**
     * A queue of commands to be executed by the robot. The first command in the queue
     * is the active one.
     * @type {Array<Object>}
     */
    this.commandQueue = [];

    /**
     * The result of the last obstacle scan.
     * @type {Array<Object>}
     */
    this.lastObstaclesScan = [];

    /**
     * A list of log entries created by the AI.
     * @type {Array<string>}
     */
    this.logs = [];
  }

  /**
   * Applica una quantità di danno al robot.
   * Il danno viene prima assorbito dall'armatura, poi dallo scafo.
   * @param {number} amount - La quantità di danno da infliggere.
   */
  takeDamage(amount) {
    const damageToArmor = Math.min(this.armor.hp, amount);
    this.armor.hp -= damageToArmor;

    const remainingDamage = amount - damageToArmor;
    if (remainingDamage > 0) {
      this.hullHp -= remainingDamage;
    }
  }

  /**
   * Consuma energia dalla batteria per un'azione.
   * Applica una penalità al consumo se il robot è in sovrappeso.
   * @param {number} amount - La quantità di energia da consumare.
   * @returns {boolean} - True se l'energia è stata consumata, false altrimenti.
   */
  consumeEnergy(amount) {
    const cost = this.isOverweight ? amount * 1.5 : amount; // Penalità del 50%
    if (this.battery.energy >= cost) {
      this.battery.energy -= cost;
      return true;
    }
    return false;
  }

  /**
   * Fornisce un'API sicura che l'IA può utilizzare per interagire con il mondo.
   * Queste funzioni non modificano direttamente lo stato, ma impostano l'azione per il prossimo tick.
   * @param {import('./Game.js').GameState} gameState - Lo stato attuale del gioco.
   * @returns {Object} L'API per l'IA.
   */
  getApi(gameState) {
    const setAction = (type, payload = {}) => {
      // Aggiunge un'azione alla coda delle azioni da eseguire in questo tick.
      this.nextActions.push({ type, payload });
    };

    /**
     * Restituisce la lista di eventi significativi accaduti nell'ultimo tick
     * che coinvolgono questo robot (es. essere colpiti, colpire un bersaglio).
     * @returns {Array<Object>}
     */
    const getEvents = () => {
      // Filtra gli eventi per restituire solo quelli che riguardano questo robot.
      return gameState.events.filter((e) => {
        switch (e.type) {
          // Evento per il robot che viene colpito
          case "HIT_BY_PROJECTILE":
            return e.robotId === this.id;

          // Eventi per il robot che ha sparato
          case "ENEMY_HIT":
          case "PROJECTILE_HIT_WALL":
          case "PROJECTILE_HIT_OBSTACLE":
            return e.ownerId === this.id;

          // Eventi generici del robot (movimento, rilevamento, etc.)
          case "MOVE_COMPLETED":
          case "ROTATION_COMPLETED":
          case "ACTION_STOPPED":
          case "ENEMY_DETECTED":
          case "SEQUENCE_COMPLETED":
            return e.robotId === this.id;

          // Evento non specifico, non dovrebbe accadere ma lo gestiamo
          default:
            return false;
        }
      });
    };

    return {
      // --- Azioni di Debug ---
      log: (...args) => {
        const message = args
          .map((arg) => {
            if (typeof arg === "object" && arg !== null) {
              return JSON.stringify(arg);
            }
            return String(arg);
          })
          .join(" ");
        this.logs.push(message);
        // Limita la dimensione dell'array di log per evitare problemi di memoria
        if (this.logs.length > 100) {
          this.logs.shift();
        }
      },
      // --- Azioni Asincrone ---
      move: (distance, speedPercentage = 100) => {
        const angleRad = this.rotation * (Math.PI / 180);
        const destX = this.x + distance * Math.cos(angleRad);
        const destY = this.y + distance * Math.sin(angleRad);
        this.destination = { x: destX, y: destY };
        this.path = [{ x: this.x, y: this.y }, { x: destX, y: destY }];
        setAction("START_MOVE", { distance, speedPercentage });
      },

      moveTo: (targetX, targetY, speedPercentage = 100) => {
        // Imposta la destinazione finale per il rendering del marcatore
        this.destination = { x: targetX, y: targetY };
        this.path = null; // Resetta il percorso prima di calcolarne uno nuovo

        const cellSize = Robot.RADIUS * 2;
        const grid = createNavigationGrid(gameState.arena, Robot.RADIUS);

        const startCoords = {
          x: Math.floor(this.x / cellSize),
          y: Math.floor(this.y / cellSize),
        };
        const endCoords = {
          x: Math.floor(targetX / cellSize),
          y: Math.floor(targetY / cellSize),
        };

        const path = findPath(grid, startCoords, endCoords);

        if (path && path.length > 1) {
          // Memorizza il percorso visivo in coordinate del mondo
          const worldPath = path.map((node) => ({
            x: node.x * cellSize + cellSize / 2,
            y: node.y * cellSize + cellSize / 2,
          }));
          // Aggiunge la posizione di partenza del bot per un tracciato completo
          worldPath.unshift({ x: this.x, y: this.y });
          this.path = worldPath;

          path.shift(); // Rimuove il nodo di partenza
          const actions = generateCommandsForPath(
            path,
            { x: this.x, y: this.y },
            this.rotation,
            cellSize,
            speedPercentage
          );
          // moveTo ora si comporta come una sequenza, aggiungendo il marcatore alla fine.
          this.nextActions.push(...actions, { type: "END_SEQUENCE" });
        }
      },

      rotate: (angle, speedPercentage = 100) =>
        setAction("START_ROTATE", { angle, speedPercentage }),

      stop: () => {
        this.destination = null;
        this.path = null;
        // Stop ha la priorità e cancella le altre azioni pianificate per questo tick.
        this.nextActions = [{ type: "STOP_ACTION" }]; // Cancella le altre azioni del tick
      },

      aimAt: (targetX, targetY, speedPercentage = 100) => {
        const command = generateAimCommand(
          { x: this.x, y: this.y },
          this.rotation,
          { x: targetX, y: targetY },
          speedPercentage
        );
        if (command) {
          setAction(command.type, command.payload);
        }
      },

      sequence: (actions) => {
        // Accoda le azioni e il marcatore di fine sequenza.
        this.nextActions.push(...actions);
        this.nextActions.push({ type: "END_SEQUENCE" });
      },

      // --- Azioni Sincrone ---
      // Azioni di combattimento
      fire: () => setAction("FIRE"),

      // Azioni di scansione/percezione
      scan: () => this.lastScanResult,

      scanObstacles: () => this.lastObstaclesScan,

      // Informazioni sull'arena
      getArenaDimensions: () => gameState.arena,

      // Informazioni sullo stato del proprio robot
      getState: () => ({
        x: this.x,
        y: this.y,
        rotation: this.rotation,
        hp: this.hullHp + this.armor.hp, // L'IA vede la vita totale
        energy: this.battery.energy,
      }),

      /**
       * Restituisce lo stato attuale della batteria.
       * @returns {{energy: number, maxEnergy: number}}
       */
      getBatteryState: () => ({
        energy: this.battery.energy,
        maxEnergy: this.battery.maxEnergy,
      }),

      /**
       * Restituisce lo stato attuale dell'armatura.
       * @returns {{hp: number, maxHp: number}}
       */
      getArmorState: () => ({
        hp: this.armor.hp,
        maxHp: this.armor.maxHp,
      }),

      /**
       * Restituisce lo stato attuale dello scafo.
       * @returns {{hp: number, maxHp: number}}
       */
      getHullState: () => ({ hp: this.hullHp, maxHp: this.maxHullHp }),

      isQueueEmpty: () => this.commandQueue.length === 0,

      isLineOfSightClear: (targetPosition) =>
        checkLineOfSight(
          { x: this.x, y: this.y },
          targetPosition,
          this.cannon.projectileRadius,
          gameState.arena.obstacles
        ),

      isPositionValid: (position) =>
        isPositionWalkable(position, Robot.RADIUS, gameState.arena),

      // Eventi
      getEvents,

      isObstacleAhead: (probeDistance = 30) =>
        checkForObstacleAhead(this, gameState.arena, probeDistance),
    };
  }

  /**
   * Esegue il codice dell'IA per determinare l'azione successiva.
   * @param {import('./Game.js').GameState} gameState
   */
  computeNextAction(gameState) {
    // Se la coda di comandi è vuota, significa che abbiamo raggiunto la destinazione
    // o siamo stati fermati. In ogni caso, il marcatore di destinazione non è più necessario.
    if (this.commandQueue.length === 0) {
      this.destination = null;
      this.path = null;
    }

    this.nextActions = []; // Resetta le azioni per il tick corrente
    // L'IA viene eseguita ad ogni tick, anche se un comando asincrono è attivo.
    // Questo le permette di reagire a eventi (es. essere colpiti) e, se necessario,
    // inviare un comando `stop()` o pianificare la mossa successiva.
    this.ai.run(this.getApi(gameState));
  }

  /**
   * Restituisce lo stato pubblico del robot.
   * @returns {RobotState}
   */
  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      hullHp: this.hullHp,
      maxHullHp: this.maxHullHp,
      armorHp: this.armor.hp,
      maxArmorHp: this.armor.maxHp,
      energy: this.battery.energy,
      maxEnergy: this.battery.maxEnergy,
      totalWeight: this.totalWeight,
      isOverweight: this.isOverweight,
      radarRange: this.radar.range,
      logs: this.logs,
      destination: this.destination,
      path: this.path,
    };
  }
}

export default Robot;
