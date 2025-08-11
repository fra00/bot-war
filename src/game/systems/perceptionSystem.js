import Robot from "../Robot.js";
import {
  projectileIntersectsObstacle,
  circleIntersectsRectangle,
} from "../geometryHelpers/index.js";

/**
 * Scansiona l'area per trovare il nemico più vicino all'interno del raggio del radar.
 * @param {Robot} self - Il robot che sta scansionando.
 * @param {Array<import('../Robot.js').RobotState>} allRobots - Lo stato di tutti i robot nell'arena.
 * @returns {{distance: number, angle: number} | null} Dati del nemico o null.
 */
export function scanForEnemy(self, allRobots) {
  const enemyState = allRobots.find((r) => r.id !== self.id);
  if (!enemyState) {
    return null;
  }

  const dx = enemyState.x - self.x;
  const dy = enemyState.y - self.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Se il nemico è fuori dalla portata del radar, non viene rilevato.
  if (distance > self.radar.range) {
    return null;
  }

  // Calcola l'angolo assoluto verso il nemico
  const targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
  // Calcola l'angolo relativo alla rotazione del robot
  let angle = targetAngle - self.rotation;
  // Normalizza l'angolo nell'intervallo [-180, 180] per una gestione più semplice
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;
  return { distance, angle, x: enemyState.x, y: enemyState.y };
}

/**
 * Scansiona l'area per trovare gli ostacoli all'interno del raggio del radar.
 * @param {Robot} self - Il robot che sta scansionando.
 * @param {Array<import('../Arena.js').Obstacle>} obstacles - La lista degli ostacoli nell'arena.
 * @returns {Array<Object>} Una lista di ostacoli rilevati con dati aggiuntivi.
 */
export function scanForObstacles(self, obstacles) {
  const detectedObstacles = [];
  const radarCircle = { x: self.x, y: self.y, radius: self.radar.range };

  for (const obstacle of obstacles) {
    // Usa la funzione helper per verificare se il cerchio del radar interseca il rettangolo dell'ostacolo.
    if (circleIntersectsRectangle(radarCircle, obstacle)) {
      const dx = obstacle.x + obstacle.width / 2 - self.x;
      const dy = obstacle.y + obstacle.height / 2 - self.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = ((Math.atan2(dy, dx) * 180) / Math.PI - self.rotation + 360) % 360;

      detectedObstacles.push({
        ...obstacle,
        distance,
        angle,
      });
    }
  }

  return detectedObstacles.sort((a, b) => a.distance - b.distance);
}

/**
 * Controlla se una specifica posizione nelle coordinate del mondo è calpestabile per un robot.
 * Una posizione è calpestabile se un robot centrato lì non collide con muri o ostacoli.
 * @param {{x: number, y: number}} position - La posizione del mondo da controllare.
 * @param {number} robotRadius - Il raggio del robot.
 * @param {Object} arenaData - I dati dell'arena {width, height, obstacles}.
 * @param {Array<import('../Robot.js').RobotState>} [allRobots=[]] - Lo stato di tutti i robot.
 * @param {string} [selfId=null] - L'ID del robot che sta controllando la posizione.
 * @returns {boolean}
 */
export function isPositionWalkable(position, robotRadius, arenaData, allRobots = [], selfId = null) {
  const { width, height, obstacles } = arenaData;
  const { x, y } = position;

  // Controlla i confini dell'arena
  if (
    x - robotRadius < 0 ||
    x + robotRadius > width ||
    y - robotRadius < 0 ||
    y + robotRadius > height
  ) {
    return false;
  }

  // Controlla le collisioni con gli ostacoli
  const objectAsCircle = { x, y, radius: robotRadius };
  for (const obstacle of obstacles) {
    if (circleIntersectsRectangle(objectAsCircle, obstacle)) {
      return false;
    }
  }

  // Controlla le collisioni con altri robot
  for (const otherRobot of allRobots) {
    if (otherRobot.id === selfId) continue;

    const dx = otherRobot.x - x;
    const dy = otherRobot.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < robotRadius + Robot.RADIUS) {
      return false;
    }
  }

  return true;
}

/**
 * Verifica se la linea di tiro verso una posizione target è libera da ostacoli.
 * @param {{x: number, y: number}} startPosition - La posizione di partenza del tiro.
 * @param {{x: number, y: number}} targetPosition - La posizione del bersaglio.
 * @param {number} projectileRadius - Il raggio del proiettile.
 * @param {Array<import('../Arena.js').Obstacle>} obstacles - La lista degli ostacoli.
 * @returns {boolean} - True se la linea di tiro è libera, false altrimenti.
 */
export function checkLineOfSight(startPosition, targetPosition, projectileRadius, obstacles) {
  for (const obstacle of obstacles) {
    if (projectileIntersectsObstacle(startPosition, targetPosition, projectileRadius, obstacle)) {
      return false; // Ostacolo rilevato
    }
  }
  return true; // Nessun ostacolo sul percorso
}

/**
 * Ritorna true se c'è un ostacolo molto vicino nella direzione di movimento.
 * @param {Robot} self - Il robot che sta controllando.
 * @param {import('../Arena.js').default} arena - L'arena di gioco.
 * @param {number} probeDistance - Distanza di controllo in pixel.
 * @returns {boolean}
 */
export function checkForObstacleAhead(self, arena, probeDistance) {
  const angleRad = self.rotation * (Math.PI / 180);

  // Calcola la posizione futura del centro del robot
  const futureX = self.x + probeDistance * Math.cos(angleRad);
  const futureY = self.y + probeDistance * Math.sin(angleRad);

  const robotRadius = Robot.RADIUS;

  // Controlla collisione con i muri dell'arena
  if (
    futureX - robotRadius < 0 ||
    futureX + robotRadius > arena.width ||
    futureY - robotRadius < 0 ||
    futureY + robotRadius > arena.height
  ) {
    return true;
  }

  // Controlla collisione con gli ostacoli
  for (const obstacle of arena.obstacles) {
    const futureCircle = { x: futureX, y: futureY, radius: robotRadius };
    if (circleIntersectsRectangle(futureCircle, obstacle)) {
      return true;
    }
  }

  return false; // Il percorso è libero
}