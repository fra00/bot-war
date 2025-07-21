import { describe, it, expect } from "vitest";
import Robot from "../game/Robot.js";
import Projectile from "../game/Projectile.js";
import Arena from "../game/Arena.js";
import {
  standardArmor,
  standardBattery,
  standardCannon,
  standardMotor,
  standardRadar,
} from "../game/components.js";

describe("Robot API", () => {
  let robot, gameState, arena, api;

  // Helper to set up a clean state for each test
  const setup = (robotConfig = {}, obstacles = []) => {
    arena = new Arena(800, 600);
    arena.obstacles = obstacles;

    gameState = {
      arena: {
        width: arena.width,
        height: arena.height,
        obstacles: arena.obstacles,
      },
      robots: [],
      projectiles: [],
    };

    const playerLoadout = {
      armor: { ...standardArmor },
      cannon: { ...standardCannon },
      battery: { ...standardBattery },
      motor: { ...standardMotor },
      radar: { ...standardRadar },
    };

    robot = new Robot({
      id: "player",
      x: 400,
      y: 300,
      rotation: 0,
      ai: { run: () => {} }, // Mock AI
      ...playerLoadout,
      ...robotConfig,
    });

    gameState.robots.push(robot.getState());
    api = robot.getApi(gameState);
  };

  describe("isObstacleAhead", () => {
    it("should return false when path is clear", () => {
      setup();
      expect(api.isObstacleAhead()).toBe(false);
    });

    it("should return true when facing a wall", () => {
      setup({ x: 780, rotation: 0 }); // Near right wall, facing it
      expect(api.isObstacleAhead()).toBe(true);

      setup({ x: 20, rotation: 180 }); // Near left wall, facing it
      expect(api.isObstacleAhead()).toBe(true);

      setup({ y: 20, rotation: -90 }); // Near top wall, facing it
      expect(api.isObstacleAhead()).toBe(true);

      setup({ y: 580, rotation: 90 }); // Near bottom wall, facing it
      expect(api.isObstacleAhead()).toBe(true);
    });

    it("should return true when an obstacle is directly ahead", () => {
      const obstacle = { x: 420, y: 280, width: 40, height: 40 };
      setup({ rotation: 0 }, [obstacle]);
      expect(api.isObstacleAhead()).toBe(true);
    });

    it("should return false when an obstacle is far away", () => {
      const obstacle = { x: 450, y: 280, width: 40, height: 40 };
      setup({ rotation: 0 }, [obstacle]);
      // Default probe distance is 30, obstacle is 50 units away
      expect(api.isObstacleAhead()).toBe(false);
    });

    it("should return true when using a longer probeDistance", () => {
      const obstacle = { x: 450, y: 280, width: 40, height: 40 };
      setup({ rotation: 0 }, [obstacle]);
      // With a probe distance of 60, the obstacle at 50 units away is detected
      expect(api.isObstacleAhead(60)).toBe(true);
    });

    it("should return false when an obstacle is behind", () => {
      // L'ostacolo deve essere interamente dietro al robot.
      // Il suo bordo destro (x + width) deve essere < della posizione x del robot (400).
      const obstacle = { x: 350, y: 280, width: 40, height: 40 }; // 350 + 40 = 390, che è < 400.
      setup({ rotation: 0 }, [obstacle]); // Facing right, obstacle is to the left
      expect(api.isObstacleAhead()).toBe(false);
    });

    it("should return false when an obstacle is to the side", () => {
      const obstacle = { x: 410, y: 330, width: 40, height: 40 };
      setup({ rotation: 0 }, [obstacle]); // Facing right, obstacle is below
      expect(api.isObstacleAhead()).toBe(false);
    });

    it("should detect an obstacle that clips the path at an angle", () => {
      // Il robot è a (400, 300) rivolto a destra (rotazione: 0).
      // La sonda controlla un cerchio con raggio 15 centrato in (430, 300).
      // L'ostacolo è posizionato in modo che il suo angolo entri nel cerchio di collisione futuro,
      // ma non sia direttamente sulla linea centrale del robot.
      const obstacle = { x: 425, y: 310, width: 20, height: 20 };
      setup({ rotation: 0 }, [obstacle]);
      expect(api.isObstacleAhead()).toBe(true);
    });

    it("should not detect an obstacle just outside the path at an angle", () => {
      // L'ostacolo è posizionato appena fuori dal cerchio di collisione futuro del robot.
      // La distanza tra il centro del cerchio (430, 300) e il punto più vicino dell'ostacolo (430, 316)
      // è 16, che è > del raggio del robot (15).
      const obstacle = { x: 430, y: 316, width: 20, height: 20 };
      setup({ rotation: 0 }, [obstacle]);
      expect(api.isObstacleAhead()).toBe(false);
    });
  });

  describe("Action Commands", () => {
    it("should set the nextAction for moveForward", () => {
      setup();
      api.moveForward(2);
      expect(robot.nextAction).toEqual({
        type: "MOVE_FORWARD",
        payload: { speed: 2 },
      });
    });

    it("should set the nextAction for turnLeft", () => {
      setup();
      api.turnLeft(10);
      expect(robot.nextAction).toEqual({
        type: "TURN_LEFT",
        payload: { degrees: 10 },
      });
    });

    it("should set the nextAction for fire", () => {
      setup();
      api.fire();
      expect(robot.nextAction).toEqual({ type: "FIRE", payload: {} });
    });

    it("should only allow one action per tick", () => {
      setup();
      api.moveForward(1);
      api.fire(); // This should be ignored
      expect(robot.nextAction.type).toBe("MOVE_FORWARD");
    });
  });

  describe("isLineOfSightClear", () => {
    const projectileRadius = Projectile.RADIUS;

    it("should return true when path is clear with no obstacles", () => {
      setup({}, []); // Nessun ostacolo
      const start = { x: 100, y: 100 };
      const end = { x: 700, y: 500 };
      expect(api.isLineOfSightClear(start, end, projectileRadius)).toBe(true);
    });

    it("should return false when path is directly blocked by an obstacle", () => {
      // L'ostacolo si trova esattamente sulla linea retta tra start e end
      const obstacle = { x: 390, y: 290, width: 20, height: 20 };
      setup({}, [obstacle]);
      const start = { x: 100, y: 100 };
      const end = { x: 700, y: 500 };
      expect(api.isLineOfSightClear(start, end, projectileRadius)).toBe(false);
    });

    it("should return false for a grazing shot due to projectile radius", () => {
      const start = { x: 100, y: 300 };
      const end = { x: 700, y: 300 };
      // La traiettoria è a y=300. L'ostacolo inizia a y=302.
      // La distanza è 2, che è < del raggio del proiettile (3). Collisione.
      const obstacle = {
        x: 390,
        y: 300 + projectileRadius - 1,
        width: 20,
        height: 20,
      };
      setup({}, [obstacle]);
      expect(api.isLineOfSightClear(start, end, projectileRadius)).toBe(false);
    });

    it("should return true for a near miss", () => {
      const start = { x: 100, y: 300 };
      const end = { x: 700, y: 300 };
      // La traiettoria è a y=300. L'ostacolo inizia a y=304.
      // La distanza è 4, che è > del raggio del proiettile (3). Nessuna collisione.
      const obstacle = {
        x: 390,
        y: 300 + projectileRadius + 1,
        width: 20,
        height: 20,
      };
      setup({}, [obstacle]);
      expect(api.isLineOfSightClear(start, end, projectileRadius)).toBe(true);
    });

    it("should return false if the start point is inside an obstacle", () => {
      const obstacle = { x: 90, y: 90, width: 20, height: 20 };
      setup({}, [obstacle]);
      const start = { x: 100, y: 100 };
      const end = { x: 700, y: 500 };
      // La funzione sottostante projectileIntersectsObstacle controlla i punti di inizio/fine
      expect(api.isLineOfSightClear(start, end, projectileRadius)).toBe(false);
    });

    // --- Test per la collisione con i muri ---

    it("should return false if start point is too close to a wall (left)", () => {
      setup({}, []); // Nessun ostacolo
      const start = { x: projectileRadius - 1, y: 300 }; // x=2, fuori dall'area sicura
      const end = { x: 700, y: 300 };
      expect(api.isLineOfSightClear(start, end, projectileRadius)).toBe(false);
    });

    it("should return false if end point is too close to a wall (right)", () => {
      setup({}, []);
      const start = { x: 100, y: 300 };
      const end = { x: 800 - projectileRadius + 1, y: 300 }; // x=798, fuori dall'area sicura
      expect(api.isLineOfSightClear(start, end, projectileRadius)).toBe(false);
    });

    it("should return false if start point is too close to a wall (top)", () => {
      setup({}, []);
      const start = { x: 100, y: projectileRadius - 1 }; // y=2, fuori dall'area sicura
      const end = { x: 700, y: 500 };
      expect(api.isLineOfSightClear(start, end, projectileRadius)).toBe(false);
    });

    it("should return false if end point is too close to a wall (bottom)", () => {
      setup({}, []);
      const start = { x: 100, y: 300 };
      const end = { x: 700, y: 600 - projectileRadius + 1 }; // y=598, fuori dall'area sicura
      expect(api.isLineOfSightClear(start, end, projectileRadius)).toBe(false);
    });

    it("should return true if path is very close to a wall but still valid", () => {
      setup({}, []);
      const start = { x: projectileRadius, y: 300 }; // Esattamente sul bordo dell'area sicura
      const end = { x: 800 - projectileRadius, y: 300 }; // Esattamente sul bordo opposto
      expect(api.isLineOfSightClear(start, end, projectileRadius)).toBe(true);
    });
  });

  describe("getEvents", () => {
    it("should return an empty array when there are no events", () => {
      setup();
      gameState.events = [];
      api = robot.getApi(gameState); // Ricarica l'API con il gameState aggiornato
      expect(api.getEvents()).toEqual([]);
    });

    it("should return events where the robot is the owner", () => {
      setup();
      const event = { type: "PROJECTILE_HIT_WALL", ownerId: "player" };
      gameState.events = [event];
      api = robot.getApi(gameState);
      expect(api.getEvents()).toEqual([event]);
    });

    it("should return events where the robot is the target", () => {
      setup();
      const event = { type: "PROJECTILE_HIT_ROBOT", ownerId: "opponent", targetId: "player" };
      gameState.events = [event];
      api = robot.getApi(gameState);
      expect(api.getEvents()).toEqual([event]);
    });

    it("should not return events that do not involve the robot", () => {
      setup();
      const event = { type: "PROJECTILE_HIT_ROBOT", ownerId: "opponent", targetId: "other" };
      gameState.events = [event];
      api = robot.getApi(gameState);
      expect(api.getEvents()).toEqual([]);
    });

    it("should filter and return only relevant events from a mixed list", () => {
      setup();
      const relevantEvent1 = { type: "PROJECTILE_HIT_ROBOT", ownerId: "opponent", targetId: "player" };
      const irrelevantEvent = { type: "PROJECTILE_HIT_WALL", ownerId: "opponent" };
      const relevantEvent2 = { type: "PROJECTILE_HIT_OBSTACLE", ownerId: "player" };
      gameState.events = [relevantEvent1, irrelevantEvent, relevantEvent2];
      api = robot.getApi(gameState);
      expect(api.getEvents()).toEqual([relevantEvent1, relevantEvent2]);
    });
  });

  describe("scan", () => {
    it("should return null if no other robot is present", () => {
      setup();
      // Lo stato del gioco in setup contiene solo il robot del giocatore
      const realGameState = { ...gameState, robots: [robot.getState()] };
      api = robot.getApi(realGameState);
      expect(api.scan()).toBeNull();
    });

    it("should return enemy data if within radar range", () => {
      setup(); // Il robot è a 400, 300
      const enemyState = { id: "opponent", x: 500, y: 300 }; // Distanza 100
      robot.radar.range = 200; // Il nemico è all'interno del raggio

      const realGameState = { ...gameState, robots: [robot.getState(), enemyState] };
      api = robot.getApi(realGameState);

      const scanResult = api.scan();
      expect(scanResult).not.toBeNull();
      expect(scanResult.distance).toBeCloseTo(100);
    });

    it("should return null if enemy is outside radar range", () => {
      setup(); // Il robot è a 400, 300
      const enemyState = { id: "opponent", x: 800, y: 300 }; // Distanza 400
      robot.radar.range = 200; // Il nemico è fuori dal raggio

      const realGameState = { ...gameState, robots: [robot.getState(), enemyState] };
      api = robot.getApi(realGameState);
      expect(api.scan()).toBeNull();
    });
  });
});
