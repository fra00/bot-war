import Robot from "./Robot.js";

/**
 * Rappresenta un singolo proiettile sparato da un robot.
 */
class Projectile {
  static RADIUS = 3;

  /**
   * @param {Object} options - Opzioni del proiettile.
   * @param {string} options.id - ID univoco.
   * @param {string} options.ownerId - ID del robot che ha sparato.
   * @param {number} options.x - Posizione iniziale X.
   * @param {number} options.y - Posizione iniziale Y.
   * @param {number} options.rotation - Angolo di movimento in gradi.
   * @param {number} options.damage - Danno inflitto all'impatto.
   * @param {number} options.maxRange - Portata massima.
   */
  constructor({ id, ownerId, x, y, rotation, damage, maxRange }) {
    this.id = id;
    this.ownerId = ownerId;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.speed = 5; // Velocità del proiettile
    this.distanceTraveled = 0;
    this.damage = damage;
    this.maxRange = maxRange;
  }

  /**
   * Aggiorna la posizione del proiettile ad ogni tick.
   */
  update() {
    const angleRad = this.rotation * (Math.PI / 180);
    this.x += this.speed * Math.cos(angleRad);
    this.y += this.speed * Math.sin(angleRad);
    this.distanceTraveled += this.speed;
  }

  /**
   * Controlla se il proiettile ha colpito un robot.
   * @param {import('./Robot.js').default} robot - Il robot da controllare.
   * @returns {boolean} True se c'è una collisione, altrimenti false.
   */
  checkCollision(robot) {
    const dx = robot.x - this.x;
    const dy = robot.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < Robot.RADIUS;
  }

  /**
   * Restituisce lo stato pubblico del proiettile.
   */
  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
    };
  }
}

export default Projectile;
