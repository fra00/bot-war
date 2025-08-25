import { baseFSM } from "./baseFSM.js";

/**
 * IA di default che implementa una macchina a stati con cicli di vita (Enter/Execute/Exit).
 */
const DefaultAIBase = {
  // =================================================================
  // TIPO DI SCRIPT (NON MODIFICARE)
  // =================================================================
  standardFSM: true, // Indica che questo script usa il motore FSM di default

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
    kitingLoopThreshold: 2, // Soglia per rilevare il loop di kiting
    stateGracePeriod: 10, // Tick minimi di permanenza in un nuovo stato per evitare sfarfallio
  },

  // =================================================================
  // TRANSIZIONI DI EMERGENZA (Priorità Massima, non possono essere bloccate)
  // =================================================================
  emergencyTransitions: [
    {
      target: "UNSTUCKING",
      condition: function (api, memory, context, events) {
        return events.some(
          (e) => e.type === "ACTION_STOPPED" && e.reason === "COLLISION"
        );
      },
      description: "Collisione, priorità assoluta.",
    },
    {
      target: "EVADING",
      condition: function (api, memory, context, events) {
        return (
          events.some((e) => e.type === "HIT_BY_PROJECTILE") &&
          memory.evasionGraceTicks <= 0
        );
      },
      description: "Colpiti da un proiettile, evasione ha la priorità.",
    },
  ],

  // =================================================================
  // TRANSIZIONI TATTICHE (Priorità Media, possono essere bloccate da stati protetti)
  // =================================================================
  tacticalTransitions: [
    {
      target: "EVADING_AIM",
      condition: function (api, memory) {
        return api.isLockedOnByEnemy();
      },
      description:
        "Nemico sta mirando, manovra evasiva proattiva per evitare il colpo.",
    },
    {
      target: "KITING",
      condition: function (api, memory, context) {
        return (
          !!context.enemy && context.enemy.distance < this.config.kitingDistance
        );
      },
      description: "Nemico troppo vicino, iniziare il kiting.",
    },
    {
      target: "RECHARGING",
      condition: function (api, memory, context) {
        // La gestione dello sfarfallio è ora globale, non serve più il cooldown manuale.
        return context.batteryPercent < this.config.rechargeEnterThreshold;
      },
      description: "Batteria scarica, cercare una stazione di ricarica.",
    },
    {
      target: "ATTACKING",
      condition: function (api, memory, context) {
        return !!context.enemy;
      },
      description: "Nemico rilevato, ingaggiare l'attacco.",
    },
  ],
  states: {
    // =================================================================
    // STATO SEARCHING
    // =================================================================
    SEARCHING: {
      onEnter(api, memory) {
        api.log("Inizio pattugliamento...");
      },
      onExecute(api, memory, events, context) {
        // La logica di transizione è stata spostata.
        // Questa funzione ora gestisce solo le azioni continue o di "mantenimento".

        // Se un movimento è terminato e stavamo inseguendo, puliamo la memoria.
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
            // Usiamo la nuova funzione per ottenere un punto valido,
            // evitando di scegliere destinazioni dentro gli ostacoli.
            const randomPoint = api.getRandomPoint();
            if (randomPoint) {
              api.moveTo(randomPoint.x, randomPoint.y, this.config.patrolSpeed);
            }
          }
        }
      },
      onExit(api, memory) {
        // Questo metodo è intenzionalmente vuoto.
        // La chiamata a `api.stop()` è ora centralizzata in `setCurrentState`
        // per garantire una pulizia uniforme durante ogni transizione.
      },
      transitions: [
        {
          target: "ATTACKING",
          condition: function (api, memory, context) {
            return !!context.enemy;
          },
          description: "Passa ad attaccare se un nemico è visibile.",
        },
      ],
    },

    // =================================================================
    // STATO ATTACKING
    // =================================================================
    ATTACKING: {
      onEnter(api, memory) {
        api.log("Nemico ingaggiato! Valuto la situazione...");
      },
      onExecute(api, memory, events, context) {
        // La logica di transizione è stata spostata.
        // Questa funzione ora gestisce solo le azioni continue dello stato.
        const { enemy } = context;
        if (!enemy) return; // Guardia di sicurezza se il nemico scompare tra i tick

        // Azioni continue: Aggiorna la posizione e spara se possibile.
        api.updateMemory({
          lastKnownEnemyPosition: { x: enemy.x, y: enemy.y },
        });

        // Mira predittiva: calcola dove sarà il nemico e mira lì.
        const predictedPos = this._predictTargetPosition(enemy, api, memory);
        api.aimAt(predictedPos.x, predictedPos.y);

        // Spara se la mira è buona e la linea di tiro è libera
        if (
          Math.abs(enemy.angle) < this.config.aimTolerance &&
          api.isLineOfSightClear(enemy)
        ) {
          api.fire({ trackMiss: true });
        }

        // Logica di azione (non di transizione): se il nemico è troppo lontano, avvicinati.
        if (api.isQueueEmpty()) {
          if (
            enemy.distance >
            this.config.engagementDistance + this.config.engagementBuffer
          ) {
            api.log("Nemico troppo lontano, mi avvicino...");
            api.move(this.config.approachDistance);
          }
        }
      },
      onExit(api, memory) {},
      transitions: [
        {
          target: "SEARCHING",
          condition: function (api, memory, context) {
            return !context.enemy;
          },
          description: "Passa a cercare se il nemico non è più visibile.",
        },
        {
          target: "FLANKING",
          condition: function (api, memory, context) {
            context.enemy &&
              api.isQueueEmpty() &&
              !api.isLineOfSightClear(context.enemy);
          },
          description:
            "Passa a fiancheggiare se la linea di tiro è bloccata e non si sta già muovendo.",
        },
      ],
    },

    // =================================================================
    // STATO KITING
    // =================================================================
    KITING: {
      onEnter(api, memory, context) {
        api.log("Nemico troppo vicino! Valuto manovra di kiting...");
        // Rilevamento e gestione del loop KITING -> UNSTUCKING
        if (
          memory.lastState === "UNSTUCKING" &&
          memory.kitingAttemptCounter >= this.config.kitingLoopThreshold
        ) {
          api.log(
            `Loop di Kiting-Unstuck rilevato (${memory.kitingAttemptCounter} tentativi). Cambio strategia in EVADING.`
          );
          // Resetta il contatore e forza una manovra evasiva più complessa.
          api.updateMemory({ kitingAttemptCounter: 0 });
          // this.setCurrentState("EVADING", api, context);
          return "EVADING"; // Interrompe l'esecuzione di onEnter per KITING
        }
        // Incrementa il contatore di tentativi di kiting.
        api.updateMemory({
          kitingAttemptCounter: memory.kitingAttemptCounter + 1,
        });
      },
      onExecute(api, memory, events, context) {
        // La logica di transizione è stata spostata.
        // Questa funzione ora gestisce solo le azioni continue dello stato.
        const { enemy } = context;
        if (!enemy) return; // Guardia di sicurezza

        // Mira predittiva anche durante il kiting
        const predictedPos = this._predictTargetPosition(enemy, api, memory);
        api.aimAt(predictedPos.x, predictedPos.y);

        api.fire({ trackMiss: true });

        if (api.isQueueEmpty()) {
          // Se il nemico è alle nostre spalle, avanziamo per allontanarci.
          if (Math.abs(enemy.angle) > 90) {
            api.log("Nemico alle spalle, avanzo per allontanarmi.");
            const moveDistance = Math.abs(this.config.kitingMoveDistance);
            if (api.isObstacleAhead(moveDistance)) {
              api.log(
                "Spazio per avanzare bloccato, cerco una nuova posizione."
              );
              const arena = api.getArenaDimensions();
              const randomX = Math.random() * arena.width;
              const randomY = Math.random() * arena.height;
              api.moveTo(randomX, randomY);
            } else {
              api.move(moveDistance);
            }
          } else {
            // Il nemico è di fronte, eseguiamo il kiting standard (arretriamo).
            api.log("Nemico di fronte, arretro (kiting).");
            const moveDistance = this.config.kitingMoveDistance; // Valore negativo
            if (api.isObstacleAhead(moveDistance)) {
              api.log(
                "Spazio per arretrare bloccato, cerco una nuova posizione."
              );
              const arena = api.getArenaDimensions();
              const randomX = Math.random() * arena.width;
              const randomY = Math.random() * arena.height;
              api.moveTo(randomX, randomY);
            } else {
              api.move(moveDistance);
            }
          }
        }
      },
      onExit(api, memory) {
        // La pulizia dello stop è gestita centralmente.
      },
      transitions: [
        {
          target: "ATTACKING",
          condition: function (api, memory, context) {
            return (
              context.enemy &&
              context.enemy.distance >
                this.config.kitingDistance + this.config.kitingBuffer
            );
          },
          description:
            "Torna ad attaccare se la distanza di sicurezza è stata ripristinata.",
        },
        {
          target: "SEARCHING",
          condition: function (api, memory, context) {
            return !context.enemy;
          },
          description: "Passa a cercare se il nemico non è più visibile.",
        },
        {
          target: "KITING",
          condition: function (api, memory, context, events) {
            return events.some(
              (e) =>
                (e.type === "ACTION_STOPPED" &&
                  e.source !== "STATE_TRANSITION") ||
                e.type === "SEQUENCE_COMPLETED"
            );
          },
          description:
            "Riavvia la manovra di kiting se l'azione è finita ma il nemico è ancora troppo vicino.",
        },
      ],
    },

    // =================================================================
    // STATO FLANKING
    // =================================================================
    FLANKING: {
      // Stato protetto: una volta iniziata, la manovra di fiancheggiamento
      // può essere interrotta solo da eventi di emergenza.
      interruptibleBy: ["UNSTUCKING", "EVADING"],

      onEnter(api, memory) {
        api.log("Inizio manovra di fiancheggiamento...");
      },
      onExecute(api, memory, events, context) {
        // Esecuzione: se inattivi, calcola e avvia la manovra.
        if (api.isQueueEmpty()) {
          const { enemy } = context;
          if (!enemy) return; // Guardia di sicurezza, la transizione gestirà il cambio stato.

          const arena = api.getArenaDimensions();
          const self = api.getState(); // N.B: api.getState() è un metodo dell'API
          const dx = enemy.x - self.x;
          const dy = enemy.y - self.y;

          const randomDirection = Math.random() < 0.5 ? 1 : -1;
          const perp_dx = -dy * randomDirection;
          const perp_dy = dx * randomDirection;
          const len = Math.sqrt(perp_dx ** 2 + perp_dy ** 2) || 1;
          // Calcola un punto sul fianco del nemico (orbita) invece che un punto
          // laterale rispetto alla posizione corrente del bot (strafe).
          // Questo è più efficace per aggirare gli ostacoli.
          const targetX = enemy.x + (perp_dx / len) * this.config.flankDistance;
          const targetY = enemy.y + (perp_dy / len) * this.config.flankDistance;

          const clampedX = Math.max(0, Math.min(arena.width, targetX));
          const clampedY = Math.max(0, Math.min(arena.height, targetY));

          // Transizione guidata dall'azione: se moveTo fallisce, cambia stato.
          if (!api.moveTo(clampedX, clampedY)) {
            api.log(
              "Impossibile trovare un percorso di fiancheggiamento. Fallback in evading."
            );
            return "EVADING"; // Ritorna il nuovo stato
          }
        }
      },
      onExit(api, memory) {},
      transitions: [
        // {
        //   target: "EVADING",
        //   condition: (api, memory, context) => !context.enemy,
        //   description:
        //     "Nemico perso durante il fiancheggiamento, passa a evasione.",
        // },
        {
          target: "SEARCHING",
          condition: function (api, memory, context, events) {
            events.some(
              (e) =>
                e.type === "SEQUENCE_COMPLETED" ||
                (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
            );
          },
          description:
            "Manovra di fiancheggiamento completata, torna a cercare.",
        },
      ],
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
      onExecute(api, memory, events, context) {
        // Esecuzione: se inattivi, inizia una nuova manovra.
        if (api.isQueueEmpty()) {
          // La logica di transizione è stata spostata.
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
      transitions: [
        {
          target: "SEARCHING",
          condition: function (api, memory, context, events) {
            events.some(
              (e) =>
                e.type === "SEQUENCE_COMPLETED" ||
                (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
            );
          },
          description: "Manovra evasiva completata, torna a cercare.",
        },
      ],
    },

    // =================================================================
    // STATO EVADING_AIM (Evasione Proattiva)
    // =================================================================
    EVADING_AIM: {
      onEnter(api) {
        api.log("Il nemico mi sta puntando! Manovra evasiva...");
      },
      onExecute(api, memory, events, context) {
        // Se siamo inattivi, eseguiamo una manovra di "strafe" laterale.
        if (api.isQueueEmpty()) {
          const strafeDirection = Math.random() < 0.5 ? "left" : "right";
          api.strafe(strafeDirection);
        }
      },
      onExit(api) {
        api.log("Il nemico ha smesso di puntare. Riprendo le operazioni.");
      },
      transitions: [
        {
          target: "ATTACKING",
          condition: function (api, memory, context) {
            return !api.isLockedOnByEnemy() && !!context.enemy;
          },
          description: "Il nemico ha smesso di mirare, torno all'attacco.",
        },
        {
          target: "SEARCHING",
          condition: function (api, memory, context) {
            return !api.isLockedOnByEnemy();
          },
          description: "Il nemico ha smesso di mirare, torno a cercare.",
        },
      ],
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
      onExecute(api, memory, events, context) {
        if (api.isQueueEmpty()) {
          return "SEARCHING"; // Ritorna il nuovo stato
        }
      },
      onExit(api, memory) {
        api.log("Manovra di sblocco completata.");
      },
      transitions: [
        {
          target: "SEARCHING",
          condition: function (api, memory, context, events) {
            var finished = events.some(
              (e) =>
                e.type === "SEQUENCE_COMPLETED" ||
                (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
            );
            if (finished == true) {
              api.log("Manovra di sblocco completata, torno a cercare.");
            }
            return finished;
          },
          description: "Manovra di sblocco completata, torna a cercare.",
        },
      ],
    },

    // =================================================================
    // STATO RECHARGING
    // =================================================================
    RECHARGING: {
      // NUOVA PROPRIETÀ: Questo stato può essere interrotto SOLO da queste transizioni di emergenza.
      // Qualsiasi altra transizione tattica (come ATTACKING) verrà ignorata.
      interruptibleBy: ["UNSTUCKING", "EVADING"],

      onEnter(api, memory) {
        api.log("Batteria scarica. Inizio procedura di ricarica.");
        // Resetta il flag per forzare la ricerca di un nuovo punto sicuro.
        api.updateMemory({ isMovingToRecharge: false });
      },
      onExecute(api, memory, events, context) {
        // Se abbiamo completato un movimento, siamo arrivati a destinazione.
        if (
          memory.isMovingToRecharge &&
          events.some((e) => e.type === "SEQUENCE_COMPLETED")
        ) {
          api.log("Arrivato al punto di ricarica. Controllo sicurezza...");
          // Se, appena arrivati, vediamo un nemico, il posto non è sicuro.
          if (context.enemy) {
            api.log("Il posto non è sicuro! Cerco un altro punto.");
            api.updateMemory({ isMovingToRecharge: false });
          }
          return; // Rimani in questo stato, la logica del prossimo tick deciderà.
        }

        // Se dobbiamo trovare un posto dove andare (isMovingToRecharge=false e siamo inattivi).
        if (!memory.isMovingToRecharge && api.isQueueEmpty()) {
          api.log("Cerco un posto sicuro per ricaricare...");
          const safePoint = api.getRandomPoint(); // Semplificato per l'esempio
          if (safePoint && api.moveTo(safePoint.x, safePoint.y)) {
            api.updateMemory({ isMovingToRecharge: true });
          } else {
            // Se non riesco a muovermi, torno a cercare. Il periodo di grazia globale
            // impedirà un nuovo tentativo immediato.
            api.log(
              "Impossibile trovare un percorso per ricaricare, torno a cercare..."
            );
            return "SEARCHING"; // Ritorna il nuovo stato
            // this.setCurrentState("SEARCHING", api);
          }
        }
      },
      onExit(api, memory) {
        api.log("Fine procedura di ricarica.");
        // Pulisci lo stato specifico della ricarica.
        api.updateMemory({ isMovingToRecharge: false });
      },
      transitions: [
        {
          target: "SEARCHING",
          condition: function (api, memory, context) {
            return context.batteryPercent >= this.config.rechargeExitThreshold;
          },
          description: "Batteria carica, torna a cercare.",
        },
      ],
    },
  },
};

export default {
  ...DefaultAIBase,
  ...baseFSM,
};
