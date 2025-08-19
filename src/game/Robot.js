import RobotAPI from "./RobotAPI.js";

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

    /** @type {number} */
    this.vx = 0;
    this.vy = 0;

    /** @type {boolean} */
    this.isBeingAimedAt = false;

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
     * The result of the last projectile scan.
     * @type {Array<Object>}
     */
    this.lastProjectilesScan = [];

    /**
     * The result of the last projectile scan.
     * @type {Array<Object>}
     */
    this.lastProjectilesScan = [];

    /**
     * A list of log entries created by the AI.
     * @type {Array<string>}
     */
    this.logs = [];

    /**
     * An object used by the AI to persist state between ticks.
     * @type {Object}
     */
    this.memory = {};
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
    return new RobotAPI(this, gameState);
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

    this.nextActions = []; // Resetta le azioni per il tick corrente.

    try {
      // L'IA viene eseguita ad ogni tick, anche se un comando asincrono è attivo.
      // Questo le permette di reagire a eventi (es. essere colpiti) e, se necessario,
      // inviare un comando `stop()` o pianificare la mossa successiva.
      this.ai.run(this.getApi(gameState));
    } catch (e) {
      // In caso di errore di runtime nell'IA, lo registriamo e impediamo al bot di muoversi.
      // Questo evita che il game loop si blocchi.
      const errorMessage = `AI_RUNTIME_ERROR: ${e.message}`;
      console.error(`Errore nell'IA del robot ${this.id}:`, e);

      // Aggiungiamo l'errore ai log del bot per renderlo visibile nell'interfaccia.
      this.logs.push(errorMessage);
      if (this.logs.length > 100) {
        this.logs.shift();
      }
    }
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
      vx: this.vx,
      vy: this.vy,
      isBeingAimedAt: this.isBeingAimedAt,
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
