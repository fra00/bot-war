/**
 * IA di default che implementa una macchina a stati con cicli di vita (Enter/Execute/Exit).
 */
const DefaultAIBase = {
  // =================================================================
  // CONFIGURAZIONE IA
  // =================================================================
  config: {
    // Distanze
    engagementDistance: 250, // Distanza ottimale per attaccare
    kitingDistance: 150, // Distanza sotto la quale iniziare il kiting
    flankDistance: 150, // Distanza per la manovra di fiancheggiamento
    maxCoverDistance: 150, // Distanza massima per cercare copertura
    coverSeekDistance: 40, // Distanza da un ostacolo per nascondersi
    unstuckDistance: -60, // Distanza per arretrare quando incastrati
    approachDistance: 80, // Distanza per la manovra di avvicinamento
    kitingMoveDistance: -80, // Distanza per la manovra di kiting

    // Velocità (in percentuale)
    patrolSpeed: 70,

    // Angoli e Tolleranze
    aimTolerance: 5, // Gradi di tolleranza per sparare
    unstuckAngleRange: 90, // Angolo base per sbloccarsi
    unstuckAngleRandomness: 30, // Variazione casuale dell'angolo di sblocco
    evasionAngleBase: 60, // Angolo base per l'evasione
    evasionAngleRandomness: 40, // Variazione casuale dell'angolo di evasione

    // Comportamento Batteria
    rechargeEnterThreshold: 30, // Percentuale sotto la quale iniziare a ricaricare
    rechargeExitThreshold: 70, // Percentuale alla quale smettere di ricaricare

    // Tattica e Temporizzazione
    engagementBuffer: 50, // Margine oltre la distanza di ingaggio per iniziare ad avvicinarsi
    kitingBuffer: 20, // Margine oltre la distanza di kiting per smettere di arretrare
    evasionGracePeriod: 120, // Tick di "invulnerabilità" dopo un'evasione
    cornerPadding: 50, // Distanza dai bordi per i punti di ricarica
  },

  // =================================================================
  // MACCHINA A STATI
  // =================================================================
  // La mappa degli stati definisce la logica per ogni stato dell'IA.
  states: {
    // =================================================================
    // STATO SEARCHING
    // =================================================================
    SEARCHING: {
      onEnter(api, memory) {
        api.log("Inizio pattugliamento...");
      },
      onExecute(api, memory, events) {
        // Condizione di uscita prioritaria: se vediamo un nemico, attacchiamo.
        const potentialTarget = api.scan();
        if (potentialTarget) {
          return "ATTACKING"; // Richiesta di transizione di stato
        }

        // Se un movimento è terminato, e stavamo inseguendo, puliamo la memoria.
        if (
          memory.lastKnownEnemyPosition &&
          events.some(
            (e) =>
              e.type === "SEQUENCE_COMPLETED" ||
              (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
          )
        ) {
          api.updateMemory({ lastKnownEnemyPosition: null });
        }

        // Se il bot è inattivo, decide la prossima mossa.
        if (api.isQueueEmpty()) {
          // Priorità 1: Caccia all'ultima posizione nota.
          if (memory.lastKnownEnemyPosition) {
            api.log("Inseguo il nemico all'ultima posizione nota...");
            const moveSuccessful = api.moveTo(
              memory.lastKnownEnemyPosition.x,
              memory.lastKnownEnemyPosition.y,
              this.config.patrolSpeed
            );
            if (!moveSuccessful) {
              api.updateMemory({ lastKnownEnemyPosition: null });
            }
          } else {
            // Priorità 2: Pattugliamento casuale.
            api.log("Inizio pattugliamento casuale...");
            const arena = api.getArenaDimensions();
            const randomX = Math.random() * arena.width;
            const randomY = Math.random() * arena.height;
            api.moveTo(randomX, randomY, this.config.patrolSpeed);
          }
        }
      },
      onExit(api, memory) {
        // Questo metodo è intenzionalmente vuoto.
        // La chiamata a `api.stop()` è ora centralizzata in `setCurrentState`
        // per garantire una pulizia uniforme durante ogni transizione.
      },
    },

    // =================================================================
    // STATO ATTACKING
    // =================================================================
    ATTACKING: {
      onEnter(api, memory) {
        api.log("Nemico ingaggiato! Valuto la situazione...");
      },
      onExecute(api, memory, events) {
        const enemy = api.scan();
        // Condizione di uscita: Nemico perso di vista.
        if (!enemy) {
          return "SEARCHING";
        }

        // Azioni continue: Aggiorna la posizione e spara se possibile.
        api.updateMemory({
          lastKnownEnemyPosition: { x: enemy.x, y: enemy.y },
        });
        if (
          Math.abs(enemy.angle) < this.config.aimTolerance &&
          api.isLineOfSightClear(enemy)
        ) {
          api.fire();
        }

        // Con la nuova logica di `aimAt`, possiamo semplicemente chiamarlo ad ogni tick.
        // Il sistema si occuperà di correggere la mira in modo efficiente.
        api.aimAt(enemy.x, enemy.y);

        // La logica di movimento viene eseguita solo se non siamo già impegnati in un'azione.
        if (api.isQueueEmpty()) {
          // Priorità 1: Linea di tiro bloccata -> Fiancheggia.
          if (!api.isLineOfSightClear(enemy)) return "FLANKING";
          // Priorità 2: Troppo vicino -> Esegui kiting.
          if (enemy.distance < this.config.kitingDistance) return "KITING";
          // Priorità 3: Troppo lontano -> Avvicinati.
          if (
            enemy.distance >
            this.config.engagementDistance + this.config.engagementBuffer
          ) {
            api.log("Nemico troppo lontano, mi avvicino...");
            api.move(this.config.approachDistance);
          }
        }
      },
      onExit(api, memory) {
        // Questo metodo è intenzionalmente vuoto.
        // La chiamata a `api.stop()` è ora centralizzata in `setCurrentState`
        // per garantire una pulizia uniforme durante ogni transizione.
      },
    },

    // =================================================================
    // STATO KITING
    // =================================================================
    KITING: {
      onEnter(api, memory) {
        api.log("Nemico troppo vicino! Eseguo kiting...");
        api.move(this.config.kitingMoveDistance); // Arretra per creare distanza.
      },
      onExecute(api, memory, events) {
        const enemy = api.scan();

        // Condizioni di uscita
        if (!enemy) return "SEARCHING";
        if (!api.isLineOfSightClear(enemy)) return "FLANKING";
        if (
          enemy.distance >
          this.config.kitingDistance + this.config.kitingBuffer
        )
          return "ATTACKING"; // Ristabilita distanza di sicurezza

        // Azioni continue
        api.aimAt(enemy.x, enemy.y);
        if (Math.abs(enemy.angle) < this.config.aimTolerance) api.fire();

        // Se la manovra è finita ma siamo ancora troppo vicini, rientra per muoverti ancora.
        if (
          events.some(
            (e) =>
              e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION"
          )
        ) {
          return "KITING";
        }
      },
      onExit(api, memory) {
        // La pulizia dello stop è gestita centralmente.
      },
    },

    // =================================================================
    // STATO FLANKING
    // =================================================================
    FLANKING: {
      onEnter(api, memory) {
        api.log("Inizio manovra di fiancheggiamento...");
      },
      onExecute(api, memory, events) {
        const enemy = api.scan();
        // Condizione di uscita: nemico perso di vista.
        if (!enemy) {
          api.log(
            "Nemico perso durante il fiancheggiamento. Eseguo manovra evasiva."
          );
          return "EVADING";
        }

        // Condizione di uscita: manovra completata.
        if (
          events.some((e) => {
            // La manovra è completata se la sequenza finisce,
            // o se viene interrotta per una ragione esterna (es. collisione),
            // ma NON se lo stop è stato causato da una normale transizione di stato.
            return (
              e.type === "SEQUENCE_COMPLETED" ||
              (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
            );
          })
        ) {
          api.log("Manovra di fiancheggiamento completata. Torno a cercare.");
          return "SEARCHING";
        }

        // Esecuzione: se inattivi, calcola e avvia la manovra.
        if (api.isQueueEmpty()) {
          const arena = api.getArenaDimensions();
          const self = api.getState();
          const dx = enemy.x - self.x;
          const dy = enemy.y - self.y;

          const randomDirection = Math.random() < 0.5 ? 1 : -1;
          const perp_dx = -dy * randomDirection;
          const perp_dy = dx * randomDirection;
          const len = Math.sqrt(perp_dx * perp_dx + perp_dy * perp_dy) || 1;
          const targetX = self.x + (perp_dx / len) * this.config.flankDistance;
          const targetY = self.y + (perp_dy / len) * this.config.flankDistance;

          const clampedX = Math.max(0, Math.min(arena.width, targetX));
          const clampedY = Math.max(0, Math.min(arena.height, targetY));

          if (!api.moveTo(clampedX, clampedY)) {
            api.log(
              "Impossibile trovare un percorso di fiancheggiamento. Fallback in evading."
            );
            return "EVADING";
          }
        }
      },
      onExit(api, memory) {},
    },

    // =================================================================
    // STATO EVADING
    // =================================================================
    EVADING: {
      onEnter(api, memory) {
        api.log("Colpito! Inizio manovra evasiva...");
        // La chiamata a stop() è ora gestita da setCurrentState,
        // quindi qui ci concentriamo solo sulla logica specifica dello stato.
        api.updateMemory({ evasionGraceTicks: this.config.evasionGracePeriod });
      },
      onExecute(api, memory, events) {
        // Condizione di uscita: la manovra è terminata.
        if (
          events.some(
            (e) =>
              e.type === "SEQUENCE_COMPLETED" ||
              (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
          )
        ) {
          return "SEARCHING"; // Torna a cercare dopo l'evasione.
        }

        // Esecuzione: se inattivi, inizia una nuova manovra.
        if (api.isQueueEmpty()) {
          const obstacles = api.scanObstacles();
          const enemyPos = memory.lastKnownEnemyPosition;
          let coverFoundAndValid = false;

          // Priorità 1: Cerca copertura dietro un ostacolo vicino.
          if (
            obstacles.length > 0 &&
            enemyPos &&
            obstacles[0].distance < this.config.maxCoverDistance
          ) {
            const cover = obstacles[0];
            const vec = {
              x: cover.x + cover.width / 2 - enemyPos.x,
              y: cover.y + cover.height / 2 - enemyPos.y,
            };
            const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y) || 1;
            const norm = { x: vec.x / len, y: vec.y / len };
            const hidePos = {
              x:
                cover.x +
                cover.width / 2 +
                norm.x * this.config.coverSeekDistance,
              y:
                cover.y +
                cover.height / 2 +
                norm.y * this.config.coverSeekDistance,
            };

            if (
              api.isPositionValid(hidePos) &&
              api.moveTo(hidePos.x, hidePos.y)
            ) {
              coverFoundAndValid = true;
            }
          }

          // Priorità 2: Se non c'è copertura, esegui una manovra evasiva casuale.
          if (!coverFoundAndValid) {
            for (let i = 0; i < 5; i++) {
              const turnDirection = Math.random() < 0.5 ? 1 : -1;
              const randomAngle =
                (this.config.evasionAngleBase +
                  Math.random() * this.config.evasionAngleRandomness) *
                turnDirection;
              const randomDistance =
                this.config.approachDistance + Math.random() * 50;
              const angleInRad =
                (api.getState().rotation + randomAngle) * (Math.PI / 180);
              const destX =
                api.getState().x + randomDistance * Math.cos(angleInRad);
              const destY =
                api.getState().y + randomDistance * Math.sin(angleInRad);

              if (
                api.isPositionValid({ x: destX, y: destY }) &&
                api.moveTo(destX, destY)
              ) {
                return; // Manovra avviata, esci.
              }
            }
          }
        }
      },
      onExit(api, memory) {
        api.log("Manovra evasiva terminata.");
        api.updateMemory({ evasionGraceTicks: 0 }); // Resetta il periodo di grazia.
      },
    },

    // =================================================================
    // STATO UNSTUCKING
    // =================================================================
    UNSTUCKING: {
      onEnter(api, memory) {
        api.log("Collisione rilevata! Eseguo manovra per sbloccarmi.");

        // Esegue una manovra per liberarsi: arretra e gira.
        const randomAngle =
          (Math.random() < 0.5 ? 1 : -1) * this.config.unstuckAngleRange +
          (Math.random() * this.config.unstuckAngleRandomness -
            this.config.unstuckAngleRandomness / 2);
        api.sequence([
          {
            type: "START_MOVE",
            payload: { distance: this.config.unstuckDistance },
          },
          { type: "START_ROTATE", payload: { angle: randomAngle } },
        ]);
      },
      onExecute(api, memory, events) {
        // Condizione di uscita: la manovra è completata.
        if (
          events.some(
            (e) =>
              e.type === "SEQUENCE_COMPLETED" ||
              (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
          )
        ) {
          return "SEARCHING";
        }
      },
      onExit(api, memory) {
        api.log("Manovra di sblocco completata.");
        // Non è necessario uno stop qui perché la sequenza è finita,
        // ma lo lasciamo per coerenza se lo stato viene interrotto.
      },
    },

    // =================================================================
    // STATO RECHARGING
    // =================================================================
    RECHARGING: {
      onEnter(api, memory) {
        api.log("Batteria scarica. Inizio procedura di ricarica.");
        // Resetta il flag per forzare la ricerca di un nuovo punto sicuro.
        api.updateMemory({ isMovingToRecharge: false });
      },
      onExecute(api, memory, events, context) {
        // Condizione di uscita: batteria sufficientemente carica.
        if (context.batteryPercent >= this.config.rechargeExitThreshold) {
          return "SEARCHING";
        }

        // Se abbiamo completato un movimento, siamo arrivati a destinazione.
        if (events.some((e) => e.type === "SEQUENCE_COMPLETED")) {
          api.log("Arrivato al punto di ricarica. Controllo sicurezza...");
          // Se, appena arrivati, vediamo un nemico, il posto non è sicuro.
          if (api.scan()) {
            api.log("Il posto non è sicuro! Cerco un altro punto.");
            api.updateMemory({ isMovingToRecharge: false });
          } else {
            api.log(
              "Posto sicuro. Mi giro verso il centro e attendo la ricarica."
            );
            const arena = api.getArenaDimensions();
            api.aimAt(arena.width / 2, arena.height / 2);
          }
          return; // Rimani in questo stato, la logica del prossimo tick deciderà.
        }

        // Se siamo in attesa in un punto (isMovingToRecharge=true, ma coda vuota),
        // continuiamo a guardarci intorno.
        if (memory.isMovingToRecharge && api.isQueueEmpty()) {
          const arena = api.getArenaDimensions();
          api.aimAt(arena.width / 2, arena.height / 2);
        }

        // Se dobbiamo trovare un posto dove andare (isMovingToRecharge=false e siamo inattivi).
        if (!memory.isMovingToRecharge && api.isQueueEmpty()) {
          api.log("Cerco un posto sicuro per ricaricare...");
          const enemyPos = memory.lastKnownEnemyPosition;
          const arena = api.getArenaDimensions();
          const padding = this.config.cornerPadding;
          const corners = [
            { x: padding, y: padding },
            { x: arena.width - padding, y: padding },
            { x: padding, y: arena.height - padding },
            { x: arena.width - padding, y: arena.height - padding },
          ];

          const walkableCorners = corners.filter((c) => api.isPositionValid(c));

          if (walkableCorners.length > 0) {
            let bestCorner = walkableCorners[0];
            if (enemyPos) {
              bestCorner = walkableCorners.reduce((a, b) =>
                (a.x - enemyPos.x) ** 2 + (a.y - enemyPos.y) ** 2 >
                (b.x - enemyPos.x) ** 2 + (b.y - enemyPos.y) ** 2
                  ? a
                  : b
              );
            } else {
              bestCorner =
                walkableCorners[
                  Math.floor(Math.random() * walkableCorners.length)
                ];
            }
            api.moveTo(bestCorner.x, bestCorner.y);
          } else {
            // Fallback se nessun angolo è valido.
            for (let i = 0; i < 10; i++) {
              const randomX = Math.random() * arena.width;
              const randomY = Math.random() * arena.height;
              if (api.isPositionValid({ x: randomX, y: randomY })) {
                api.moveTo(randomX, randomY);
                break;
              }
            }
          }
          api.updateMemory({ isMovingToRecharge: true });
        }
      },
      onExit(api, memory) {
        api.log("Fine procedura di ricarica.");
        // Pulisci lo stato specifico della ricarica.
        api.updateMemory({ isMovingToRecharge: false });
      },
    },
  },

  /**
   * Imposta lo stato corrente e registra la transizione.
   * @param {string} newState - Il nuovo stato da impostare.
   * @param {Object} api - L'API del robot per il logging.
   */
  setCurrentState: function (newState, api) {
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
      api.updateMemory({ current: newState });

      // Chiama onEnter del nuovo stato, se esiste nel nuovo pattern
      if (this.states[newState]?.onEnter) {
        this.states[newState].onEnter.call(this, api, memory);
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
        isMovingToRecharge: false,
        evasionGraceTicks: 0, // Contatore per il periodo di grazia dell'evasione
      });
      this.setCurrentState("SEARCHING", api);
    }

    // Decrementa il contatore del periodo di grazia per l'evasione ad ogni tick.
    if (memory.evasionGraceTicks > 0) {
      api.updateMemory({
        evasionGraceTicks: memory.evasionGraceTicks - 1,
      });
    }

    const events = api.getEvents();

    // --- Gestione Transizioni ad Alta Priorità ---
    const battery = api.getBatteryState();
    const batteryPercent = (battery.energy / battery.maxEnergy) * 100;

    // Se la batteria è scarica, entra in modalità ricarica (a meno che non lo sia già)
    if (
      batteryPercent < this.config.rechargeEnterThreshold &&
      memory.current !== "RECHARGING"
    ) {
      this.setCurrentState("RECHARGING", api);
      return; // Interrompi il tick, la logica di RECHARGING inizierà dal prossimo.
    }

    // --- Gestione delle Transizioni di Stato ---
    // Se veniamo colpiti E non siamo nel periodo di grazia, iniziamo una nuova evasione.
    if (
      events.some((e) => e.type === "HIT_BY_PROJECTILE") &&
      memory.evasionGraceTicks <= 0
    ) {
      this.setCurrentState("EVADING", api);
    }
    // Se il bot si scontra con un muro, deve sbloccarsi.
    if (
      events.some(
        (e) => e.type === "ACTION_STOPPED" && e.reason === "COLLISION"
      )
    ) {
      this.setCurrentState("UNSTUCKING", api);
    }

    // --- Logica della Macchina a Stati ---
    const currentStateName = memory.current;
    const currentState = this.states[currentStateName];

    // Se lo stato corrente è gestito dal nuovo pattern Enter/Execute/Exit
    if (currentState) {
      // Passiamo un contesto con dati calcolati una sola volta per tick.
      const context = { batteryPercent, config: this.config };
      const nextStateName = currentState.onExecute?.call(
        this,
        api,
        memory,
        events,
        context
      );

      if (nextStateName && nextStateName !== currentStateName) {
        this.setCurrentState(nextStateName, api);
      }
    }
  },
};

export default DefaultAIBase;
