/**
 * Calcola l'angolo di virata più breve da una rotazione corrente a un angolo di destinazione.
 * @param {number} currentAngle - La rotazione corrente (0-360).
 * @param {number} targetAngle - La rotazione di destinazione (0-360).
 * @returns {number} L'angolo di cui ruotare (da -180 a 180).
 */
function calculateTurnAngle(currentAngle, targetAngle) {
  let angleToRotate = targetAngle - currentAngle;
  if (angleToRotate > 180) angleToRotate -= 360;
  if (angleToRotate < -180) angleToRotate += 360;
  return angleToRotate;
}

/**
 * Converte un percorso di nodi della griglia in una sequenza di comandi 'rotate' e 'move'.
 * @param {Array<{x: number, y: number}>} path - La lista di nodi della griglia dal pathfinder.
 * @param {{x: number, y: number}} startPosition - La posizione attuale del robot nel mondo.
 * @param {number} startRotation - La rotazione attuale del robot.
 * @param {number} cellSize - La dimensione di una cella della griglia in pixel.
 * @param {number} speedPercentage - La velocità da usare per i comandi.
 * @returns {Array<Object>} Una lista di oggetti azione da accodare.
 */
export function generateCommandsForPath(
  path,
  startPosition,
  startRotation,
  cellSize,
  speedPercentage
) {
  if (!path || path.length === 0) {
    return [];
  }

  const actions = [];
  let currentPosition = startPosition;
  let currentRotation = startRotation;

  let i = 0;
  while (i < path.length) {
    const nextNode = path[i];
    const worldX = nextNode.x * cellSize + cellSize / 2;
    const worldY = nextNode.y * cellSize + cellSize / 2;

    const dx = worldX - currentPosition.x;
    const dy = worldY - currentPosition.y;

    const targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const angleToRotate = calculateTurnAngle(currentRotation, targetAngle);

    if (Math.abs(angleToRotate) > 1) {
      actions.push({
        type: "START_ROTATE",
        payload: { angle: angleToRotate, speedPercentage },
      });
      currentRotation = (targetAngle + 360) % 360;
    }

    // Find the end of the straight line segment
    let j = i + 1;
    while (j < path.length) {
      const currentNode = path[j - 1];
      const nextSegmentNode = path[j];
      const segmentAngle =
        (Math.atan2(
          nextSegmentNode.y - currentNode.y,
          nextSegmentNode.x - currentNode.x
        ) *
          180) /
        Math.PI;

      if (Math.abs(calculateTurnAngle(currentRotation, segmentAngle)) > 1) {
        break;
      }
      j++;
    }

    const endOfSegmentNode = path[j - 1];
    const endWorldX = endOfSegmentNode.x * cellSize + cellSize / 2;
    const endWorldY = endOfSegmentNode.y * cellSize + cellSize / 2;

    const moveDx = endWorldX - currentPosition.x;
    const moveDy = endWorldY - currentPosition.y;
    const distance = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

    if (distance > 1) {
      actions.push({
        type: "START_MOVE",
        payload: { distance, speedPercentage },
      });
    }

    currentPosition = { x: endWorldX, y: endWorldY };
    i = j;
  }

  return actions;
}

/**
 * Genera il comando per mirare a una specifica coordinata del mondo.
 * @param {{x: number, y: number}} startPosition - La posizione attuale del robot nel mondo.
 * @param {number} startRotation - La rotazione attuale del robot.
 * @param {{x: number, y: number}} targetPosition - La posizione del mondo da mirare.
 * @param {number} speedPercentage - La velocità da usare per la rotazione.
 * @returns {Object | null} Un oggetto azione di rotazione, o null se non è necessaria alcuna rotazione.
 */
export function generateAimCommand(
  startPosition,
  startRotation,
  targetPosition,
  speedPercentage
) {
  const dx = targetPosition.x - startPosition.x;
  const dy = targetPosition.y - startPosition.y;
  const targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const angleToRotate = calculateTurnAngle(startRotation, targetAngle);

  if (Math.abs(angleToRotate) > 1) {
    return {
      type: "START_ROTATE",
      payload: { angle: angleToRotate, speedPercentage },
    };
  }
  return null;
}
