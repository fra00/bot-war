import {
  projectileIntersectsObstacle,
  circleIntersectsRectangle,
  isPointInRect,
} from "./geometryHelpers/index.js";

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

    // Stato derivato dai componenti
    this.hullHp = 100; // La vita dello "scafo" è fissa
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
     * L'azione che il robot intende eseguire nel prossimo tick.
     * @type {?{type: string, payload: any}}
     * @private
     */
    this.nextAction = null;
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
      if (!this.nextAction) {
        // Permette una sola azione per tick
        this.nextAction = { type, payload };
      }
    };

    // Ora la funzione isLineOfSightClear è basata sulla logica del proiettile con raggio
    /**
     * Verifica se la linea di tiro tra due punti è libera da ostacoli,
     * tenendo conto del raggio del proiettile.
     * @param {{x: number, y: number}} startPoint - Il punto di partenza del proiettile.
     * @param {{x: number, y: number}} endPoint - Il punto di arrivo del proiettile.
     * @param {number} projectileRadius - Il raggio del proiettile.
     * @returns {boolean} - True se la linea di tiro è libera, false altrimenti.
     */
    const isLineOfSightClear = (startPoint, endPoint, projectileRadius) => {
      const { width, height, obstacles } = gameState.arena;

      // 2. Controlla gli ostacoli interni (logica esistente)
      for (const obstacle of obstacles) {
        if (
          projectileIntersectsObstacle(
            startPoint,
            endPoint,
            projectileRadius,
            obstacle
          )
        ) {
          return false; // Ostacolo rilevato
        }
      }
      return true; // Nessun ostacolo sul percorso
    };

    /**
     * Restituisce la lista di eventi significativi accaduti nell'ultimo tick
     * che coinvolgono questo robot (es. essere colpiti, colpire un bersaglio).
     * @returns {Array<Object>}
     */
    const getEvents = () => {
      // Filtra gli eventi per restituire solo quelli che riguardano questo robot.
      return gameState.events.filter(
        (e) => e.ownerId === this.id || e.targetId === this.id
      );
    };

    return {
      // Azioni di movimento
      moveForward: (speed = 1) => setAction("MOVE_FORWARD", { speed }),
      turnLeft: (degrees = 5) => setAction("TURN_LEFT", { degrees }),
      turnRight: (degrees = 5) => setAction("TURN_RIGHT", { degrees }),

      // Azioni di combattimento
      fire: () => setAction("FIRE"),

      // Azioni di scansione/percezione
      scan: () => {
        const enemy = gameState.robots.find((r) => r.id !== this.id);
        if (enemy) {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Se il nemico è fuori dalla portata del radar, non viene rilevato.
          if (distance > this.radar.range) {
            return null;
          }

          const angle =
            ((Math.atan2(dy, dx) * 180) / Math.PI - this.rotation + 360) % 360;
          return { distance, angle };
        }
        return null;
      },

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
       * Verifica se la linea di tiro tra due punti è libera da ostacoli.
       * @param {{x: number, y: number}} startPoint - Il punto di partenza (il mio bot).
       * @param {{x: number, y: number}} endPoint - Il punto di arrivo (il nemico).
       * @returns {boolean} - True se la linea di tiro è libera.
       */
      isLineOfSightClear,

      // Eventi
      getEvents,

      /**
       * Ritorna true se c'è un ostacolo molto vicino nella direzione di movimento.
       * Utile per evitare collisioni imminenti.
       * @param {number} [probeDistance=30] - Distanza di controllo in pixel.
       * @returns {boolean}
       */
      isObstacleAhead: (probeDistance = 30) => {
        const arena = gameState.arena;
        const angleRad = this.rotation * (Math.PI / 180);

        // Calcola la posizione futura del centro del robot
        const futureX = this.x + probeDistance * Math.cos(angleRad);
        const futureY = this.y + probeDistance * Math.sin(angleRad);

        console.log(`futureX: ${futureX}, futureY: ${futureY}`);

        const robotRadius = Robot.RADIUS;

        // Controlla se il volume di collisione del robot (un cerchio)
        // si scontrerebbe con i muri dell'arena nella posizione futura.
        if (
          futureX - robotRadius < 0 ||
          futureX + robotRadius > arena.width ||
          futureY - robotRadius < 0 ||
          futureY + robotRadius > arena.height
        ) {
          return true;
        }

        // Controlla se il volume di collisione del robot (un cerchio)
        // si scontrerebbe con un ostacolo (un rettangolo).
        // Usa la funzione helper per evitare la duplicazione della logica di collisione.
        for (const obstacle of arena.obstacles) {
          const futureCircle = { x: futureX, y: futureY, radius: robotRadius };
          if (circleIntersectsRectangle(futureCircle, obstacle)) {
            return true; // Collisione con un ostacolo
          }
        }

        return false; // Il percorso è libero
      },
    };
  }

  /**
   * Esegue il codice dell'IA per determinare l'azione successiva.
   * @param {import('./Game.js').GameState} gameState
   */
  computeNextAction(gameState) {
    this.nextAction = null; // Resetta l'azione precedente
    if (this.cannonCooldown > 0) {
      this.cannonCooldown--;
    }
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
      armorHp: this.armor.hp,
      energy: this.battery.energy,
      totalWeight: this.totalWeight,
      isOverweight: this.isOverweight,
      radarRange: this.radar.range,
    };
  }
}

export default Robot;
