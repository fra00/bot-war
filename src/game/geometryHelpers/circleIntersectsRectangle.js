const EPSILON = 1e-9; // Un valore molto piccolo per la tolleranza nei calcoli in virgola mobile

/**
 * Controlla se un cerchio interseca un rettangolo.
 * Questa è una funzione comune per la collisione cerchio-AABB (Axis-Aligned Bounding Box).
 * @param {object} circle - Il cerchio { x: number, y: number, radius: number }.
 * @param {object} rect - Il rettangolo { x: number, y: number, width: number, height: number }.
 * @returns {boolean} - True se il cerchio e il rettangolo si intersecano.
 */
export function circleIntersectsRectangle(circle, rect) {
  // Trova il punto sull'ostacolo (rettangolo) più vicino al centro del cerchio.
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  // Calcola la distanza al quadrato tra il centro del cerchio e il punto più vicino sull'ostacolo.
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;

  // Se la distanza al quadrato è minore del raggio al quadrato, c'è una collisione.
  // Usiamo EPSILON per gestire le imprecisioni del floating-point.
  // La collisione è considerata tale solo se c'è una vera sovrapposizione, non un semplice tocco.
  return distanceSquared < circle.radius * circle.radius - EPSILON;
}
