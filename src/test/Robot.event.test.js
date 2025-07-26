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

describe("Robot API - Event Handling", () => {
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
      const event = { type: "HIT_BY_PROJECTILE", robotId: "player", ownerId: "opponent" };
      gameState.events = [event];
      api = robot.getApi(gameState);
      expect(api.getEvents()).toEqual([event]);
    });

    it("should not return events that do not involve the robot", () => {
      setup();
      const event = { type: "HIT_BY_PROJECTILE", robotId: "opponent", ownerId: "other" };
      gameState.events = [event];
      api = robot.getApi(gameState);
      expect(api.getEvents()).toEqual([]);
    });

    it("should return events where the robot is the subject via robotId", () => {
      setup();
      const event1 = { type: "MOVE_COMPLETED", robotId: "player" };
      const event2 = { type: "ENEMY_DETECTED", robotId: "player" };
      gameState.events = [event1, event2];
      api = robot.getApi(gameState);
      expect(api.getEvents()).toEqual([event1, event2]);
    });

    it("should filter and return only relevant events from a mixed list", () => {
      setup();
      const relevantEvent1 = { type: "HIT_BY_PROJECTILE", robotId: "player", ownerId: "opponent" }; // Relevant
      const irrelevantEvent = { type: "PROJECTILE_HIT_WALL", ownerId: "opponent" };
      const relevantEvent2 = { type: "PROJECTILE_HIT_OBSTACLE", ownerId: "player" }; // Relevant via ownerId
      const relevantEvent3 = { type: "MOVE_COMPLETED", robotId: "player" }; // Relevant via robotId
      const irrelevantEvent2 = { type: "ROTATION_COMPLETED", robotId: "opponent" };

      gameState.events = [relevantEvent1, irrelevantEvent, relevantEvent2, relevantEvent3, irrelevantEvent2];
      api = robot.getApi(gameState);
      expect(api.getEvents()).toEqual([relevantEvent1, relevantEvent2, relevantEvent3]);
    });
  });
});