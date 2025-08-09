import Arena from "./Arena.js";
import Robot from "./Robot.js";
import Projectile from "./Projectile.js";
import { updateProjectiles } from "./systems/projectileSystem.js";
import {
  processActiveCommands,
  isCommandEquivalent,
} from "./systems/commandSystem.js";
import { executeNextActions } from "./systems/actionSystem.js";
import { updateRobotStates } from "./systems/robotStateSystem.js";
import { setupGame } from "./gameSetup.js";
import StatsTracker from "./StatsTracker.js";
import { scanForEnemy, scanForObstacles } from "./systems/perceptionSystem.js";

/**
 * @typedef {Object} GameState
 * @property {Object} arena - Le dimensioni e gli ostacoli dell'arena.
 * @property {number} arena.width
 * @property {number} arena.height
 * @property {Array<import('./Arena.js').Obstacle>} arena.obstacles
 * @property {Array<import('./Robot.js').RobotState>} robots
 * @property {Array<Object>} projectiles - Gli oggetti proiettile nell'arena.
 * @property {string} status - 'idle', 'running', 'paused', 'finished'
 * @property {Array<Object>} events - La coda di eventi del tick precedente. Esempi di eventi:
 * - `{type: 'ENEMY_DETECTED', robotId: string, target: Object}`
 * - `{type: 'HIT_BY_PROJECTILE', robotId: string, ownerId: string, damage: number}`
 * - `{type: 'ENEMY_HIT', ownerId: string, targetId: string, damage: number}` - `{type: 'PROJECTILE_HIT_WALL', ...}` - `{type: 'PROJECTILE_HIT_OBSTACLE', ...}`
 * - `{type: 'MOVE_COMPLETED', robotId: string}`
 * - `{type: 'ROTATION_COMPLETED', robotId: string}`
 * - `{type: 'ACTION_STOPPED', robotId: string, commandType: 'MOVE'|'ROTATE', reason: 'USER_COMMAND'|'COLLISION'|'NO_ENERGY'}`
 * - `{type: 'SEQUENCE_COMPLETED', robotId: string}`
 * @property {?string} winner - L'ID del robot vincitore
 */

/**
 * Gestisce la logica principale del gioco, il game loop e lo stato.
 */
class Game {
  /**
   * @param {Object} playerAI - L'IA fornita dal giocatore.
   * @param {Object} defaultAI - L'IA di default per l'avversario.
   */
  constructor(playerAI, defaultAI) {
    this.playerAI = playerAI;
    this.defaultAI = defaultAI;
    this.projectileCounter = 0;
    this.statsTracker = new StatsTracker();

    /** @type {Array<Object>} */
    this.events = [];
    /** @type {Array<Object>} */
    this.lastTickEvents = [];
    /**
     * Tracks which robots have detected each other to fire ENEMY_DETECTED once.
     * Key is the robot ID, value is a Set of detected enemy IDs.
     * @type {Object<string, Set<string>>}
     */
    this.detectionState = {};

    // Timer state
    this.startTime = null;
    this.elapsedTime = 0;
    this.reset();
  }

  /**
   * Resetta lo stato del gioco alla configurazione iniziale.
   */
  reset() {
    this.events = [];
    this.lastTickEvents = [];
    this.projectileCounter = 0;
    this.statsTracker.reset();
    this.detectionState = {
      player: new Set(),
      opponent: new Set(),
    };

    this.startTime = null;
    this.elapsedTime = 0;

    const { arena, robots } = setupGame(this.playerAI, this.defaultAI);

    /** @type {Arena} */
    this.arena = arena;
    /** @type {Array<Robot>} */
    this.robots = robots;

    /** @type {Array<Projectile>} */
    this.projectiles = [];

    /** @type {'idle' | 'running' | 'paused' | 'finished'} */
    this.status = "idle";
    /** @type {?string} */
    this.winner = null;
  }

