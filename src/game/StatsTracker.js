// Creeremo un nuovo file: src/game/StatsTracker.js

class StatsTracker {
  constructor() {
    this.stats = {};
  }

  /**
   * Inizializza o resetta le statistiche per un dato bot.
   * @param {string} botId
   */
  _initializeBotStats(botId) {
    if (!this.stats[botId]) {
      this.stats[botId] = {
        shotsFired: 0,
        shotsHit: 0,
        damageDealt: 0,
        damageTaken: 0,
      };
    }
  }

  /**
   * Registra un colpo sparato da un bot.
   * @param {string} botId
   */
  trackShotFired(botId) {
    this._initializeBotStats(botId);
    this.stats[botId].shotsFired++;
  }

  /**
   * Registra un colpo andato a segno e il danno inflitto.
   * @param {string} ownerId - L'ID del bot che ha sparato.
   * @param {number} damage - Il danno inflitto.
   */
  trackHit(ownerId, damage) {
    this._initializeBotStats(ownerId);
    this.stats[ownerId].shotsHit++;
    this.stats[ownerId].damageDealt += damage;
  }

  /**
   * Registra il danno subito da un bot.
   * @param {string} targetId - L'ID del bot che ha subito il danno.
   * @param {number} damage - Il danno subito.
   */
  trackDamageTaken(targetId, damage) {
    this._initializeBotStats(targetId);
    this.stats[targetId].damageTaken += damage;
  }

  /**
   * Resetta tutte le statistiche.
   */
  reset() {
    this.stats = {};
  }

  /**
   * Restituisce le statistiche grezze raccolte.
   * @returns {Object}
   */
  getStats() {
    return this.stats;
  }
}

export default StatsTracker;
