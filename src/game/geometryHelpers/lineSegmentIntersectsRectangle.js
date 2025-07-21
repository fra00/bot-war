/**
 * Controlla se un segmento di linea interseca un rettangolo (AABB) usando l'algoritmo di clipping Liang-Barsky.
 * Questo algoritmo è efficiente e gestisce tutti i casi, inclusi i segmenti che iniziano o finiscono all'interno del rettangolo.
 * @param {object} p1 - Il punto di inizio del segmento { x: number, y: number }.
 * @param {object} p2 - Il punto di fine del segmento { x: number, y: number }.
 * @param {object} rect - Il rettangolo { x: number, y: number, width: number, height: number }.
 * @returns {boolean} - True se il segmento interseca il rettangolo.
 */
export function lineSegmentIntersectsRectangle(p1, p2, rect) {
  let t0 = 0;
  let t1 = 1;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  const p = [-dx, dx, -dy, dy];
  const q = [
    p1.x - rect.x,
    rect.x + rect.width - p1.x,
    p1.y - rect.y,
    rect.y + rect.height - p1.y,
  ];

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false; // Linea parallela e fuori dal bordo di clipping
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) {
        if (r > t1) return false;
        t0 = Math.max(t0, r);
      } else {
        // p[i] > 0
        if (r < t0) return false;
        t1 = Math.min(t1, r);
      }
    }
  }

  return t0 <= t1;
}
