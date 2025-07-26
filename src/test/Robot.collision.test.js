import { describe, it, expect } from "vitest";
import Robot from "../game/Robot.js";
import Arena from "../game/Arena.js";
import {
  standardArmor,
  standardBattery,
  standardCannon,
  standardMotor,
  standardRadar,
} from "../game/components.js";

describe("Robot API - Collision Detection", () => {
  let robot, gameState, arena, api;

  // Helper to set up a clean state for each test
  const setup = (robotConfig = {}, enemyConfig = {}, obstacles = []) => {
    arena = new Arena(800, 600);
    arena.obstacles = obstacles;

    gameState = {
      arena: {
        width: arena.width,
        height: arena.height,
        obstacles: arena.obstacles,
      },
      robots: [],
      events: [],
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

    const enemy = new Robot({
      id: "opponent",
      x: 500,
      y: 300,
      ai: { run: () => {} },
      ...playerLoadout, // Usa lo stesso loadout per semplicità
      ...enemyConfig,
    });

    gameState.robots.push(robot.getState(), enemy.getState());
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
      setup({ rotation: 0 }, {}, [obstacle]);
      expect(api.isObstacleAhead()).toBe(true);
    });

    it("should return false when an obstacle is far away", () => {
      const obstacle = { x: 450, y: 280, width: 40, height: 40 };
      setup({ rotation: 0 }, {}, [obstacle]);
      // Default probe distance is 30, obstacle is 50 units away
      expect(api.isObstacleAhead()).toBe(false);
    });

    it("should return true when using a longer probeDistance", () => {
      const obstacle = { x: 450, y: 280, width: 40, height: 40 };
      setup({ rotation: 0 }, {}, [obstacle]);
      // With a probe distance of 60, the obstacle at 50 units away is detected
      expect(api.isObstacleAhead(60)).toBe(true);
    });

    it("should return false when an obstacle is behind", () => {
      const obstacle = { x: 350, y: 280, width: 40, height: 40 };
      setup({ rotation: 0 }, {}, [obstacle]); // Facing right, obstacle is to the left
      expect(api.isObstacleAhead()).toBe(false);
    });

    it("should return false when an obstacle is to the side", () => {
      const obstacle = { x: 410, y: 330, width: 40, height: 40 };
      setup({ rotation: 0 }, {}, [obstacle]); // Facing right, obstacle is below
      expect(api.isObstacleAhead()).toBe(false);
    });

    it("should detect an obstacle that clips the path at an angle", () => {
      // Il robot è a (400, 300) rivolto a destra (rotazione: 0).
      // La sonda controlla un cerchio con raggio 15 centrato in (430, 300).
      // L'ostacolo è posizionato in modo che il suo angolo entri nel cerchio di collisione futuro,
      // ma non sia direttamente sulla linea centrale del robot.
      const obstacle = { x: 425, y: 310, width: 20, height: 20 };
      setup({ rotation: 0 }, {}, [obstacle]);
      expect(api.isObstacleAhead()).toBe(true);
    });

    it("should not detect an obstacle just outside the path at an angle", () => {
      // L'ostacolo è posizionato appena fuori dal cerchio di collisione futuro del robot.
      // La distanza tra il centro del cerchio (430, 300) e il punto più vicino dell'ostacolo (430, 316)
      // è 16, che è > del raggio del robot (15).
      const obstacle = { x: 430, y: 316, width: 20, height: 20 };
      setup({ rotation: 0 }, {}, [obstacle]);
      expect(api.isObstacleAhead()).toBe(false);
    });

    it("should detect an obstacle when moving diagonally", () => {
      const obstacle = { x: 415, y: 315, width: 20, height: 20 };
      setup({ rotation: 45 }, {}, [obstacle]);
      expect(api.isObstacleAhead()).toBe(true);
    });

    it("should not detect an obstacle behind when moving diagonally", () => {
      const obstacle = { x: 380, y: 280, width: 20, height: 20 };
      setup({ rotation: 45 }, {}, [obstacle]);
      expect(api.isObstacleAhead()).toBe(false);
    });
  });
});