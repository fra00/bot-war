/**
 * IA di default minimale.
 * Non esegue alcuna azione. Serve come placeholder.
 */
const DefaultAIBase = {
  /**
   * Imposta lo stato corrente e registra la transizione.
   * @param {string} newState - Il nuovo stato da impostare.
   * @param {Object} api - L'API del robot per il logging.
   */
  setCurrentState: function (newState, api) {
    const memory = api.getMemory();
    if (memory.current !== newState) {
      api.log(`Stato: ${memory.current || "undefined"} -> ${newState}`);
      api.updateMemory({ current: newState });
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
    if (batteryPercent < 30 && memory.current !== "RECHARGING") {
      this.setCurrentState("RECHARGING", api);
      api.updateMemory({
        isMovingToRecharge: false, // Resetta lo stato per la nuova modalità
      });
      api.stop();
    }

    // --- Gestione delle Transizioni di Stato ---
    // Se veniamo colpiti E non siamo nel periodo di grazia, iniziamo una nuova evasione.
    if (
      events.some((e) => e.type === "HIT_BY_PROJECTILE") &&
      memory.evasionGraceTicks <= 0
    ) {
      this.setCurrentState("EVADING", api); // Change state to EVADING
      api.stop(); // Svuota la coda per reagire subito
      api.updateMemory({
        evasionGraceTicks: 120, // Imposta un periodo di grazia (es 60 tick)
      });
    }

    // Se il bot si scontra con un muro, deve sbloccarsi.
    if (
      events.some(
        (e) => e.type === "ACTION_STOPPED" && e.reason === "COLLISION"
      )
    ) {
      this.setCurrentState("UNSTUCKING", api);
      api.stop(); // Assicura che la coda sia pulita
    }

    if (events.some((e) => e.type === "ENEMY_DETECTED")) {
      this.setCurrentState("ATTACKING", api);
      api.stop(); // Interrompe la ricerca per attaccare
    }

    // --- Gestione Interruzioni Proattive ---
    // Mentre si cerca o ci si ritira, controlla sempre se un nemico appare.
    // Questo rende il bot molto più reattivo e gli permette di interrompere
    // lunghi percorsi di `moveTo` se si presenta un'opportunità.
    if (memory.current === "SEARCHING" || memory.current === "RECHARGING") {
      const enemy = api.scan();
      if (enemy) {
        this.setCurrentState("ATTACKING", api);
        api.stop(); // Interrompe il movimento corrente per attaccare subito.
        return; // Esce per questo tick, la logica di ATTACKING verrà eseguita al prossimo.
      }
    }
    // --- Logica della Macchina a Stati ---
    switch (memory.current) {
      case "RECHARGING": {
        // Condizione di uscita: se la batteria è sufficientemente carica, torna a cercare.
        if (batteryPercent >= 70) {
          this.setCurrentState("SEARCHING", api);
          api.updateMemory({
            isMovingToRecharge: false, // Resetta lo stato per la prossima modalità
          });
          break;
        }

        // Se abbiamo completato un movimento, significa che siamo arrivati a destinazione.
        // Controlliamo se il posto è sicuro.
        if (events.some((e) => e.type === "SEQUENCE_COMPLETED")) {
          api.log("Arrivato a destinazione. Controllo sicurezza...");
          const enemy = api.scan();
          if (enemy) {
            // Il posto non è sicuro. Annulliamo lo stato di "movimento per ricarica"
            // in modo che al prossimo tick ne cerchi uno nuovo.
            api.log("Il posto non è sicuro! Cerco un altro punto.");
            api.updateMemory({
              isMovingToRecharge: false,
            });
          } else {
            // Il posto è sicuro. Restiamo qui.
            // Non facciamo nulla a 'isMovingToRecharge', così il bot sa che è "arrivato"
            // e non deve cercare un nuovo posto.
            api.log("Posto sicuro. In attesa e ricarica.");
          }
          // Usciamo per questo tick, la nuova logica verrà applicata al prossimo.
          break;
        }

        // Se siamo "in movimento per ricarica" ma la coda comandi è vuota,
        // significa che siamo arrivati e stiamo aspettando.
        // Controlliamo costantemente se arriva un nemico e ci giriamo verso il centro.
        if (memory.isMovingToRecharge && api.isQueueEmpty()) {
          const enemy = api.scan();
          if (enemy) {
            api.log("Nemico avvistato mentre ricarico! Scappo.");
            api.updateMemory({
              isMovingToRecharge: false, // Annulla il movimento per ricarica
            });
            break;
          }
          // Se non c'è un nemico, girati verso il centro dell'arena per avere una buona visuale.
          const arena = api.getArenaDimensions();
          api.aimAt(arena.width / 2, arena.height / 2);
        }

        // Se NON ci stiamo muovendo per ricaricare e la coda è vuota,
        // significa che dobbiamo trovare un posto dove andare.
        if (!memory.isMovingToRecharge && api.isQueueEmpty()) {
          api.log("Cerco un posto sicuro per ricaricare...");
          // Usa la posizione attuale del nemico se visibile, altrimenti l'ultima nota.
          const enemy = api.scan();
          const enemyPos = enemy || memory.lastKnownEnemyPosition;

          // Logica di ripiego: vai nell'angolo più lontano dal nemico.
          const arena = api.getArenaDimensions();
          const corners = [
            { x: 50, y: 50 },
            { x: arena.width - 50, y: 50 },
            { x: 50, y: arena.height - 50 },
            { x: arena.width - 50, y: arena.height - 50 },
          ];

          // Filtra gli angoli per tenere solo quelli calpestabili.
          const walkableCorners = corners.filter((corner) =>
            api.isPositionValid(corner)
          );

          if (walkableCorners.length > 0) {
            let bestCorner = walkableCorners[0];
            if (enemyPos) {
              let maxDistSq = 0;
              for (const corner of walkableCorners) {
                const dSq =
                  (corner.x - enemyPos.x) ** 2 + (corner.y - enemyPos.y) ** 2;
                if (dSq > maxDistSq) {
                  maxDistSq = dSq;
                  bestCorner = corner;
                }
              }
            } else {
              // Se non sappiamo dov'è il nemico, un angolo valido casuale va bene.
              bestCorner =
                walkableCorners[
                  Math.floor(Math.random() * walkableCorners.length)
                ];
            }
            api.moveTo(bestCorner.x, bestCorner.y);
          } else {
            // Fallback: se nessun angolo è valido (scenario improbabile ma possibile),
            // muoviti in un punto casuale valido per evitare di rimanere bloccato.
            api.log("Nessun angolo sicuro trovato! Scelgo un punto casuale.");
            for (let i = 0; i < 10; i++) {
              // Tenta 10 volte
              const randomX = Math.random() * arena.width;
              const randomY = Math.random() * arena.height;
              if (api.isPositionValid({ x: randomX, y: randomY })) {
                api.moveTo(randomX, randomY);
                break;
              }
            }
          }

          api.updateMemory({
            isMovingToRecharge: true, // Segna che stiamo cercando un posto per ricaricare
          });
        }
        break;
      }
      case "UNSTUCKING":
        // Se il bot è bloccato, esegue una manovra per liberarsi.
        // Questa logica viene eseguita solo una volta grazie al controllo isQueueEmpty.
        if (api.isQueueEmpty()) {
          api.log("Collisione rilevata! Eseguo manovra per sbloccarmi.");
          // Manovra più robusta: arretra un po' e poi gira di un angolo casuale.
          // Usiamo una sequenza per assicurarci che entrambe le azioni vengano considerate
          // come un'unica manovra.
          const randomAngle =
            (Math.random() < 0.5 ? 90 : -90) + (Math.random() * 30 - 15); // Gira a ~90° a dx/sx
          api.sequence([
            { type: "START_MOVE", payload: { distance: -60 } }, // Arretra un po' di più
            { type: "START_ROTATE", payload: { angle: randomAngle } },
          ]);
        }

        // Una volta che l'intera sequenza di sblocco è completata (o interrotta),
        // torna a cercare per ricalcolare la situazione.
        if (
          events.some(
            (e) =>
              e.type === "SEQUENCE_COMPLETED" ||
              (e.type === "ACTION_STOPPED" && memory.current === "UNSTUCKING")
          )
        ) {
          api.log(
            "Manovra di sblocco completata. Ritorno in modalità SEARCHING."
          );
          this.setCurrentState("SEARCHING", api);
        }
        break;

      case "SEARCHING":
        // Rendi lo stato di ricerca "proattivo". Controlla sempre se un nemico è visibile.
        // Questo è più robusto che affidarsi solo all'evento ENEMY_DETECTED per la ri-acquisizione.
        const potentialTarget = api.scan();
        if (potentialTarget) {
          this.setCurrentState("ATTACKING", api);
          api.stop(); // Interrompe il pattugliamento per attaccare immediatamente.
          break; // Esce per rieseguire la logica al prossimo tick con il nuovo stato.
        }

        // Se abbiamo un'ultima posizione nota, la nostra priorità è andare lì.
        if (memory.lastKnownEnemyPosition) {
          if (api.isQueueEmpty()) {
            api.moveTo(
              memory.lastKnownEnemyPosition.x,
              memory.lastKnownEnemyPosition.y,
              70 // Usa una velocità ridotta per risparmiare energia
            );
            // Se moveTo non ha accodato comandi (es. percorso non trovato),
            // la coda è ancora vuota. In questo caso, abbandoniamo la caccia
            // per evitare un loop infinito.
            if (api.isQueueEmpty()) {
              api.updateMemory({
                lastKnownEnemyPosition: null, // Abbandona la caccia se non troviamo nulla
              });
            }
          }
          // Se arriviamo a destinazione e non troviamo ancora nulla, abbandoniamo la pista.
          // Se il movimento verso l'ultima posizione nota è completato e non abbiamo
          // ancora trovato il nemico, abbandoniamo la pista.
          if (events.some((e) => e.type === "MOVE_COMPLETED")) {
            api.updateMemory({
              lastKnownEnemyPosition: null, // Abbandona la caccia se non troviamo nulla
            });
          }
          break;
        }

        // Se non viene trovato alcun nemico e il bot è inattivo, continua a pattugliare.
        if (api.isQueueEmpty()) {
          const arena = api.getArenaDimensions();
          const randomX = Math.random() * arena.width;
          const randomY = Math.random() * arena.height;
          api.moveTo(randomX, randomY, 70); // Pattuglia a velocità ridotta
        }
        break;

      case "ATTACKING":
        const enemy = api.scan();
        if (!enemy) {
          // Se abbiamo un'ultima posizione nota, andiamo a caccia.
          this.setCurrentState("SEARCHING", api);
          api.stop(); // Interrompe le manovre di attacco per iniziare subito la caccia.
          break;
        }

        // Aggiorniamo costantemente l'ultima posizione nota finché vediamo il nemico.
        api.updateMemory({
          lastKnownEnemyPosition: { x: enemy.x, y: enemy.y },
        });

        // --- LOGICA DI FUOCO (ogni tick) ---
        // Spara se la mira è buona e la linea di tiro è libera.
        // `enemy.angle < 5` è una buona approssimazione per "essere in mira".
        // `api.fire()` è un'azione istantanea, non interferisce con il movimento.
        if (enemy.angle < 5 && api.isLineOfSightClear(enemy)) {
          api.fire();
        }

        // --- LOGICA DI MOVIMENTO (solo quando il bot è inattivo) ---
        // Se il bot ha finito la sua sequenza di mosse precedente, ne pianifica una nuova.
        if (api.isQueueEmpty()) {
          const arena = api.getArenaDimensions();
          const optimalDistance = 250;
          const tooCloseDistance = 150;
          const isLosClear = api.isLineOfSightClear(enemy);

          // Priorità 1: Se la linea di tiro è bloccata, usa moveTo per riposizionarti.
          if (!isLosClear) {
            api.log(
              "Linea di tiro bloccata. Inizio manovra di fiancheggiamento."
            );
            this.setCurrentState("FLANKING", api);
            api.stop();
            break;
          } else {
            // Priorità 2: Se la linea di tiro è libera, gestisci la distanza (kiting).
            api.aimAt(enemy.x, enemy.y);
            if (enemy.distance < tooCloseDistance) {
              api.move(-80); // Troppo vicino, arretra (kiting).
            } else if (enemy.distance > optimalDistance + 50) {
              api.move(80); // Troppo lontano, avvicinati.
            }
          }
          break;
        }
        break;
      case "FLANKING": {
        // Controlla se il nemico è ancora visibile. Se no, torna a cercare.
        const enemy = api.scan();

        // Se la manovra è completata, torna a cercare per rivalutare la situazione.
        if (
          events.some(
            (e) =>
              e.type === "SEQUENCE_COMPLETED" || e.type === "ACTION_STOPPED"
          )
        ) {
          api.log("Manovra di fiancheggiamento completata. Torno a cercare.");
          this.setCurrentState("SEARCHING", api);
          break;
        }

        // Se siamo appena entrati nello stato (coda vuota), calcola e avvia la manovra.
        if (api.isQueueEmpty()) {
          if (enemy) {
            api.log("Calcolo punto di fiancheggiamento...");
            const arena = api.getArenaDimensions();
            const self = api.getState();
            const dx = enemy.x - self.x;
            const dy = enemy.y - self.y;

            // Calcola un punto di fiancheggiamento a 90 gradi e a 150px di distanza
            const flankDistance = 150;
            const randomDirection = Math.random() < 0.5 ? 1 : -1;
            const perp_dx = -dy * randomDirection;
            const perp_dy = dx * randomDirection;
            const len = Math.sqrt(perp_dx * perp_dx + perp_dy * perp_dy) || 1;
            const targetX = self.x + (perp_dx / len) * flankDistance;
            const targetY = self.y + (perp_dy / len) * flankDistance;

            // Assicura che le coordinate di destinazione siano all'interno dell'arena.
            const clampedX = Math.max(0, Math.min(arena.width, targetX));
            const clampedY = Math.max(0, Math.min(arena.height, targetY));

            const moveSuccessful = api.moveTo(clampedX, clampedY);

            // La nuova implementazione di moveTo restituisce false in caso di fallimento.
            if (!moveSuccessful) {
              api.log(
                "Impossibile trovare un percorso di fiancheggiamento. Fallback in evading."
              );
              this.setCurrentState("EVADING", api);
            }
          } else {
            api.log("Nessun nemico visibile. Fallback in evading");
            this.setCurrentState("EVADING", api);
          }
        }
        break;
      }

      case "EVADING":
        // Priorità 1: Controlla se la manovra di evasione è terminata.
        // Se sì, cambia stato ed esci subito per questo tick.
        if (
          events.some(
            (e) =>
              e.type === "SEQUENCE_COMPLETED" || e.type === "ACTION_STOPPED"
          )
        ) {
          this.setCurrentState("SEARCHING", api); // Torna a cercare dopo l'evasione
          api.updateMemory({
            evasionGraceTicks: 0, // Resetta il periodo di grazia
          });
          break; // Esci per evitare di accodare una nuova manovra nello stesso tick.
        }

        // Priorità 2: Se non abbiamo finito e siamo inattivi, inizia una nuova manovra.
        if (api.isQueueEmpty()) {
          const obstacles = api.scanObstacles();
          const enemyPos = memory.lastKnownEnemyPosition;
          const MAX_COVER_DISTANCE = 150;
          let coverFoundAndValid = false;

          // Se c'è un ostacolo abbastanza vicino e sappiamo dov'è il nemico...
          if (
            obstacles.length > 0 &&
            enemyPos &&
            obstacles[0].distance < MAX_COVER_DISTANCE
          ) {
            const cover = obstacles[0];

            // ...calcola un punto di copertura sicuro dietro di esso.
            const vec = {
              x: cover.x + cover.width / 2 - enemyPos.x,
              y: cover.y + cover.height / 2 - enemyPos.y,
            };
            const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y) || 1;
            const norm = { x: vec.x / len, y: vec.y / len };
            const hideDistance = 40;
            const hidePos = {
              x: cover.x + cover.width / 2 + norm.x * hideDistance,
              y: cover.y + cover.height / 2 + norm.y * hideDistance,
            };

            // Se la posizione di copertura è valida, muoviti lì.
            if (api.isPositionValid(hidePos)) {
              api.moveTo(hidePos.x, hidePos.y);
              coverFoundAndValid = true;
            }
          }
          // Se non è stata trovata una copertura valida, tenta una manovra evasiva casuale ma sicura.
          if (!coverFoundAndValid) {
            let evasionManeuverSet = false;
            const selfState = api.getState();

            // Tenta fino a 5 volte di trovare una posizione di evasione valida.
            for (let i = 0; i < 5; i++) {
              const turnDirection = Math.random() < 0.5 ? 1 : -1;
              const randomAngle = (60 + Math.random() * 40) * turnDirection;
              const randomDistance = 80 + Math.random() * 50;

              // Calcola il punto di destinazione
              const angleInRad =
                (selfState.rotation + randomAngle) * (Math.PI / 180);
              const destX = selfState.x + randomDistance * Math.cos(angleInRad);
              const destY = selfState.y + randomDistance * Math.sin(angleInRad);

              if (api.isPositionValid({ x: destX, y: destY })) {
                api.moveTo(destX, destY);
                evasionManeuverSet = true;
                break; // Esci dal loop una volta trovata una manovra valida
              }
            }
            // Se dopo tutti i tentativi non è stata trovata una posizione valida,
            // ruota e avanza per allontanarsi dal nemico.
            if (!evasionManeuverSet) {
              api.sequence([
                { type: "START_ROTATE", payload: { angle: 90 } },
                { type: "START_MOVE", payload: { distance: 70 } },
              ]);
            }
          }
        }
        break;
    }
  },
};

export default DefaultAIBase;