  /**
   * Esegue un singolo "tick" o frame della simulazione.
   */
  tick() {
    if (this.status !== "running") {
      return;
    }

    // 1. Aggiorna stati passivi (cooldown, energia).
    updateRobotStates(this.robots);

    // 2. Processa i comandi asincroni (movimento/rotazione) che continuano dall'ultimo tick.
    // Questa funzione restituisce gli eventi generati (es. MOVE_COMPLETED).
    const { newEvents: commandEvents } = processActiveCommands(this.robots, this.arena);

    // 3. Prepara lo stato del gioco per il nuovo ciclo di decisioni dell'IA.
    // L'IA deve vedere gli eventi del tick PRECEDENTE, quindi `getGameState` usa `this.lastTickEvents`.
    const gameState = this.getGameState();

    // 4. Azzera la coda degli eventi per il tick CORRENTE.
    this.events = [];

    // 5. Esegui la percezione per ogni robot e genera eventi di rilevamento.
    // Questo viene fatto centralmente per garantire coerenza.
    this.robots.forEach((robot) => {
      // L'API `scan` del robot ora restituisce semplicemente questo risultato.
      robot.lastScanResult = scanForEnemy(robot, this.robots.map(r => r.getState()));
      // Eseguiamo anche la scansione degli ostacoli
      robot.lastObstaclesScan = scanForObstacles(robot, this.arena.obstacles);

      const enemyId = this.robots.find(r => r.id !== robot.id)?.id;

      if (robot.lastScanResult && enemyId) {
        if (!this.detectionState[robot.id].has(enemyId)) {
          this.detectionState[robot.id].add(enemyId);
          this.events.push({
            type: "ENEMY_DETECTED",
            robotId: robot.id,
            target: robot.lastScanResult,
          });
        }
      }
      else if (enemyId) {
        // Se il nemico non è più visibile, resetta lo stato di rilevamento.
        this.detectionState[robot.id].delete(enemyId);
      }
    });

    // 6. Aggiungi gli eventi generati dai comandi asincroni alla nuova coda.
    this.events.push(...commandEvents);

    // 7. Ogni robot decide la sua prossima mossa in base allo stato aggiornato.
    this.robots.forEach((robot) => robot.computeNextAction(gameState));

    // 8. Esegui le azioni sincrone (es. fuoco) e avvia nuovi comandi asincroni.
    const {
      newProjectiles,
      newEvents: actionEvents,
      updatedProjectileCounter,
    } = executeNextActions(
      this.robots,
      this.projectileCounter,
      (robot, action) => {
        // Logica custom per il nuovo comando AIM_AT_CONTINUOUS
        if (action.type === "AIM_AT_CONTINUOUS") {
          // Converte l'azione 'AIM_AT_CONTINUOUS' in un comando 'ROTATE' completo,
          // replicando la logica che si trova in actionSystem.js per START_ROTATE.
          const { angle, speedPercentage } = action.payload;
          const clampedPercentage = Math.max(-100, Math.min(speedPercentage, 100));
          const rotationSpeed =
            robot.motor.maxRotationSpeed *
            (clampedPercentage / 100) *
            Math.sign(angle);

          const newCommand = {
            type: "ROTATE",
            rotationSpeed: rotationSpeed,
            remainingAngle: Math.abs(angle),
          };

          const activeCommand = robot.commandQueue[0];

          // Se il comando attivo non è già la stessa rotazione, interrompi e avvia la nuova.
          if (!activeCommand || !isCommandEquivalent(activeCommand, newCommand)) {
            robot.commandQueue = [newCommand];
          }
          return { handled: true }; // Indica che l'azione è stata gestita qui.
        }
        return { handled: false }; // Lascia che la gestione di default proceda.
      }
    );

    // Traccia i colpi sparati
    newProjectiles.forEach(p => {
      this.statsTracker.trackShotFired(p.ownerId);
    });

    this.projectiles.push(...newProjectiles);
    this.events.push(...actionEvents);
    this.projectileCounter = updatedProjectileCounter;

    // 9. Aggiorna i proiettili e gestisce le collisioni.
    const { remainingProjectiles, newEvents: projectileEvents } = updateProjectiles(
      this.projectiles,
      this.robots,
      this.arena
    );
    this.projectiles = remainingProjectiles;
    this.events.push(...projectileEvents);

    // Traccia i colpi a segno e il danno
    projectileEvents.forEach(event => {
      if (event.type === 'ENEMY_HIT') {
        this.statsTracker.trackHit(event.ownerId, event.damage);
        this.statsTracker.trackDamageTaken(event.targetId, event.damage);
      }
    });

    // 10. Controlla le condizioni di fine partita.
    const aliveRobots = this.robots.filter((r) => r.hullHp > 0);
    if (aliveRobots.length <= 1) {
      // Finalizza il timer prima di interrompere lo stato.
      if (this.status === "running" && this.startTime) {
        this.elapsedTime += Date.now() - this.startTime;
        this.startTime = null;
      }
      this.status = "finished";
      this.winner = aliveRobots.length === 1 ? aliveRobots[0].id : null;
      this.lastTickEvents = this.events; // Salva gli eventi finali
      return;
    }

    // 11. Alla fine del tick, gli eventi generati diventano gli eventi del "tick precedente" per il frame successivo.
    this.lastTickEvents = this.events;
  }

  /**
   * Avvia la simulazione.
   */
  start() {
    if (this.status === "idle") {
      this.status = "running";
      this.startTime = Date.now();
      this.elapsedTime = 0;
    }
  }

  /**
   * Mette in pausa la simulazione.
   */
  pause() {
    if (this.status === "running") {
      this.status = "paused";
      this.elapsedTime += Date.now() - this.startTime;
      this.startTime = null;
    }
  }

  /**
   * Riprende la simulazione.
   */
  resume() {
    if (this.status === "paused") {
      this.status = "running";
      this.startTime = Date.now();
    }
  }

  /**
   * Restituisce lo stato attuale del gioco, da passare alla UI per il rendering.
   * @returns {GameState}
   */
  getGameState() {
    let currentElapsedTime = this.elapsedTime;
    if (this.status === "running" && this.startTime) {
      currentElapsedTime += Date.now() - this.startTime;
    }

    return {
      arena: {
        width: this.arena.width,
        height: this.arena.height,
        obstacles: this.arena.obstacles,
      },
      robots: this.robots.map((robot) => robot.getState()),
      projectiles: this.projectiles.map((p) => p.getState()),
      status: this.status,
      events: this.lastTickEvents, // L'IA vede gli eventi del tick precedente
      elapsedTime: currentElapsedTime,
      winner: this.winner,
      stats: this.statsTracker.getStats(),
    };
  }
}

export default Game;
