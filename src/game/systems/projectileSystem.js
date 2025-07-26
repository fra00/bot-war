import Projectile from "../Projectile.js";
import Robot from "../Robot.js";
import { projectileIntersectsObstacle } from "../geometryHelpers/index.js";

/**
 * Aggiorna tutti i proiettili, controlla le collisioni e genera eventi.
 * Questa funzione è un "pure system" che riceve lo stato e restituisce i cambiamenti.
 * @param {Array<Projectile>} projectiles - La lista dei proiettili attivi.
 * @param {Array<Robot>} robots - La lista dei robot nell'arena.
 * @param {import('../Arena.js').default} arena - L'oggetto arena.
 * @returns {{remainingProjectiles: Array<Projectile>, newEvents: Array<Object>}}
 */
export function updateProjectiles(projectiles, robots, arena) {
  const remainingProjectiles = [];
  const newEvents = [];

  for (const projectile of projectiles) {
    const startPos = { x: projectile.x, y: projectile.y }; // Posizione prima dell'aggiornamento
    projectile.update();
    const endPos = { x: projectile.x, y: projectile.y }; // Posizione dopo l'aggiornamento

    // 1. Controlla se il proiettile ha esaurito la sua portata.
    // Se sì, viene rimosso senza generare un evento.
    if (projectile.distanceTraveled > projectile.maxRange) {
      continue;
    }

    // 2. Controlla collisioni con gli ostacoli.
    // Usiamo un flag per uscire dal loop principale del proiettile dopo una collisione.
    let hitSomething = false;
    for (const obstacle of arena.obstacles) {
      if (projectileIntersectsObstacle(startPos, endPos, Projectile.RADIUS, obstacle)) {
        newEvents.push({
          type: "PROJECTILE_HIT_OBSTACLE",
          projectileId: projectile.id,
          ownerId: projectile.ownerId,
          obstacleId: obstacle.id,
          position: endPos,
        });
        hitSomething = true;
        break; // Un proiettile colpisce un solo ostacolo e viene rimosso.
      }
    }
    if (hitSomething) {
      continue; // Passa al prossimo proiettile.
    }

    // 3. Controlla collisioni con i robot.
    for (const robot of robots) {
      // Approssima il robot a un rettangolo (hitbox) per il controllo di collisione.
      // Questo riutilizza la stessa logica di collisione degli ostacoli per prevenire il "tunneling"
      // (il proiettile che attraversa il bersaglio tra due tick).
      const robotHitbox = {
        x: robot.x - Robot.RADIUS,
        y: robot.y - Robot.RADIUS,
        width: Robot.RADIUS * 2,
        height: Robot.RADIUS * 2,
      };

      if (robot.id !== projectile.ownerId && projectileIntersectsObstacle(startPos, endPos, Projectile.RADIUS, robotHitbox)) {
        robot.takeDamage(projectile.damage);

        newEvents.push({
          type: "ENEMY_HIT",
          projectileId: projectile.id,
          ownerId: projectile.ownerId,
          targetId: robot.id,
          damage: projectile.damage,
        });
        newEvents.push({
          type: "HIT_BY_PROJECTILE",
          robotId: robot.id,
          ownerId: projectile.ownerId,
          damage: projectile.damage,
        });

        hitSomething = true;
        break; // Un proiettile colpisce un solo robot e viene rimosso.
      }
    }
    if (hitSomething) {
      continue; // Passa al prossimo proiettile.
    }

    // 4. Controlla se il proiettile colpisce un muro (confini dell'arena).
    const isInBounds = (p) =>
      p.x - Projectile.RADIUS >= 0 &&
      p.x + Projectile.RADIUS <= arena.width &&
      p.y - Projectile.RADIUS >= 0 &&
      p.y + Projectile.RADIUS <= arena.height;

    if (!isInBounds(endPos)) {
      newEvents.push({
        type: "PROJECTILE_HIT_WALL",
        projectileId: projectile.id,
        ownerId: projectile.ownerId,
        position: endPos,
      });
      continue; // Passa al prossimo proiettile.
    }

    // Se non ha colpito nulla, il proiettile rimane attivo per il prossimo tick.
    remainingProjectiles.push(projectile);
  }
  return { remainingProjectiles, newEvents };
}
