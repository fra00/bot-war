import { isValidObstaclePlacement } from "./systems/arenaSystem.js";
import { circleIntersectsRectangle } from "./geometryHelpers/index.js";
/**
 * @typedef {Object} Dimensions
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} Obstacle
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * Rappresenta l'arena di combattimento.
 * Contiene le dimensioni e, in futuro, potrebbe contenere ostacoli o altri elementi di gioco.
 */
class Arena {
  /**
   * @param {number} width - La larghezza dell'arena.
   * @param {number} height - L'altezza dell'arena.
   */
  constructor(width, height) {
    /**
     * La larghezza dell'arena.
     * @type {number}
     * @public
     */
    this.width = width;

    /**
     * L'altezza dell'arena.
     * @type {number}
     * @public
     */
    this.height = height;

    /**
     * Un array di ostacoli presenti nell'arena.
     * @type {Array<Obstacle>}
     * @public
     */
    this.obstacles = [];
  }

  /**
   * Genera ostacoli casuali all'interno dell'arena.
   * @param {number} count - Il numero di ostacoli da generare.
   * @param {Array<{x: number, y: number}>} safeZones - Aree dove non generare ostacoli (es. spawn points).
   */
  generateObstacles(count, safeZones = []) {
    this.obstacles = [];
    const minSize = 30;
    const maxSize = 80;

    for (let i = 0; i < count; i++) {
      let obstacle;
      let validPosition = false;

      // Limita i tentativi per evitare loop infiniti
      for (let attempt = 0; attempt < 100 && !validPosition; attempt++) {
        const width = minSize + Math.random() * (maxSize - minSize);
        const height = minSize + Math.random() * (maxSize - minSize);
        const x = Math.random() * (this.width - width);
        const y = Math.random() * (this.height - height);

        obstacle = { id: `obstacle_${i}`, x, y, width, height };
        
        if (isValidObstaclePlacement(obstacle, this.obstacles, safeZones)) {
          validPosition = true;
        }
      }

      if (validPosition) {
        this.obstacles.push(obstacle);
      }
    }
  }

  /**
   * Controlla se una data posizione è all'interno dei confini dell'arena.
   * @param {{x: number, y: number}} position - La posizione da controllare.
   * @param {number} [radius=0] - Il raggio dell'oggetto da controllare, per collisioni più accurate.
   * @returns {boolean} True se la posizione è valida, altrimenti false.
   */
  isPositionValid({ x, y }, radius = 0) {
    // Controlla i confini dell'arena
    if (x - radius < 0 || x + radius > this.width || y - radius < 0 || y + radius > this.height) {
      return false;
    }

    // Controlla la collisione con gli ostacoli
    const objectAsCircle = { x, y, radius };
    for (const obstacle of this.obstacles) {
      if (circleIntersectsRectangle(objectAsCircle, obstacle)) {
        return false;
      }
    }

    return true;
  }
}

export default Arena;
