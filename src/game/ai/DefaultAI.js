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
  SAFE_DISTANCE: 150, // Distanza sotto la quale si allontana

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
  // Stato per la manovra di evitamento ostacoli
  isAvoiding: false,
  avoidanceCounter: 0,
  // Stato per il riposizionamento tattico
  isRepositioning: false,
  repositionDirection: 1,
  lineOfSightClear: true, // linea di tiro chiara inizialmente

  /**
   * @param {Object} api - L'API del robot per interagire con il gioco.
   */
  run: function (api) {
    // Usa 'function' per accedere a 'this'
    const myState = api.getState();
    const events = api.getEvents();

    // --- Logica Normale (Cacciatore Tattico) ---
    const scan = api.scan() ?? {};
    const targetAngle = scan.angle;
    const targetDistance = scan.distance;
    const normalizedAngle = targetAngle > 180 ? targetAngle - 360 : targetAngle;

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
      this.evadeDirection = Math.random() < 0.5 ? 1 : -1;
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
    }

    if (scan) {
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
          const endX = myState.x + this.PROJECTILE_MAX_RANGE * Math.cos(absoluteAngleToEnemy);
          const endY = myState.y + this.PROJECTILE_MAX_RANGE * Math.sin(absoluteAngleToEnemy);

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
    } else {
      // --- Logica di Ricerca ---
      // La vecchia logica anti-muro è stata rimossa, ora gestita dal sistema proattivo.
      api.moveForward(this.SEARCH_SPEED);
      api.turnRight(this.SEARCH_TURN_ANGLE);
    }
  },
};

export default DefaultAI;
