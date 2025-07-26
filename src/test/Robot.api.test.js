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

describe("Robot API", () => {
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

  describe("Action Commands (Sync and Async)", () => {
    it("should set the nextAction for fire", () => {
      setup();
      api.fire();
      expect(robot.nextActions).toEqual([{ type: "FIRE", payload: {} }]);
    });

    it("should set the nextAction for move", () => {
      setup();
      api.move(150, 80);
      expect(robot.nextActions).toEqual([{
        type: "START_MOVE",
        payload: { distance: 150, speedPercentage: 80 },
      }]);
    });

    it("should set the nextAction for rotate", () => {
      setup();
      api.rotate(-90, 70);
      expect(robot.nextActions).toEqual([{
        type: "START_ROTATE",
        payload: { angle: -90, speedPercentage: 70 },
      }]);
    });

    it("should set the nextAction for stop", () => {
      setup();
      api.stop();
      expect(robot.nextActions).toEqual([{ type: "STOP_ACTION" }]);
    });
  });

  describe("Action Queuing Logic", () => {
    it("should queue multiple actions in the same tick", () => {
      setup();
      api.fire();
      api.rotate(90);
      expect(robot.nextActions.length).toBe(2);
      expect(robot.nextActions[0].type).toBe("FIRE");
      expect(robot.nextActions[1].type).toBe("START_ROTATE");
    });

    it("should allow stop() to override other queued actions for the tick", () => {
      setup();
      api.fire(); // Queue a sync action
      api.move(100);
      api.stop(); // stop() should have priority
      expect(robot.nextActions.length).toBe(1);
      expect(robot.nextActions[0]).toEqual({ type: "STOP_ACTION" });
    });
  });
});
