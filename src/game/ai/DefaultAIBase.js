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
    kitingLoopThreshold: 2, // Soglia per rilevare il loop di kiting
  },

  // =================================================================
  // TRANSIZIONI GLOBALI (Massima Priorità)
  // =================================================================
  globalTransitions: [
    {
      target: "UNSTUCKING",
      condition: (api, memory, context, events) =>
        events.some(
          (e) => e.type === "ACTION_STOPPED" && e.reason === "COLLISION"
        ),
      description: "Collisione con un muro, sbloccarsi è la priorità assoluta.",
    },
    {
      target: "EVADING_AIM",
      condition: (api, memory) =>
        api.isLockedOnByEnemy() &&
        !["EVADING_AIM", "UNSTUCKING", "EVADING"].includes(memory.current),
      description:
        "Nemico sta mirando, manovra evasiva proattiva per evitare il colpo.",
    },
    {
      target: "EVADING",
      condition: (api, memory, context, events) =>
        events.some((e) => e.type === "HIT_BY_PROJECTILE") &&
        memory.evasionGraceTicks <= 0,
      description: "Colpiti da un proiettile, evasione ha la priorità.",
    },
    {
      target: "KITING",
      condition: function (api, memory, context) {
        return (
          context.enemy &&
          context.enemy.distance < this.config.kitingDistance &&
          !["KITING", "UNSTUCKING", "EVADING", "FLANKING"].includes(
            memory.current
          )
        );
      },
      description: "Nemico troppo vicino, iniziare il kiting.",
    },
    {
      target: "RECHARGING",
      condition: function (api, memory, context) {
        // Aggiungiamo una condizione di sicurezza: non ricaricare se il nemico è troppo vicino.
        // La sopravvivenza ha la priorità sulla ricarica.
        const isEnemyTooClose =
          context.enemy && context.enemy.distance < this.config.kitingDistance;

        return (
          context.batteryPercent < this.config.rechargeEnterThreshold &&
          memory.current !== "RECHARGING" &&
          !isEnemyTooClose
        );
      },
      description: "Batteria scarica, cercare una stazione di ricarica.",
    },
  ],
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
          condition: (api, memory, context) => context.enemy,
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
          condition: (api, memory, context) => !context.enemy,
          description: "Passa a cercare se il nemico non è più visibile.",
        },
        {
          target: "FLANKING",
          condition: (api, memory, context) =>
            context.enemy &&
            api.isQueueEmpty() &&
            !api.isLineOfSightClear(context.enemy),
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
          this.setCurrentState("EVADING", api, context);
          return; // Interrompe l'esecuzione di onEnter per KITING
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
          condition: (api, memory, context) => !context.enemy,
          description: "Passa a cercare se il nemico non è più visibile.",
        },
        {
          target: "KITING",
          condition: (api, memory, context, events) =>
            events.some(
              (e) =>
                (e.type === "ACTION_STOPPED" &&
                  e.source !== "STATE_TRANSITION") ||
                e.type === "SEQUENCE_COMPLETED"
            ),
          description:
            "Riavvia la manovra di kiting se l'azione è finita ma il nemico è ancora troppo vicino.",
        },
      ],
    },

    // =================================================================
    // STATO FLANKING
    // =================================================================
    FLANKING: {
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
          condition: (api, memory, context, events) =>
            events.some(
              (e) =>
                e.type === "SEQUENCE_COMPLETED" ||
                (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
            ),
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
          condition: (api, memory, context, events) =>
            events.some(
              (e) =>
                e.type === "SEQUENCE_COMPLETED" ||
                (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
            ),
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
          condition: (api, memory, context) =>
            !api.isLockedOnByEnemy() && context.enemy,
          description: "Il nemico ha smesso di mirare, torno all'attacco.",
        },
        {
          target: "SEARCHING",
          condition: (api, memory, context) => !api.isLockedOnByEnemy(),
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
        // La logica è tutta in onEnter e nelle transizioni.
      },
      onExit(api, memory) {
        api.log("Manovra di sblocco completata.");
      },
      transitions: [
        {
          target: "SEARCHING",
          condition: (api, memory, context, events) =>
            events.some(
              (e) =>
                e.type === "SEQUENCE_COMPLETED" ||
                (e.type === "ACTION_STOPPED" && e.source !== "STATE_TRANSITION")
            ),
          description: "Manovra di sblocco completata, torna a cercare.",
        },
      ],
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
        // Se abbiamo completato un movimento, siamo arrivati a destinazione.
        if (events.some((e) => e.type === "SEQUENCE_COMPLETED")) {
          api.log("Arrivato al punto di ricarica. Controllo sicurezza...");
          // Se, appena arrivati, vediamo un nemico, il posto non è sicuro.
          if (context.enemy) {
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
      api.updateMemory({ current: newState, lastState: oldState });

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
        isMovingToRecharge: false,
        evasionGraceTicks: 0, // Contatore per il periodo di grazia dell'evasione
        lastState: null,
        kitingAttemptCounter: 0,
        // --- Nuovi parametri per la correzione della mira ---
        aimLeadFactor: 1.0, // Moltiplicatore per l'anticipo
        aimAdjustment: 0.05, // Quanto aggiustare ad ogni colpo mancato
        lastMissDistance: Infinity, // Distanza dell'ultimo colpo mancato
        dodgeCooldown: 0, // Cooldown per la schivata reattiva
      });
      this.setCurrentState("SEARCHING", api);
    }

    // Decrementa il contatore del periodo di grazia per l'evasione ad ogni tick.
    if (memory.evasionGraceTicks > 0) {
      api.updateMemory({
        evasionGraceTicks: memory.evasionGraceTicks - 1,
      });
    }
    if (memory.dodgeCooldown > 0) {
      api.updateMemory({ dodgeCooldown: memory.dodgeCooldown - 1 });
    }

    // --- LOGICA DI SCHIVATA REATTIVA AD ALTA PRIORITÀ ---
    // 1. Tenta di avviare una schivata. Se lo fa, interrompe il resto della logica per questo tick.
    if (this._handleReactiveDodge.call(this, api, memory)) {
      return;
    }

    // 2. Se una schivata è in corso (cooldown attivo), non fare nient'altro.
    // Questo impedisce alla FSM di cancellare la manovra di schivata.
    if (memory.dodgeCooldown > 0) {
      return;
    }

    const events = api.getEvents();

    // --- Gestione Evento PROJECTILE_NEAR_MISS ---
    const nearMissEvent = events.find((e) => e.type === "PROJECTILE_NEAR_MISS");
    if (nearMissEvent) {
      const currentMissDistance = nearMissEvent.distance;
      let newAdjustment = memory.aimAdjustment;

      // Se questo colpo mancato è peggiore del precedente, abbiamo "overshottato" la correzione.
      // Invertiamo la direzione dell'aggiustamento e lo dimezziamo.
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
      // Manteniamo il fattore di anticipo entro limiti ragionevoli
      newLeadFactor = Math.max(0.5, Math.min(1.5, newLeadFactor));

      api.updateMemory({
        aimLeadFactor: newLeadFactor,
        aimAdjustment: newAdjustment,
        lastMissDistance: currentMissDistance,
      });
    }

    // --- Gestione Transizioni ad Alta Priorità (controllate ad ogni tick) ---
    const enemy = api.scan();
    const battery = api.getBatteryState();
    const batteryPercent = (battery.energy / battery.maxEnergy) * 100;

    // --- NUOVO FLUSSO DI CONTROLLO ---
    const context = { enemy, batteryPercent, config: this.config };

    // 1. Controlla le transizioni GLOBALI in ordine di priorità
    for (const transition of this.globalTransitions) {
      if (transition.condition.call(this, api, memory, context, events)) {
        this.setCurrentState(transition.target, api);
        return; // Transizione avvenuta, fine del tick.
      }
    }

    // ---
    const currentStateName = memory.current;
    const currentState = this.states[currentStateName];

    // 2. Se nessuna transizione globale è scattata, controlla le transizioni LOCALI dello stato corrente
    if (currentState && currentState.transitions) {
      for (const transition of currentState.transitions) {
        if (transition.condition.call(this, api, memory, context, events)) {
          this.setCurrentState(transition.target, api);
          return; // Transizione avvenuta, fine del tick.
        }
      }
    }

    // 3. Se NESSUNA transizione è scattata, esegui la logica `onExecute` dello stato corrente
    if (currentState && currentState.onExecute) {
      // Reintroduciamo la possibilità per onExecute di ritornare uno stato per gestire transizioni guidate da azioni.
      const nextStateName = currentState.onExecute.call(
        this,
        api,
        memory,
        events,
        context
      );
      if (nextStateName && nextStateName !== currentStateName) {
        this.setCurrentState(nextStateName, api);
        return; // Transizione avvenuta, fine del tick.
      }
    }
  },
};

export default DefaultAIBase;
