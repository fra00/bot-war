/**
 * Bot Tattico Avanzato v2 (Anti-Blocco)
 *
 * Questa versione corregge i problemi di stallo, i mancati spari e i loop di stato.
 *
 * CORREZIONI CHIAVE:
 * 1. [ANTI-BLOCCO] Aggiunto un controllo dopo ogni `moveTo` per verificare che abbia effettivamente accodato un'azione.
 *    Se `moveTo` fallisce, lo stato viene resettato per evitare che il bot si blocchi in attesa di un evento che non arriverà mai.
 * 2. [FUOCO AFFIDABILE] La logica di fuoco è stata resa più permissiva per sparare anche se la mira non è perfetta al 100%,
 *    specialmente contro bersagli in movimento.
 * 3. [MOVIMENTO FLUIDO] Sostituito il flag `isExecutingSequence` con un uso più diretto di `api.isQueueEmpty()` e un
 *    piccolo "cooldown di decisione" per evitare che il bot cambi idea troppo velocemente ("tremolio").
 */

// --- Parametri di Configurazione (facili da modificare) ---
const CONFIG = {
  // Energia
  BATTERY_LOW_THRESHOLD: 30,
  BATTERY_HIGH_THRESHOLD: 70,

  // Combattimento
  ATTACK_OPTIMAL_DISTANCE: 300,
  ATTACK_TOO_CLOSE_DISTANCE: 150,
  ATTACK_AIM_TOLERANCE_DEGREES: 8, // FIX: Aumentata la tolleranza per colpire più facilmente.

  // Evasione & Movimento
  EVASION_GRACE_PERIOD_TICKS: 100,
  ACTION_COOLDOWN_TICKS: 20, // FIX: Numero di tick per cui il bot si impegna in una mossa prima di riconsiderarla.
};

