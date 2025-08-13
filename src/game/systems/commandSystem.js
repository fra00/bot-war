import Robot from "../Robot.js";

/**
 * Controlla se due comandi sono funzionalmente equivalenti.
 * Utile per evitare di riavviare un'azione già in corso (es. una rotazione).
 * @param {Object} cmd1
 * @param {Object} cmd2
 * @returns {boolean}
 */
export function isCommandEquivalent(cmd1, cmd2) {
  if (!cmd1 || !cmd2 || cmd1.type !== cmd2.type) {
    return false;
  }
  // Per ora, confrontiamo solo i comandi di rotazione basandoci sulla velocità.
  return cmd1.type === "ROTATE" && cmd1.rotationSpeed === cmd2.rotationSpeed;
}

/**
 * Processa i comandi asincroni attivi per ogni robot (movimento, rotazione).
 * Questo sistema aggiorna la posizione/rotazione del robot ad ogni tick e
 * genera eventi quando un comando è completato o interrotto.
 * @param {Array<Robot>} robots - La lista dei robot.
 * @param {import('../Arena.js').default} arena - L'oggetto arena.
 * @returns {{newEvents: Array<Object>}}
 */
export function processActiveCommands(robots, arena) {
  const newEvents = [];

  robots.forEach((robot) => {
    // Se non ci sono comandi in coda, non fare nulla
    if (robot.commandQueue.length === 0) {
      return;
    }

    const command = robot.commandQueue[0];

    switch (command.type) {
      case "MOVE": {
        // 1. Calcola la velocità potenziale per questo tick, considerando la penalità per il sovrappeso
        const potentialTickSpeed = robot.isOverweight
          ? command.speed * 0.5
          : command.speed;

        // 2. Determina la distanza effettiva da percorrere in questo tick
        const distanceToMove = Math.min(
          Math.abs(potentialTickSpeed),
          command.remainingDistance
        );

        // 3. Mantiene il segno per la direzione
        const signedDistanceToMove =
          potentialTickSpeed > 0 ? distanceToMove : -distanceToMove;

        // 4. Calcola il costo energetico
        const energyCost =
          Math.abs(distanceToMove) * robot.motor.energyCostPerMove;
        if (!robot.consumeEnergy(energyCost)) {
          newEvents.push({
            type: "ACTION_STOPPED",
            robotId: robot.id,
            commandType: "MOVE",
            reason: "NO_ENERGY",
            source: "ENGINE",
          });
          robot.commandQueue.shift(); // Rimuovi il comando fallito
          break;
        }

        // 5. Aggiorna la posizione
        const angleRad = robot.rotation * (Math.PI / 180);
        const newX = robot.x + signedDistanceToMove * Math.cos(angleRad);
        const newY = robot.y + signedDistanceToMove * Math.sin(angleRad);

        if (arena.isPositionValid({ x: newX, y: newY }, Robot.RADIUS, robots, robot.id)) {
          robot.x = newX;
          robot.y = newY;
          // 6. Aggiorna la distanza rimanente
          command.remainingDistance -= distanceToMove;
        } else {
          newEvents.push({
            type: "ACTION_STOPPED",
            robotId: robot.id,
            commandType: "MOVE",
            reason: "COLLISION",
            source: "ENGINE",
          });
          robot.commandQueue.shift(); // Rimuovi il comando fallito
          break;
        }

        if (command.remainingDistance < 0.1) {
          robot.commandQueue.shift(); // Rimuovi il comando completato
          newEvents.push({ type: "MOVE_COMPLETED", robotId: robot.id });
        }
        break;
      }
      case "ROTATE": {
        // 1. Calcola la velocità di rotazione potenziale, considerando la penalità per il sovrappeso
        const potentialRotationSpeed = robot.isOverweight
          ? command.rotationSpeed * 0.5
          : command.rotationSpeed;

        // 2. Determina l'angolo effettivo di cui ruotare in questo tick
        const angleToRotate = Math.min(
          Math.abs(potentialRotationSpeed),
          command.remainingAngle
        );

        // 3. Mantiene il segno per la direzione
        const signedAngleToRotate =
          potentialRotationSpeed > 0 ? angleToRotate : -angleToRotate;

        // 4. Calcola il costo energetico in base alla rotazione effettiva
        const energyCost =
          Math.abs(angleToRotate) * robot.motor.energyCostPerRotation;
        if (!robot.consumeEnergy(energyCost)) {
          newEvents.push({
            type: "ACTION_STOPPED",
            robotId: robot.id,
            commandType: "ROTATE",
            reason: "NO_ENERGY",
            source: "ENGINE",
          });
          robot.commandQueue.shift(); // Rimuovi il comando fallito
          break;
        }

        // 5. Aggiorna la rotazione e l'angolo rimanente
        robot.rotation = (robot.rotation + signedAngleToRotate + 360) % 360;
        command.remainingAngle -= angleToRotate;

        if (command.remainingAngle < 0.1) {
          robot.commandQueue.shift(); // Rimuovi il comando completato
          newEvents.push({ type: "ROTATION_COMPLETED", robotId: robot.id });
        }
        break;
      }
      case "END_SEQUENCE": {
        newEvents.push({ type: "SEQUENCE_COMPLETED", robotId: robot.id });
        robot.commandQueue.shift(); // Rimuovi il comando completato
        break;
      }
    }
  });

  return { newEvents };
}
