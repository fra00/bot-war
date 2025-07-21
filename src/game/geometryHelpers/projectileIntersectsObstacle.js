import { circleIntersectsRectangle } from './circleIntersectsRectangle.js';
import { lineSegmentIntersectsRectangle } from './lineSegmentIntersectsRectangle.js';

/**
 * Verifica se un "proiettile" (modellato come un cerchio in movimento) interseca un ostacolo rettangolare.
 * Questo approccio modella il percorso del proiettile come una capsula (un rettangolo con estremità semicircolari)
 * e controlla la collisione con l'ostacolo AABB (Axis-Aligned Bounding Box).
 *
 * @param {object} startPoint - Punto di partenza del centro del proiettile { x: number, y: number }.
 * @param {object} endPoint - Punto di arrivo del centro del proiettile { x: number, y: number }.
 * @param {number} projectileRadius - Raggio del proiettile.
 * @param {object} obstacleRect - Il rettangolo dell'ostacolo { x: number, y: number, width: number, height: number }.
 * @returns {boolean} - True se il proiettile interseca l'ostacolo lungo il suo percorso.
 */
export function projectileIntersectsObstacle(
  startPoint,
  endPoint,
  projectileRadius,
  obstacleRect
) {
  // 1. Controlla se il proiettile, nella sua posizione iniziale o finale,
  // sta già intersecando l'ostacolo. Questo copre i casi in cui il
  // proiettile viene sparato da dentro o finisce dentro un ostacolo.
  if (
    circleIntersectsRectangle({ ...startPoint, radius: projectileRadius }, obstacleRect) ||
    circleIntersectsRectangle({ ...endPoint, radius: projectileRadius }, obstacleRect)
  ) {
    return true;
  }

  // 2. Controlla la collisione del "corpo" del proiettile.
  // Questo viene fatto espandendo l'ostacolo della dimensione del raggio del proiettile
  // (creando una somma di Minkowski) e verificando se il segmento di linea (il percorso
  // del centro del proiettile) interseca questo rettangolo espanso.
  const expandedRect = {
    x: obstacleRect.x - projectileRadius,
    y: obstacleRect.y - projectileRadius,
    width: obstacleRect.width + 2 * projectileRadius,
    height: obstacleRect.height + 2 * projectileRadius,
  };

  // Se il percorso del centro del proiettile interseca il rettangolo espanso, c'è una collisione.
  return lineSegmentIntersectsRectangle(startPoint, endPoint, expandedRect);
}