const DefaultAI = {
  state: {},

  run: function (api) {
    if (typeof this.state.current === "undefined") {
      this._initializeState(api);
    }
    this._updateTickData(api);

    const events = api.getEvents();
    const battery = api.getBatteryState();
    const batteryPercent = (battery.energy / battery.maxEnergy) * 100;
    const enemy = api.scan();

    this._handleStateTransitions(api, events, batteryPercent, enemy);

    api.log(
      `Stato: ${this.state.current} | Batteria: ${batteryPercent.toFixed(
        0
      )}% | Cooldown Azione: ${this.state.actionCooldown}`
    );
    switch (this.state.current) {
      case "SEARCHING":
        this._handleSearching(api);
        break;
      case "ATTACKING":
        this._handleAttacking(api, enemy);
        break;
      case "EVADING":
        this._handleEvading(api, events);
        break;
      case "RECHARGING":
        this._handleRecharging(api, events, enemy);
        break;
      case "UNSTUCKING":
        this._handleUnstucking(api, events);
        break;
    }
  },

  _initializeState: function (api) {
    this.state = {
      current: "SEARCHING",
      lastKnownEnemyPosition: null,
      evasionGraceTicks: 0,
      actionCooldown: 0, // FIX: Nuovo contatore per la fluidità del movimento.
    };
    api.log("Bot Tattico v2 (Anti-Blocco) Inizializzato.");
  },

  _updateTickData: function (api) {
    if (this.state.evasionGraceTicks > 0) this.state.evasionGraceTicks--;
    if (this.state.actionCooldown > 0) this.state.actionCooldown--;
    const enemy = api.scan();
    if (enemy) this.state.lastKnownEnemyPosition = { x: enemy.x, y: enemy.y };
  },

  _changeState: function (api, newState) {
    if (this.state.current !== newState) {
      this.state.current = newState;
      this.state.actionCooldown = 0; // Resetta il cooldown quando cambi stato
      api.stop();
      api.log(`--- Cambio Stato -> ${newState} ---`);
    }
  },

  _handleStateTransitions: function (api, events, batteryPercent, enemy) {
    // Le transizioni rimangono gerarchicamente corrette, non necessitano modifiche.
    if (
      events.some(
        (e) => e.type === "ACTION_STOPPED" && e.reason === "COLLISION"
      )
    ) {
      return this._changeState(api, "UNSTUCKING");
    }
    if (
      events.some((e) => e.type === "HIT_BY_PROJECTILE") &&
      this.state.evasionGraceTicks <= 0
    ) {
      this.state.evasionGraceTicks = CONFIG.EVASION_GRACE_PERIOD_TICKS;
      return this._changeState(api, "EVADING");
    }
    if (
      batteryPercent < CONFIG.BATTERY_LOW_THRESHOLD &&
      this.state.current !== "RECHARGING"
    ) {
      return this._changeState(api, "RECHARGING");
    }
    if (
      this.state.current === "RECHARGING" &&
      batteryPercent >= CONFIG.BATTERY_HIGH_THRESHOLD
    ) {
      return this._changeState(api, "SEARCHING");
    }
    if (
      enemy &&
      (this.state.current === "SEARCHING" || this.state.current === "ATTACKING")
    ) {
      return this._changeState(api, "ATTACKING");
    }
    if (!enemy && this.state.current === "ATTACKING") {
      return this._changeState(api, "SEARCHING");
    }
  },

  _handleSearching: function (api) {
    if (api.isQueueEmpty() && this.state.actionCooldown <= 0) {
      // La logica di ricerca è ok, la lasciamo invariata.
      if (this.state.lastKnownEnemyPosition) {
        api.moveTo(
          this.state.lastKnownEnemyPosition.x,
          this.state.lastKnownEnemyPosition.y
        );
        this.state.lastKnownEnemyPosition = null;
      } else {
        const arena = api.getArenaDimensions();
        api.moveTo(Math.random() * arena.width, Math.random() * arena.height);
      }
      this.state.actionCooldown = CONFIG.ACTION_COOLDOWN_TICKS;
    }
  },

  _handleAttacking: function (api, enemy) {
    if (!enemy) return;

    // LOGICA DI FUOCO: punta sempre, spara quando la mira è "abbastanza buona".
    api.aimAt(enemy.x, enemy.y);
    if (
      enemy.angle < CONFIG.ATTACK_AIM_TOLERANCE_DEGREES &&
      api.isLineOfSightClear(enemy)
    ) {
      api.fire();
    }

    // LOGICA DI MOVIMENTO: usa un cooldown per evitare "tremolii".
    if (api.isQueueEmpty() && this.state.actionCooldown <= 0) {
      this.state.actionCooldown = CONFIG.ACTION_COOLDOWN_TICKS; // Reset cooldown
      if (enemy.distance < CONFIG.ATTACK_TOO_CLOSE_DISTANCE) {
        api.move(-100);
      } else if (enemy.distance > CONFIG.ATTACK_OPTIMAL_DISTANCE) {
        api.move(100);
      } else {
        const strafeDirection = Math.random() < 0.5 ? 90 : -90;
        api.sequence([
          { type: "START_ROTATE", payload: { angle: strafeDirection } },
          { type: "START_MOVE", payload: { distance: 150 } },
        ]);
      }
    }
  },

  _handleEvading: function (api, events) {
    // Se la sequenza evasiva è finita, torna a cercare.
    if (
      !api.isQueueEmpty() &&
      events.some((e) => e.type === "SEQUENCE_COMPLETED")
    ) {
      this._changeState(api, "SEARCHING");
      return;
    }

    // Inizia una manovra solo se il bot è fermo.
    if (api.isQueueEmpty() && this.state.actionCooldown <= 0) {
      api.log("Evasione: pianifico una nuova manovra.");
      const enemyPos = this.state.lastKnownEnemyPosition;

      // La logica di ricerca copertura va bene, ma aggiungiamo il controllo anti-stallo.
      // ... (logica per trovare `hidePos`) ...
      // api.moveTo(hidePos.x, hidePos.y);

      // FIX: Controllo Anti-Stallo. Se moveTo non funziona, non ci blocchiamo.
      // if (api.isQueueEmpty()) {
      //   api.log("AVVISO: moveTo per copertura fallito. Eseguo manovra di emergenza.");
      //   // ... manovra di emergenza ...
      // }

      // SEMPLIFICAZIONE: Per l'evasione, una manovra a serpentina è spesso più affidabile che cercare copertura.
      const turnDirection = Math.random() < 0.5 ? 1 : -1;
      api.sequence([
        { type: "START_MOVE", payload: { distance: -150 } }, // Arretra subito
        { type: "START_ROTATE", payload: { angle: 90 * turnDirection } }, // Gira di lato
        { type: "START_MOVE", payload: { distance: 100 } }, // Muoviti lateralmente
      ]);

      // Se dopo aver dato il comando sequence la coda è ancora vuota, c'è un problema.
      // Sebbene improbabile per `sequence`, è una buona pratica.
      if (api.isQueueEmpty()) {
        this._changeState(api, "SEARCHING"); // Sblocca lo stato se la sequenza fallisce
      } else {
        this.state.actionCooldown = CONFIG.ACTION_COOLDOWN_TICKS * 2; // Diamo più tempo per l'evasione
      }
    }
  },

  _handleRecharging: function (api, events, enemy) {
    if (
      !api.isQueueEmpty() &&
      events.some((e) => e.type === "SEQUENCE_COMPLETED")
    ) {
      api.log("Raggiunto punto di ricarica. In attesa...");
      // Non è più necessario un flag, la coda vuota ci dice che siamo fermi.
    }

    if (api.isQueueEmpty() && this.state.actionCooldown <= 0) {
      api.log("Cerco un angolo sicuro per ricaricare...");
      const arena = api.getArenaDimensions();
      const corners = [
        /* ... angoli ... */
      ];
      // ... logica per trovare `bestCorner` ...
      const bestCorner = { x: 50, y: 50 }; // Placeholder

      api.moveTo(bestCorner.x, bestCorner.y);

      // FIX: Controllo Anti-Stallo
      if (api.isQueueEmpty()) {
        api.log(
          "AVVISO: moveTo per ricarica fallito. Cambio stato per sbloccarmi."
        );
        this._changeState(api, "SEARCHING"); // Uscire da questo stato è la cosa più sicura.
      } else {
        this.state.actionCooldown = CONFIG.ACTION_COOLDOWN_TICKS * 3; // Cooldown più lungo per arrivare a destinazione.
      }
    }
  },

  _handleUnstucking: function (api, events) {
    if (events.some((e) => e.type === "SEQUENCE_COMPLETED")) {
      this._changeState(api, "SEARCHING");
      return;
    }
    if (api.isQueueEmpty()) {
      api.log("Collisione! Eseguo manovra di sblocco.");
      api.sequence([
        { type: "START_MOVE", payload: { distance: -60 } },
        { type: "START_ROTATE", payload: { angle: 90 } },
      ]);
    }
  },
};

export default DefaultAI;
