import Projectile from "../Projectile.js";

/**
 * Esegue l'azione decisa dall'IA per ogni robot per il tick corrente.
 * Questo include l'avvio di nuovi comandi asincroni (move, rotate) o
 * l'esecuzione di azioni sincrone (fire).
 * @param {Array<import('../Robot.js').default>} robots
 * @param {number} projectileCounter
 * @returns {{newProjectiles: Array<Projectile>, newEvents: Array<Object>, updatedProjectileCounter: number}}
 */
export function executeNextActions(robots, projectileCounter) {
  const newProjectiles = [];
  const newEvents = [];
  let updatedProjectileCounter = projectileCounter;

  robots.forEach((robot) => {
    const actions = robot.nextActions;
    if (!actions || actions.length === 0) return;

    actions.forEach((action) => {
      switch (action.type) {
        case "START_MOVE": {
          const { distance, speedPercentage } = action.payload;
          const clampedPercentage = Math.max(
            -100,
            Math.min(speedPercentage, 100)
          );
          const speed =
            robot.motor.maxSpeed *
            (clampedPercentage / 100) *
            Math.sign(distance);

          robot.commandQueue.push({
            type: "MOVE",
            speed: speed,
            remainingDistance: Math.abs(distance),
          });
          break;
        }
        case "START_ROTATE": {
          const { angle, speedPercentage } = action.payload;
          const clampedPercentage = Math.max(
            -100,
            Math.min(speedPercentage, 100)
          );
          const rotationSpeed =
            robot.motor.maxRotationSpeed *
            (clampedPercentage / 100) *
            Math.sign(angle);

          robot.commandQueue.push({
            type: "ROTATE",
            rotationSpeed: rotationSpeed,
            remainingAngle: Math.abs(angle),
          });
          break;
        }
        case "STOP_ACTION": {
          // Interrompe il comando corrente e svuota l'intera coda
          if (robot.commandQueue.length > 0) {
            newEvents.push({
              type: "ACTION_STOPPED",
              robotId: robot.id,
              commandType: robot.commandQueue[0].type,
              reason: "USER_COMMAND", // Manteniamo la ragione generica
              source: action.payload.source, // Aggiungiamo la fonte specifica
            });
            robot.commandQueue = [];
          }
          break;
        }
        case "FIRE": {
          if (robot.cannonCooldown > 0) break;

          if (robot.consumeEnergy(robot.cannon.energyCost)) {
            robot.cannonCooldown = robot.cannon.fireRate;

            const projectileId = `proj-${updatedProjectileCounter++}`;
            const projectile = new Projectile({
              id: projectileId,
              ownerId: robot.id,
              x: robot.x,
              y: robot.y,
              rotation: robot.rotation,
              damage: robot.cannon.damage,
              maxRange: robot.cannon.range,
            });
            newProjectiles.push(projectile);
          }
          break;
        }
        case "END_SEQUENCE": {
          robot.commandQueue.push({ type: "END_SEQUENCE" });
          break;
        }
      }
    });
  });

  return { newProjectiles, newEvents, updatedProjectileCounter };
}
