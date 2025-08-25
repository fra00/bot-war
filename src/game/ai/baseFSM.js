/**
 * baseFSM - Il "motore" di una macchina a stati finiti (FSM) per l'IA dei bot.
 * Questo oggetto fornisce la logica per gestire stati, transizioni e funzioni helper.
 * Viene unito a un oggetto di configurazione per creare un'IA completa.
 */
export const baseFSM = {
  // =================================================================
  // FUNZIONI HELPER
  // =================================================================
  _predictTargetPosition: function (enemy, api, memory) {
    // Velocità del nostro proiettile (dovrebbe essere letta dall'API in un'implementazione più avanzata)
    const projectileSpeed = 5;

    // Se il nemico è fermo o non abbiamo dati sulla sua velocità, mira alla sua posizione attuale.
    if (!enemy.velocity || enemy.velocity.speed === 0) {
      return { x: enemy.x, y: enemy.y };
    }

    // Calcolo del tempo di intercetto (semplice, non iterativo per ora)
    const timeToIntercept = enemy.distance / projectileSpeed;

    // Calcolo della distanza che il nemico percorrerà
    const enemyTravelDistance =
      enemy.velocity.speed * timeToIntercept * memory.aimLeadFactor;

    // Calcolo della posizione futura del nemico
    const enemyDirectionRad = (enemy.velocity.direction * Math.PI) / 180;
    const predictedX =
      enemy.x + enemyTravelDistance * Math.cos(enemyDirectionRad);
    const predictedY =
      enemy.y + enemyTravelDistance * Math.sin(enemyDirectionRad);

    // api.log(`Mira predittiva: (${predictedX.toFixed(2)}, ${predictedY.toFixed(2)})`);

    return { x: predictedX, y: predictedY };
  },

  _handleReactiveDodge: function (api, memory) {
    if (memory.dodgeCooldown > 0) {
      return false; // In cooldown, non schivare
    }

    const incomingProjectiles = api.scanForIncomingProjectiles();
    if (incomingProjectiles.length === 0) {
      return false;
    }

    // Trova il proiettile più minaccioso (quello con il minor tempo all'impatto)
    const mostThreatening = incomingProjectiles.reduce((prev, curr) =>
      prev.timeToImpact < curr.timeToImpact ? prev : curr
    );

    const DODGE_TIME_THRESHOLD = 15; // Schiva se l'impatto è entro 15 tick
    if (mostThreatening.timeToImpact < DODGE_TIME_THRESHOLD) {
      api.log(
        `!!! Proiettile in arrivo! Schivata reattiva. t=${mostThreatening.timeToImpact.toFixed(
          1
        )}`
      );

      // --- NUOVA LOGICA DI DECISIONE PER LA SCHIVATA ---
      const projectileAngle = Math.abs(mostThreatening.angle);
      const dodgeDistance = 50; // Distanza di schivata, simile a quella dello strafe

      // Se il proiettile arriva dai lati (es. tra 45 e 135 gradi),
      // il bot è orientato perpendicolarmente al proiettile.
      // Un 'move' (avanti/indietro) è la manovra più efficace.
      if (projectileAngle > 45 && projectileAngle < 135) {
        api.log("Proiettile laterale, schivo muovendomi...");
        // Prova a muoverti in una direzione, se è bloccata, prova l'altra.
        if (!api.isObstacleAhead(dodgeDistance)) {
          api.move(dodgeDistance);
        } else if (!api.isObstacleAhead(-dodgeDistance)) {
          api.move(-dodgeDistance);
        } else {
          // Entrambe le direzioni sono bloccate, usa lo strafe come fallback.
          api.log("Movimento bloccato, tento uno strafe laterale.");
          const strafeDirection = Math.random() < 0.5 ? "left" : "right";
          api.strafe(strafeDirection);
        }
      } else {
        // Il proiettile arriva da davanti o da dietro.
        // Uno 'strafe' (spostamento laterale) è la manovra più efficace.
        api.log("Proiettile frontale/posteriore, uso lo strafe...");
        const strafeDirection = Math.random() < 0.5 ? "left" : "right";
        api.strafe(strafeDirection);
      }

      api.updateMemory({ dodgeCooldown: 20 });
      return true; // Schivata eseguita
    }

    return false;
  },

  // =================================================================
  // MOTORE DELLA MACCHINA A STATI
  // =================================================================
  /**
   * Imposta lo stato corrente e registra la transizione.
   * @param {string} newState - Il nuovo stato da impostare.
   * @param {Object} api - L'API del robot per il logging.
   */
  setCurrentState: function (newState, api, context = {}) {
    const memory = api.getMemory();
    const oldState = memory.current;

    if (oldState !== newState) {
      // Chiama onExit del vecchio stato, se esiste nel nuovo pattern
      if (oldState && this.states[oldState]?.onExit) {
        this.states[oldState].onExit.call(this, api, memory);
      }

      // Centralizziamo lo stop qui. Ogni transizione di stato interrompe l'azione precedente.
      api.stop("STATE_TRANSITION");

      api.log(`Stato: ${oldState || "undefined"} -> ${newState}`);
      // Aggiorna lo stato precedente e lo stato corrente
      api.updateMemory({
        current: newState,
        lastState: oldState,
        stateGraceTicks: this.config.stateGracePeriod,
      });

      // Resetta il contatore di kiting se usciamo dal loop kiting/unstuck
      if (newState !== "KITING" && newState !== "UNSTUCKING") {
        api.updateMemory({ kitingAttemptCounter: 0 });
      }

      // Chiama onEnter del nuovo stato, se esiste nel nuovo pattern
      if (this.states[newState]?.onEnter) {
        this.states[newState].onEnter.call(this, api, memory, context);
      }
    }
  },

  /**
   * @param {Object} api - L'API del robot per interagire con il gioco.
   */
  run: function (api) {
    const memory = api.getMemory();

    // Inizializzazione al primo tick
    if (typeof memory.current === "undefined") {
      api.updateMemory({
        lastKnownEnemyPosition: null,
        stateGraceTicks: 0,
        isMovingToRecharge: false,
        evasionGraceTicks: 0,
        lastState: null,
        kitingAttemptCounter: 0,
        aimLeadFactor: 1.0,
        aimAdjustment: 0.05,
        lastMissDistance: Infinity,
        dodgeCooldown: 0,
      });
      this.setCurrentState("SEARCHING", api);
    }

    if (memory.stateGraceTicks > 0) {
      api.updateMemory({ stateGraceTicks: memory.stateGraceTicks - 1 });
    }
    if (memory.evasionGraceTicks > 0) {
      api.updateMemory({
        evasionGraceTicks: memory.evasionGraceTicks - 1,
      });
    }
    if (memory.dodgeCooldown > 0) {
      api.updateMemory({ dodgeCooldown: memory.dodgeCooldown - 1 });
    }

    if (this._handleReactiveDodge.call(this, api, memory)) {
      return;
    }
    if (memory.dodgeCooldown > 0) {
      return;
    }

    const events = api.getEvents();

    const nearMissEvent = events.find((e) => e.type === "PROJECTILE_NEAR_MISS");
    if (nearMissEvent) {
      const currentMissDistance = nearMissEvent.distance;
      let newAdjustment = memory.aimAdjustment;

      if (currentMissDistance > memory.lastMissDistance) {
        newAdjustment *= -0.5;
        api.log(
          `Correzione mira peggiorata (dist: ${currentMissDistance.toFixed(
            2
          )}). Inverto e dimezzo aggiustamento a ${newAdjustment.toFixed(3)}`
        );
      } else {
        api.log(
          `Correzione mira migliorata (dist: ${currentMissDistance.toFixed(
            2
          )}). Continuo nella stessa direzione.`
        );
      }

      let newLeadFactor = memory.aimLeadFactor + newAdjustment;
      newLeadFactor = Math.max(0.5, Math.min(1.5, newLeadFactor));

      api.updateMemory({
        aimLeadFactor: newLeadFactor,
        aimAdjustment: newAdjustment,
        lastMissDistance: currentMissDistance,
      });
    }

    const enemy = api.scan();
    const battery = api.getBatteryState();
    const batteryPercent = (battery.energy / battery.maxEnergy) * 100;

    const currentStateName = memory.current;
    const currentState = this.states[currentStateName];
    const context = {
      enemy,
      batteryPercent,
      config: this.config,
      currentStateName,
      currentState,
    };

    if (this.emergencyTransitions) {
      for (const transition of this.emergencyTransitions) {
        var condition = transition.condition.call(this, api, memory, context, events);
        if (condition == null) {
          api.log("Condizione di transizione di emergenza non valida:", transition);
          continue;
        }
        if (condition && transition.target !== currentStateName) {
          this.setCurrentState(transition.target, api, context);
          return;
        }
      }
    }

    if (memory.stateGraceTicks > 0) {
      if (currentState && currentState.onExecute) {
        const nextStateName = currentState.onExecute.call(this, api, memory, events, context);
        if (nextStateName && nextStateName !== currentStateName) {
          this.setCurrentState(nextStateName, api, context);
        }
      }
      return;
    }

    const canBeInterruptedBy = currentState?.interruptibleBy || null;

    if (this.tacticalTransitions) {
      for (const transition of this.tacticalTransitions) {
        if (!canBeInterruptedBy || canBeInterruptedBy.includes(transition.target)) {
          const condition = transition.condition.call(this, api, memory, context, events);
          if (condition == null) {
            api.log("Condizione di transizione tattica non valida:", transition);
            continue;
          }
          if (condition && transition.target !== currentStateName) {
            this.setCurrentState(transition.target, api, context);
            return;
          }
        }
      }
    }

    if (currentState && currentState.transitions) {
      for (const transition of currentState.transitions) {
        const condition = transition.condition.call(this, api, memory, context, events);
        if (condition == null) {
          api.log(`Condizione di transizione locale non valida per lo stato '${currentStateName}':`, transition);
          continue;
        }
        if (condition && transition.target !== currentStateName) {
          this.setCurrentState(transition.target, api, context);
          return;
        }
      }
    }

    if (currentState && currentState.onExecute) {
      const nextStateName = currentState.onExecute.call(this, api, memory, events, context);
      if (nextStateName && nextStateName !== currentStateName) {
        this.setCurrentState(nextStateName, api, context);
        return;
      }
    }
  },
};
