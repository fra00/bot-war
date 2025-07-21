const initialPlayerCode = `// IA "Cacciatore Tattico" con stato.
// Questo codice definisce un oggetto che verrà usato per controllare il tuo bot.
// L'oggetto deve avere un metodo 'run(api)'.
// Puoi aggiungere altre proprietà all'oggetto per mantenere uno stato tra i tick.
//
// API disponibili:
// api.moveForward(speed)
// api.turnLeft(degrees)
// api.turnRight(degrees)
// api.fire()
// api.scan() -> { distance, angle, x, y } | null
// api.getState() -> { x, y, rotation, hp, energy }
// api.getArenaDimensions() -> { width, height, obstacles }

({
  // --- Costanti per il bilanciamento del comportamento ---
  EVASION_TICKS: 12, // Per quanti tick dura la manovra evasiva
  EVASION_TURN_ANGLE: 90, // Di quanti gradi gira quando schiva
  EVASION_BACKWARD_SPEED: -3, // Velocità di arretramento durante la schivata

  PROJECTILE_MAX_RANGE: 450, // Portata massima dei proiettili (da components.js)
  AGGRESSIVE_DISTANCE: 350, // Distanza sopra la quale si avvicina
  SAFE_DISTANCE: 150, // Distanza sotto la quale si allontana

  AGGRESSIVE_SPEED: 3, // Velocità di avvicinamento
  RETREAT_SPEED: -2.5, // Velocità di arretramento

  SEARCH_SPEED: 1.5, // Velocità durante la ricerca
  SEARCH_TURN_ANGLE: 5, // Angolo di virata durante la ricerca

  // Costanti per l'evitamento degli ostacoli
  AVOIDANCE_PROBE_DISTANCE: 40,
  AVOIDANCE_TURN_ANGLE: 30,
  ROBOT_RADIUS: 15,
  PROJECTILE_RADIUS: 3,

  // Stato interno per gestire le manovre.
  isEvading: false,
  evadeCounter: 0,
  evadeDirection: 1,
  isAvoiding: false,
  avoidanceTurnDirection: 1,
  isRepositioning: false,
  repositionDirection: 1,

  /**
   * @param {Object} api - L'API del robot per interagire con il gioco.
   */
  run: function (api) {
    const myState = api.getState();
    const events = api.getEvents();

    // Usa il sistema di eventi per rilevare se è stato colpito.
    const wasHit = events.some((e) => e.type === "PROJECTILE_HIT_ROBOT");

    // Usa l'API per controllare gli ostacoli, invece di una funzione interna.
    const pathIsClear = !api.isObstacleAhead(this.AVOIDANCE_PROBE_DISTANCE);

    if (this.isAvoiding) {
      if (pathIsClear) {
        this.isAvoiding = false;
      } else {
        if (this.avoidanceTurnDirection > 0) {
          api.turnRight(this.AVOIDANCE_TURN_ANGLE);
        } else {
          api.turnLeft(this.AVOIDANCE_TURN_ANGLE);
        }
        return;
      }
    } else if (!pathIsClear && !this.isEvading) {
      this.isAvoiding = true;
      this.avoidanceTurnDirection = Math.random() < 0.5 ? 1 : -1;
      if (this.avoidanceTurnDirection > 0) {
        api.turnRight(this.AVOIDANCE_TURN_ANGLE);
      } else {
        api.turnLeft(this.AVOIDANCE_TURN_ANGLE);
      }
      return;
    }

    if (wasHit && !this.isEvading) {
      this.isEvading = true;
      this.evadeCounter = this.EVASION_TICKS;
      this.evadeDirection = Math.random() < 0.5 ? 1 : -1;
    }

    if (this.isEvading) {
      if (this.evadeDirection !== 0) {
        api.turnRight(this.EVASION_TURN_ANGLE * this.evadeDirection);
        this.evadeDirection = 0;
      } else {
        api.moveForward(this.EVASION_BACKWARD_SPEED);
      }

      this.evadeCounter--;
      if (this.evadeCounter <= 0) this.isEvading = false;
      return;
    }

    const scan = api.scan();

    if (scan) {
      const targetAngle = scan.angle;
      const targetDistance = scan.distance;
      const normalizedAngle =
        targetAngle > 180 ? targetAngle - 360 : targetAngle;

      const absoluteAngleToEnemy = (myState.rotation + normalizedAngle) * (Math.PI / 180);
      const enemyX = myState.x + targetDistance * Math.cos(absoluteAngleToEnemy);
      const enemyY = myState.y + targetDistance * Math.sin(absoluteAngleToEnemy);

      const lineOfSightClear = api.isLineOfSightClear( // Usa la funzione corretta dall'API
        myState,
        { x: enemyX, y: enemyY },
        this.PROJECTILE_RADIUS
      );

      if (!lineOfSightClear) {
        this.isRepositioning = true;
        this.repositionDirection = Math.random() < 0.5 ? 1 : -1;
      } else if (this.isRepositioning) {
        this.isRepositioning = false;
      }

      if (this.isRepositioning) {
        api.turnRight(45 * this.repositionDirection);
        api.moveForward(this.AGGRESSIVE_SPEED);
        return;
      }

      if (normalizedAngle > 1) {
        api.turnRight(Math.abs(normalizedAngle * 0.5));
      } else if (normalizedAngle < -1) {
        api.turnLeft(Math.abs(normalizedAngle * 0.5));
      }

      const fireTolerance = targetDistance < this.SAFE_DISTANCE ? 10 : 5;
      if (targetDistance < this.PROJECTILE_MAX_RANGE) {
        if (Math.abs(normalizedAngle) < fireTolerance) {
          api.fire();
        }
      }

      if (targetDistance > this.AGGRESSIVE_DISTANCE) {
        api.moveForward(this.AGGRESSIVE_SPEED);
      } else if (targetDistance < this.SAFE_DISTANCE) {
        api.moveForward(this.RETREAT_SPEED);
      }
    } else {
      api.moveForward(this.SEARCH_SPEED);
      api.turnRight(this.SEARCH_TURN_ANGLE);
    }
  },
})
`;

export default initialPlayerCode;