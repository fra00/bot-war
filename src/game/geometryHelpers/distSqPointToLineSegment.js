/**
 * Calcola la distanza al quadrato tra un punto e un segmento di linea.
 * Lavorare con le distanze al quadrato è spesso più efficiente perché evita
 * il calcolo della radice quadrata, che è computazionalmente costoso.
 * @param {object} point - Il punto { x: number, y: number }.
 * @param {object} p1 - Punto di inizio del segmento { x: number, y: number }.
 * @param {object} p2 - Punto di fine del segmento { x: number, y: number }.
 * @returns {number} - La distanza al quadrato tra il punto e il segmento.
 */
export function distSqPointToLineSegment(point, p1, p2) {
  const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
  if (l2 === 0) {
    // Se p1 e p2 coincidono, il segmento è un punto.
    // Calcola la distanza al quadrato dal punto a p1.
    return (point.x - p1.x) ** 2 + (point.y - p1.y) ** 2;
  }

  // Proietta il punto sulla linea definita dal segmento.
  // 't' è il fattore di proiezione: se t è in [0, 1], la proiezione cade sul segmento.
  let t =
    ((point.x - p1.x) * (p2.x - p1.x) + (point.y - p1.y) * (p2.y - p1.y)) / l2;

  // Limita 't' all'intervallo [0, 1] per trovare il punto più vicino sul segmento.
  t = Math.max(0, Math.min(1, t));

  const closestX = p1.x + t * (p2.x - p1.x);
  const closestY = p1.y + t * (p2.y - p1.y);

  // Calcola la distanza al quadrato dal punto dato al punto più vicino sul segmento.
  return (point.x - closestX) ** 2 + (point.y - closestY) ** 2;
}
