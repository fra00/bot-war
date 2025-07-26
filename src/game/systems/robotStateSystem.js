/**
 * Aggiorna gli stati passivi di ogni robot per il tick corrente.
 * Questo include la ricarica dell'energia e la riduzione dei cooldown.
 * @param {Array<import('../Robot.js').default>} robots
 */
export function updateRobotStates(robots) {
  robots.forEach((robot) => {
    // Decrementa il cooldown del cannone
    if (robot.cannonCooldown > 0) {
      robot.cannonCooldown--;
    }

    // Ricarica l'energia della batteria
    if (robot.battery.energy < robot.battery.maxEnergy) {
      robot.battery.energy += robot.battery.rechargeRate;
      if (robot.battery.energy > robot.battery.maxEnergy) {
        robot.battery.energy = robot.battery.maxEnergy;
      }
    }
  });
}
