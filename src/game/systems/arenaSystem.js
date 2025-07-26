import { circleIntersectsRectangle } from "../geometryHelpers/index.js";

const SAFE_ZONE_RADIUS = 100; // Raggio intorno alle safe zones in pixel
const OBSTACLE_MARGIN = 15; // Margine minimo tra gli ostacoli in pixel

/**
 * Controlla se il posizionamento di un nuovo ostacolo è valido.
 * Un posizionamento è valido se l'ostacolo non si sovrappone a zone sicure
 * o ad altri ostacoli esistenti.
 * @param {import('../Arena.js').Obstacle} candidate - L'ostacolo candidato.
 * @param {Array<import('../Arena.js').Obstacle>} existingObstacles - Gli ostacoli già presenti.
 * @param {Array<{x: number, y: number}>} safeZones - Le zone sicure (es. punti di spawn).
 * @returns {boolean} True se la posizione è valida, altrimenti false.
 */
export function isValidObstaclePlacement(candidate, existingObstacles, safeZones) {
  // 1. Controlla che non si sovrapponga a una safe zone (cerchio)
  const inSafeZone = safeZones.some((zone) => {
    const safeZoneCircle = { x: zone.x, y: zone.y, radius: SAFE_ZONE_RADIUS };
    return circleIntersectsRectangle(safeZoneCircle, candidate);
  });

  if (inSafeZone) {
    return false;
  }

  // 2. Controlla che non si sovrapponga con ostacoli esistenti (con un margine)
  const overlapsOtherObstacle = existingObstacles.some((existing) => {
    return (
      candidate.x < existing.x + existing.width + OBSTACLE_MARGIN &&
      candidate.x + candidate.width + OBSTACLE_MARGIN > existing.x &&
      candidate.y < existing.y + existing.height + OBSTACLE_MARGIN &&
      candidate.y + candidate.height + OBSTACLE_MARGIN > existing.y
    );
  });

  if (overlapsOtherObstacle) {
    return false;
  }

  // La posizione è valida
  return true;
}