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
import { scanForEnemy } from "../game/systems/perceptionSystem.js";

describe("Robot API - Scan", () => {
  let robot, gameState, arena;

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
  };

  describe("scan", () => {
    it("should return null if no other robot is present", () => {
      setup();
      // Lo stato del gioco in setup contiene solo il robot del giocatore
      const realGameState = { ...gameState, robots: [robot.getState()] };
      // Simula il passaggio di percezione del ciclo di gioco
      robot.lastScanResult = scanForEnemy(robot, realGameState.robots);
      const api = robot.getApi(realGameState);
      expect(api.scan()).toBeNull();
    });

    it("should return enemy data if within radar range", () => {
      setup(); // Il robot è a 400, 300
      const enemyState = { id: "opponent", x: 500, y: 300 }; // Distanza 100
      robot.radar.range = 200; // Il nemico è all'interno del raggio

      const realGameState = { ...gameState, robots: [robot.getState(), enemyState] };
      // Simula il passaggio di percezione del ciclo di gioco
      robot.lastScanResult = scanForEnemy(robot, realGameState.robots);
      const api = robot.getApi(realGameState);

      const scanResult = api.scan();
      expect(scanResult).not.toBeNull();
      expect(scanResult.distance).toBeCloseTo(100);
    });

    it("should return null if enemy is outside radar range", () => {
      setup(); // Il robot è a 400, 300
      const enemyState = { id: "opponent", x: 800, y: 300 }; // Distanza 400
      robot.radar.range = 200; // Il nemico è fuori dal raggio

      const realGameState = { ...gameState, robots: [robot.getState(), enemyState] };
      // Simula il passaggio di percezione del ciclo di gioco
      robot.lastScanResult = scanForEnemy(robot, realGameState.robots);
      const api = robot.getApi(realGameState);
      expect(api.scan()).toBeNull();
    });
  });
});