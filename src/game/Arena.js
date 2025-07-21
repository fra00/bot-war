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
    const safeRadius = 100; // Raggio intorno alle safe zones
    const obstacleMargin = 15; // Margine minimo tra gli ostacoli

    for (let i = 0; i < count; i++) {
      let obstacle;
      let validPosition = false;

      // Limita i tentativi per evitare loop infiniti
      for (let attempt = 0; attempt < 50 && !validPosition; attempt++) {
        const width = minSize + Math.random() * (maxSize - minSize);
        const height = minSize + Math.random() * (maxSize - minSize);
        const x = Math.random() * (this.width - width);
        const y = Math.random() * (this.height - height);

        obstacle = { id: `obstacle_${i}`, x, y, width, height };

        // 1. Controlla che non sia in una safe zone (spawn points)
        const inSafeZone = safeZones.some(
          (zone) =>
            Math.sqrt((x - zone.x) ** 2 + (y - zone.y) ** 2) < safeRadius
        );

        // 2. Controlla che non si sovrapponga con ostacoli esistenti
        const overlapsOtherObstacle = this.obstacles.some((existing) => {
          return (
            obstacle.x < existing.x + existing.width + obstacleMargin &&
            obstacle.x + obstacle.width + obstacleMargin > existing.x &&
            obstacle.y < existing.y + existing.height + obstacleMargin &&
            obstacle.y + obstacle.height + obstacleMargin > existing.y
          );
        });

        // La posizione è valida solo se non è in una safe zone E non si sovrappone
        if (!inSafeZone && !overlapsOtherObstacle) {
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

    // Controlla la collisione con gli ostacoli (collisione AABB - Axis-Aligned Bounding Box)
    for (const obstacle of this.obstacles) {
      // Trova il punto più vicino sull'ostacolo al centro del cerchio (robot)
      const closestX = Math.max(obstacle.x, Math.min(x, obstacle.x + obstacle.width));
      const closestY = Math.max(obstacle.y, Math.min(y, obstacle.y + obstacle.height));

      // Calcola la distanza tra il punto più vicino e il centro del cerchio
      const distanceX = x - closestX;
      const distanceY = y - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;

      // Se la distanza è minore del raggio del cerchio, c'è una collisione
      if (distanceSquared < radius * radius) {
        return false;
      }
    }

    return true;
  }
}

export default Arena;
