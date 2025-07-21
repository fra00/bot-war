/**
 * IA "Cacciatore Tattico" con manovre evasive.
 * Coordina mira, movimento e fuoco, e schiva quando viene colpito.
 */
const DefaultAI = {
  // --- Costanti per il bilanciamento del comportamento ---
  EVASION_TICKS: 12, // Per quanti tick dura la manovra evasiva
  EVASION_TURN_ANGLE: 90, // Di quanti gradi gira quando schiva
  EVASION_BACKWARD_SPEED: -3, // Velocità di arretramento durante la schivata

  PROJECTILE_MAX_RANGE: 400, // Portata massima dei proiettili (dovrebbe corrispondere a Projectile.js)
  AGGRESSIVE_DISTANCE: 350, // Distanza sopra la quale si avvicina
  SAFE_DISTANCE: 60, // Distanza sotto la quale si allontana

  AGGRESSIVE_SPEED: 3, // Velocità di avvicinamento
  RETREAT_SPEED: -2.5, // Velocità di arretramento

  SEARCH_SPEED: 1.5, // Velocità durante la ricerca
  SEARCH_TURN_ANGLE: 5, // Angolo di virata durante la ricerca

  // Costanti per l'evitamento degli ostacoli
  AVOIDANCE_PROBE_DISTANCE: 40, // Distanza in avanti per controllare la presenza di ostacoli
  AVOIDANCE_TURN_ANGLE: 30, // Angolo di virata per evitare un ostacolo
  ROBOT_RADIUS: 15, // Raggio di collisione del robot

  // Stato interno per gestire le manovre evasive.
  isEvading: false,
  evadeCounter: 0,
  evadeDirection: 1,
  lastEvadeDirection: 0, // Per tenere traccia della direzione dell'ultima evasione
  // Stato per la manovra di evitamento ostacoli
  isAvoiding: false,
  avoidanceCounter: 0,
  // Stato per il riposizionamento tattico
  isRepositioning: false,
  repositionDirection: 1,
  lineOfSightClear: true, // linea di tiro chiara inizialmente
  // Stato per l'ultima posizione nota del nemico
  lastKnownEnemyPosition: null,

  /**
   * @param {Object} api - L'API del robot per interagire con il gioco.
   */
  run: function (api) {
    // Usa 'function' per accedere a 'this'
    const myState = api.getState();
    const events = api.getEvents();

    // --- Logica Normale (Cacciatore Tattico) ---
    const scan = api.scan();
    const targetAngle = scan?.angle;
    const targetDistance = scan?.distance;
    const normalizedAngle =
      targetAngle != null
        ? targetAngle > 180
          ? targetAngle - 360
          : targetAngle
        : null;

    // Controlla se il robot è stato colpito usando il sistema di eventi.
    const wasHit = events.some((e) => e.type === "PROJECTILE_HIT_ROBOT");

    // --- controllo ostacolo ---
    const hasObstacle = api.isObstacleAhead(this.AVOIDANCE_PROBE_DISTANCE);
    if (hasObstacle && !this.isAvoiding) {
      api.turnRight(this.EVASION_TURN_ANGLE);
      this.isAvoiding = true;
      return;
    }
    if (this.isAvoiding && this.avoidanceCounter < 30) {
      api.moveForward(this.AGGRESSIVE_SPEED);
      this.avoidanceCounter++;
    }
    if (this.avoidanceCounter >= 30) {
      this.isAvoiding = false;
      this.avoidanceCounter = 0;
      return; // Esce dalla funzione per evitare ulteriori azioni
    }

    // --- Logica di Manovra Evasiva ---
    // Se viene colpito e non sta già schivando, inizia una manovra evasiva.
    if ((!this.lineOfSightClear || wasHit) && !this.isEvading) {
      this.isEvading = true;
      this.evadeCounter = this.EVASION_TICKS;
      // Scegli una direzione di schivata casuale (destra o sinistra)
      this.evadeDirection =
        this.lastEvadeDirection !== 0
          ? this.lastEvadeDirection
          : Math.random() < 0.5
          ? 1
          : -1;
      this.lastEvadeDirection = this.evadeDirection; // Aggiorna la direzione dell'ultima evasione
      this.lineOfSightClear = false; // Imposta la visibilità a falsa per evitare di sparare durante l'evasione
    }

    if (this.isEvading) {
      // La manovra evasiva è una sequenza: prima gira, poi arretra.
      // Usiamo evadeDirection per eseguire la virata solo il primo tick.
      if (this.evadeDirection !== 0) {
        // Primo tick di evasione: gira.
        if (this.evadeDirection > 0) {
          api.turnRight(this.EVASION_TURN_ANGLE);
        } else {
          api.turnLeft(this.EVASION_TURN_ANGLE);
        }
        // Imposta a 0 per assicurarsi che i prossimi tick eseguano solo il movimento.
        this.evadeDirection = 0;
        this.lineOfSightClear = true; // Reset della visibilità
      } else {
        // Tick successivi: arretra per creare distanza.
        api.moveForward(this.EVASION_BACKWARD_SPEED);
      }

      this.evadeCounter--;
      if (this.evadeCounter <= 0) {
        this.isEvading = false;
        this.evadeCounter = 0;
      }
      return; // Salta la logica normale durante l'evasione
    } else {
      this.lastEvadeDirection = 0; // Reset della direzione di evasione
    }

    if (normalizedAngle) {
      // --- 1. Aggiorna l'ultima posizione nota del nemico ---
      // Calcoliamo le coordinate assolute del nemico e le salviamo.
      const absoluteAngleToEnemy =
        (myState.rotation + normalizedAngle) * (Math.PI / 180);
      const enemyX =
        myState.x + targetDistance * Math.cos(absoluteAngleToEnemy);
      const enemyY =
        myState.y + targetDistance * Math.sin(absoluteAngleToEnemy);
      this.lastKnownEnemyPosition = { x: enemyX, y: enemyY };

      if (normalizedAngle > 1) {
        api.turnRight(Math.abs(normalizedAngle * 0.5));
      } else if (normalizedAngle < -1) {
        api.turnLeft(Math.abs(normalizedAngle * 0.5));
      }

      // --- 3. Posizionamento strategico basato sulla portata ---
      const fireTolerance = targetDistance < this.SAFE_DISTANCE ? 10 : 5;

      // Se il nemico è a portata di tiro, spara.
      if (targetDistance < this.PROJECTILE_MAX_RANGE) {
        if (Math.abs(normalizedAngle) < fireTolerance) {
          const absoluteAngleToEnemy =
            (myState.rotation + normalizedAngle) * (Math.PI / 180);
          const endX =
            myState.x +
            this.PROJECTILE_MAX_RANGE * Math.cos(absoluteAngleToEnemy);
          const endY =
            myState.y +
            this.PROJECTILE_MAX_RANGE * Math.sin(absoluteAngleToEnemy);

          this.lineOfSightClear = api.isLineOfSightClear(
            { x: myState.x, y: myState.y },
            { x: endX, y: endY },
            3 // Projectile.RADIUS
          );

          if (this.lineOfSightClear) {
            api.fire();
          }
        }
      }

      if (targetDistance > this.AGGRESSIVE_DISTANCE) {
        // Se il nemico è quasi fuori portata o fuori portata, avvicinati aggressivamente.
        api.moveForward(this.AGGRESSIVE_SPEED);
      } else if (targetDistance < this.SAFE_DISTANCE) {
        // Se è troppo vicino, allontanati per mantenere la distanza di sicurezza.
        api.moveForward(this.RETREAT_SPEED);
      }
    } else if (this.lastKnownEnemyPosition) {
      // --- Logica di Ricerca Intelligente: vai verso l'ultima posizione nota ---
      const dx = this.lastKnownEnemyPosition.x - myState.x;
      const dy = this.lastKnownEnemyPosition.y - myState.y;
      const distanceToLastPosition = Math.sqrt(dx * dx + dy * dy);

      // Se siamo abbastanza vicini, considera la posizione raggiunta e torna a cercare.
      if (distanceToLastPosition < 20) {
        this.lastKnownEnemyPosition = null; // Resetta la posizione
        api.turnRight(this.SEARCH_TURN_ANGLE * 4); // Gira per cercare di nuovo
      } else {
        // Altrimenti, muoviti verso l'ultima posizione nota.
        const angleToTarget = Math.atan2(dy, dx) * (180 / Math.PI);
        let relativeAngle = angleToTarget - myState.rotation;

        while (relativeAngle <= -180) relativeAngle += 360;
        while (relativeAngle > 180) relativeAngle -= 360;

        if (relativeAngle > 1) {
          api.turnRight(Math.min(relativeAngle, this.SEARCH_TURN_ANGLE * 2));
        } else if (relativeAngle < -1) {
          api.turnLeft(
            Math.min(Math.abs(relativeAngle), this.SEARCH_TURN_ANGLE * 2)
          );
        }
        api.moveForward(this.SEARCH_SPEED);
      }
    } else {
      // --- Logica di Ricerca di Base: vai verso il centro dell'arena ---
      const arena = api.getArenaDimensions();
      const centerX = arena.width / 2;
      const centerY = arena.height / 2;
      const dx = centerX - myState.x;
      const dy = centerY - myState.y;
      if (Math.sqrt(dx * dx + dy * dy) < 50) {
        api.turnRight(this.SEARCH_TURN_ANGLE * 2);
        return;
      }
      const angleToCenter = Math.atan2(dy, dx) * (180 / Math.PI);
      let relativeAngle = angleToCenter - myState.rotation;
      while (relativeAngle <= -180) relativeAngle += 360;
      while (relativeAngle > 180) relativeAngle -= 360;
      if (relativeAngle > 1) {
        api.turnRight(Math.min(relativeAngle, this.SEARCH_TURN_ANGLE * 2));
      } else if (relativeAngle < -1) {
        api.turnLeft(
          Math.min(Math.abs(relativeAngle), this.SEARCH_TURN_ANGLE * 2)
        );
      }
      api.moveForward(this.SEARCH_SPEED);
    }
  },
};

export default DefaultAI;
