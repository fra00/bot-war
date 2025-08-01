/**
 * Calcola le statistiche finali della partita a partire dai dati grezzi.
 * @param {import('./Game.js').GameState} gameState - Lo stato finale del gioco.
 * @returns {Array<Object>} Un array di oggetti, uno per ogni bot, con le statistiche calcolate.
 */
export function calculateFinalStats(gameState) {
  if (!gameState || !gameState.stats || !gameState.robots) {
    return [];
  }

  const { stats: rawStats, robots, elapsedTime } = gameState;
  const durationInSeconds = elapsedTime / 1000;

  return robots.map((bot) => {
    const botStats = rawStats[bot.id] || {
      shotsFired: 0,
      shotsHit: 0,
      damageDealt: 0,
      damageTaken: 0,
    };

    const accuracy =
      botStats.shotsFired > 0
        ? (botStats.shotsHit / botStats.shotsFired) * 100
        : 0;

    const dps =
      durationInSeconds > 0 ? botStats.damageDealt / durationInSeconds : 0;

    const healthRemaining =
      ((bot.hullHp + bot.armorHp) / (bot.maxHullHp + bot.maxArmorHp)) * 100;

    // Calcolo del punteggio normalizzato e pesato
    const totalDamageInMatch = botStats.damageDealt + botStats.damageTaken;
    const damagePerformance =
      totalDamageInMatch > 0
        ? (botStats.damageDealt / totalDamageInMatch) * 100
        : 0;

    // Pesi per ogni metrica
    const W_DAMAGE = 0.4;
    const W_SURVIVAL = 0.3;
    const W_ACCURACY = 0.3;

    const totalScore =
      damagePerformance * W_DAMAGE +
      healthRemaining * W_SURVIVAL +
      accuracy * W_ACCURACY;

    return {
      id: bot.id,
      name: bot.name || bot.id,
      shotsFired: botStats.shotsFired,
      shotsHit: botStats.shotsHit,
      damageDealt: botStats.damageDealt,
      damageTaken: botStats.damageTaken,
      accuracy: accuracy.toFixed(1),
      dps: dps.toFixed(2),
      healthRemaining: healthRemaining.toFixed(1),
      totalScore: totalScore.toFixed(0),
    };
  });
}
