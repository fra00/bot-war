/**
 * Verifica se un punto si trova all'interno di un rettangolo (AABB).
 * @param {object} point - Il punto da controllare { x: number, y: number }.
 * @param {object} rect - Il rettangolo { x: number, y: number, width: number, height: number }.
 * @returns {boolean} - True se il punto è all'interno o sul bordo del rettangolo.
 */
export function isPointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}
