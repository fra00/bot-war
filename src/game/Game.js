import Arena from "./Arena.js";
import Robot from "./Robot.js";
import Projectile from "./Projectile.js";
import * as components from "./components.js";
import { circleIntersectsRectangle } from "./geometryHelpers/index.js";

/**
 * @typedef {Object} GameState
 * @property {import('./Arena.js').Dimensions} arena
 * @property {Array<import('./Robot.js').RobotState>} robots
 * @property {Array<Object>} projectiles
 * @property {string} status - 'idle', 'running', 'finished'
 * @property {Array<Object>} events - La coda di eventi del tick corrente
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

    /** @type {Array<Object>} */
    this.events = [];
    /** @type {Array<Object>} */
    this.lastTickEvents = [];
    this.reset();
  }

  /**
   * Resetta lo stato del gioco alla configurazione iniziale.
   */
  reset() {
    /** @type {Arena} */
    this.events = [];
    this.lastTickEvents = [];
    this.arena = new Arena(800, 600);

    // Definisce i punti di partenza dei robot per usarli come zone sicure
    const spawnPoints = [
      { x: 100, y: 300 },
      { x: 700, y: 300 },
    ];

    // Genera ostacoli casuali, evitando le zone di partenza
    this.arena.generateObstacles(5, spawnPoints);

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

    /** @type {Array<Robot>} */
    this.robots = [
      new Robot({ id: "player", x: spawnPoints[0].x, y: spawnPoints[0].y, ai: this.playerAI, ...playerLoadout }),
      new Robot({
        id: "opponent",
        x: spawnPoints[1].x,
        y: spawnPoints[1].y,
        ai: this.defaultAI,
        ...opponentLoadout,
      }),
    ];

    /** @type {Array<Projectile>} */
    this.projectiles = [];

    /** @type {'idle' | 'running' | 'finished'} */
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

    // L'IA deve vedere lo stato del gioco che include gli eventi del tick precedente.
    const gameState = this.getGameState();

    // Ora che lo stato è stato catturato per le IA, possiamo preparare la coda per gli eventi di questo tick.
    this.events = [];
    // 1. Ogni robot decide la sua prossima mossa
    this.robots.forEach((robot) => robot.computeNextAction(gameState));

    // 2. Esegui le azioni
    this.robots.forEach((robot) => {
      const action = robot.nextAction;
      if (!action) return;

      switch (action.type) {
        case "MOVE_FORWARD": {
          // La velocità è ora una percentuale della velocità massima del motore.
          const requestedPercentage = action.payload.percentage || 0;
          // Limita la percentuale tra -100 e 100
          const clampedPercentage = Math.max(
            -100,
            Math.min(requestedPercentage, 100)
          );
          const effectiveSpeed =
            robot.motor.maxSpeed * (clampedPercentage / 100);

          // Applica la penalità di velocità per il sovrappeso
          const finalSpeed = robot.isOverweight ? effectiveSpeed * 0.5 : effectiveSpeed;

          // Consuma energia per il movimento
          const energyCost = Math.abs(finalSpeed) * robot.motor.energyCostPerMove;
          if (!robot.consumeEnergy(energyCost)) {
            break; // Energia insufficiente
          }

          const angleRad = robot.rotation * (Math.PI / 180);
          const newX = robot.x + finalSpeed * Math.cos(angleRad);
          const newY = robot.y + finalSpeed * Math.sin(angleRad);
          // Passa il raggio del robot per una collisione più accurata
          if (this.arena.isPositionValid({ x: newX, y: newY }, Robot.RADIUS)) {
            robot.x = newX;
            robot.y = newY;
          }
          break;
        }
        case "TURN_LEFT": {
          if (!robot.consumeEnergy(0.1)) break; // Anche la rotazione consuma energia
          robot.rotation =
            (robot.rotation - action.payload.degrees + 360) % 360;
          break;
        }
        case "TURN_RIGHT": {
          if (!robot.consumeEnergy(0.1)) break;
          robot.rotation = (robot.rotation + action.payload.degrees) % 360;
          break;
        }
        case "FIRE": {
          if (robot.cannonCooldown > 0) break; // Controlla il cooldown

          // Consuma energia in base al cannone
          if (robot.consumeEnergy(robot.cannon.energyCost)) {
            // Imposta il cooldown in base alla cadenza di tiro del cannone
            robot.cannonCooldown = robot.cannon.fireRate;

            const projectileId = `proj-${this.projectileCounter++}`;
            const projectile = new Projectile({
              id: projectileId,
              ownerId: robot.id,
              x: robot.x,
              y: robot.y,
              rotation: robot.rotation,
              damage: robot.cannon.damage, // Passa il danno dal cannone
              maxRange: robot.cannon.range, // Passa la portata dal cannone
            });
            this.projectiles.push(projectile);
          }
          break;
        }
      }
    });

    // 3. Aggiorna i proiettili e gestisce le collisioni.
    // La logica è stata estratta in un metodo helper per pulizia.
    this.projectiles = this._updateProjectiles();

    // 4. Ricarica energia e controlla la fine della partita
    this.robots.forEach((robot) => {
      // Usa il tasso di ricarica della batteria
      if (robot.battery.energy < robot.battery.maxEnergy) {
        robot.battery.energy += robot.battery.rechargeRate;
        if (robot.battery.energy > robot.battery.maxEnergy) {
          robot.battery.energy = robot.battery.maxEnergy;
        }
      }
    });

    const aliveRobots = this.robots.filter((r) => r.hullHp > 0);
    if (aliveRobots.length <= 1) {
      this.status = "finished";
      this.winner = aliveRobots.length === 1 ? aliveRobots[0].id : null;
    }

    // Alla fine del tick, gli eventi generati diventano gli eventi del "tick precedente" per il frame successivo.
    this.lastTickEvents = this.events;
  }

  /**
   * Avvia la simulazione.
   */
  start() {
    if (this.status === "idle") {
      this.status = "running";
    }
  }

  /**
   * Restituisce lo stato attuale del gioco, da passare alla UI per il rendering.
   * @returns {GameState}
   */
  getGameState() {
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
      winner: this.winner,
    };
  }

  /**
   * Aggiorna tutti i proiettili, controlla le collisioni e genera eventi.
   * @private
   * @returns {Array<Projectile>} La lista dei proiettili ancora attivi.
   */
  _updateProjectiles() {
    const remainingProjectiles = [];
    for (const projectile of this.projectiles) {
      projectile.update();

      let shouldBeRemoved = false;

      // Controlla se il proiettile colpisce un muro
      if (
        !this.arena.isPositionValid(
          { x: projectile.x, y: projectile.y },
          Projectile.RADIUS
        )
      ) {
        this.events.push({
          type: "PROJECTILE_HIT_WALL",
          projectileId: projectile.id,
          ownerId: projectile.ownerId,
          position: { x: projectile.x, y: projectile.y },
        });
        shouldBeRemoved = true;
      }

      // Controlla se il proiettile ha esaurito la sua portata
      if (!shouldBeRemoved && projectile.distanceTraveled > projectile.maxRange) {
        shouldBeRemoved = true;
      }

      // Controlla collisioni con gli ostacoli
      if (!shouldBeRemoved) {
        for (const obstacle of this.arena.obstacles) {
          if (
            circleIntersectsRectangle(
              { x: projectile.x, y: projectile.y, radius: Projectile.RADIUS },
              obstacle
            )
          ) {
            this.events.push({
              type: "PROJECTILE_HIT_OBSTACLE",
              projectileId: projectile.id,
              ownerId: projectile.ownerId,
              obstacleId: obstacle.id,
            });
            shouldBeRemoved = true;
            break; // Un proiettile colpisce un solo ostacolo
          }
        }
      }

      // Controlla collisioni con i robot nemici
      if (!shouldBeRemoved) {
        for (const robot of this.robots) {
          if (robot.id !== projectile.ownerId && projectile.checkCollision(robot)) {
            robot.takeDamage(projectile.damage); // Usa il danno del proiettile
            this.events.push({ type: "PROJECTILE_HIT_ROBOT", projectileId: projectile.id, ownerId: projectile.ownerId, targetId: robot.id, damage: projectile.damage });
            shouldBeRemoved = true;
            break; // Un proiettile colpisce un solo robot e poi sparisce
          }
        }
      }

      if (!shouldBeRemoved) {
        remainingProjectiles.push(projectile);
      }
    }
    return remainingProjectiles;
  }
}

export default Game;
