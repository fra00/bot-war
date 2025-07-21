/**
 * Calcola il punto di intersezione tra due segmenti di linea, se esiste.
 * @param {object} A - Punto di inizio del primo segmento { x: number, y: number }.
 * @param {object} B - Punto di fine del primo segmento { x: number, y: number }.
 * @param {object} C - Punto di inizio del secondo segmento { x: number, y: number }.
 * @param {object} D - Punto di fine del secondo segmento { x: number, y: number }.
 * @returns {object|null} - L'oggetto del punto di intersezione { x, y, offset } o null se non si intersecano.
 *                           'offset' è un valore tra 0 e 1 che indica a che punto lungo il primo segmento (da A a B) si trova l'intersezione.
 */
export function getIntersection(A, B, C, D) {
  const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
  const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

  if (bottom !== 0) {
    const t = tTop / bottom;
    const u = uTop / bottom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return { x: A.x + t * (B.x - A.x), y: A.y + t * (B.y - A.y), offset: t };
    }
  }
  return null;
}
