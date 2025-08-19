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
      // Resetta la velocità quando inattivo
      robot.vx = 0;
      robot.vy = 0;
      return;
    }

    const command = robot.commandQueue[0];

    // Inizializza la distanza rimanente per un nuovo comando di strafe
    if (
      command.type === "MOVE_LATERAL" &&
      command.remainingDistance === undefined
    ) {
      command.remainingDistance = robot.motor.strafeDistance;
    }

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
          // Resetta la velocità in caso di fallimento
          robot.vx = 0;
          robot.vy = 0;
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
        const dx = signedDistanceToMove * Math.cos(angleRad);
        const dy = signedDistanceToMove * Math.sin(angleRad);
        const newX = robot.x + dx;
        const newY = robot.y + dy;

        if (
          arena.isPositionValid(
            { x: newX, y: newY },
            Robot.RADIUS,
            robots,
            robot.id
          )
        ) {
          robot.x = newX;
          robot.y = newY;
          // Imposta la velocità
          robot.vx = dx;
          robot.vy = dy;
          // 6. Aggiorna la distanza rimanente
          command.remainingDistance -= distanceToMove;
        } else {
          // Resetta la velocità in caso di collisione
          robot.vx = 0;
          robot.vy = 0;
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
          robot.commandQueue.shift(); // Rimuovi il comando MOVE completato
          // Resetta la velocità al completamento
          robot.vx = 0;
          robot.vy = 0;
          // Se il prossimo comando è la fine della sequenza, emetti l'evento qui.
          const nextCommand = robot.commandQueue[0];
          if (nextCommand && nextCommand.type === "END_SEQUENCE") {
            newEvents.push({
              type: "SEQUENCE_COMPLETED",
              robotId: robot.id,
              payload: { lastCommandType: "MOVE" },
            });
            robot.commandQueue.shift(); // Rimuovi anche il comando END_SEQUENCE
          }
        }
        break;
      }
      case "MOVE_LATERAL": {
        // 1. Calcola la velocità potenziale per questo tick, considerando la penalità per il sovrappeso
        const potentialTickSpeed = robot.isOverweight
          ? robot.motor.maxSpeed * 0.5
          : robot.motor.maxSpeed;

        // 2. Determina la distanza effettiva da percorrere in questo tick
        const distanceToMove = Math.min(
          Math.abs(potentialTickSpeed),
          command.remainingDistance
        );

        // 3. Calcola il costo energetico aumentato per lo strafe
        const energyCost =
          distanceToMove *
          robot.motor.energyCostPerMove *
          robot.motor.strafeEnergyCostMultiplier;

        if (!robot.consumeEnergy(energyCost)) {
          // Resetta la velocità in caso di fallimento
          robot.vx = 0;
          robot.vy = 0;
          newEvents.push({
            type: "ACTION_STOPPED",
            robotId: robot.id,
            commandType: "MOVE_LATERAL",
            reason: "NO_ENERGY",
            source: "ENGINE",
          });
          robot.commandQueue.shift(); // Rimuovi il comando fallito
          break;
        }

        // 4. Calcola l'angolo di spostamento laterale (perpendicolare alla direzione del robot)
        const strafeDirection = command.direction === "left" ? -90 : 90;
        const angleRad = (robot.rotation + strafeDirection) * (Math.PI / 180);

        // 5. Aggiorna la posizione
        const dx = distanceToMove * Math.cos(angleRad);
        const dy = distanceToMove * Math.sin(angleRad);
        const newX = robot.x + dx;
        const newY = robot.y + dy;

        if (
          arena.isPositionValid(
            { x: newX, y: newY },
            Robot.RADIUS,
            robots,
            robot.id
          )
        ) {
          robot.x = newX;
          robot.y = newY;
          robot.vx = dx;
          robot.vy = dy;
          command.remainingDistance -= distanceToMove;
        } else {
          robot.vx = 0;
          robot.vy = 0;
          newEvents.push({
            type: "ACTION_STOPPED",
            robotId: robot.id,
            commandType: "MOVE_LATERAL",
            reason: "COLLISION",
            source: "ENGINE",
          });
          robot.commandQueue.shift(); // Rimuovi il comando fallito
          break;
        }

        if (command.remainingDistance < 0.1) {
          robot.commandQueue.shift(); // Rimuovi il comando MOVE_LATERAL completato
          robot.vx = 0;
          robot.vy = 0;
          // Se il prossimo comando è la fine della sequenza, emetti l'evento qui.
          const nextCommand = robot.commandQueue[0];
          if (nextCommand && nextCommand.type === "END_SEQUENCE") {
            newEvents.push({
              type: "SEQUENCE_COMPLETED",
              robotId: robot.id,
              payload: { lastCommandType: "MOVE_LATERAL" },
            });
            robot.commandQueue.shift(); // Rimuovi anche il comando END_SEQUENCE
          }
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
          robot.commandQueue.shift(); // Rimuovi il comando ROTATE completato
          // Se il prossimo comando è la fine della sequenza, emetti l'evento qui.
          const nextCommand = robot.commandQueue[0];
          if (nextCommand && nextCommand.type === "END_SEQUENCE") {
            newEvents.push({
              type: "SEQUENCE_COMPLETED",
              robotId: robot.id,
              payload: { lastCommandType: "ROTATE" },
            });
            robot.commandQueue.shift(); // Rimuovi anche il comando END_SEQUENCE
          }
        }
        break;
      }
      case "END_SEQUENCE": {
        // Questo caso si verifica se una sequenza è vuota o se è l'ultimo comando rimasto.
        // Lo gestiamo come un completamento di sequenza "vuota".
        newEvents.push({
          type: "SEQUENCE_COMPLETED",
          robotId: robot.id,
          payload: { lastCommandType: "EMPTY" },
        });
        robot.commandQueue.shift(); // Rimuovi il comando completato
        break;
      }
    }
  });

  return { newEvents };
}
