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

describe("Robot API - Line of Sight", () => {
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

  it("should return true when path is clear with no obstacles", () => {
    setup({ x: 100, y: 300 }, { x: 700, y: 300 }, []); // Nessun ostacolo
    const targetPosition = { x: 700, y: 300 };
    expect(api.isLineOfSightClear(targetPosition)).toBe(true);
  });

  it("should return false when an obstacle is between the robot and the target", () => {
    const obstacle = { x: 390, y: 290, width: 20, height: 20 };
    setup({ x: 100, y: 300 }, { x: 700, y: 300 }, [obstacle]);
    const targetPosition = { x: 700, y: 300 };
    expect(api.isLineOfSightClear(targetPosition)).toBe(false);
  });

  it("should return true when an obstacle is BEHIND the target", () => {
    const obstacle = { x: 600, y: 290, width: 20, height: 20 };
    setup({ x: 100, y: 300 }, { x: 400, y: 300 }, [obstacle]);
    const targetPosition = { x: 400, y: 300 };
    expect(api.isLineOfSightClear(targetPosition)).toBe(true);
  });

  it("should return false for a grazing shot between robot and target", () => {
    const projectileRadius = standardCannon.projectileRadius;
    const obstacle = {
      x: 390,
      y: 300 + projectileRadius - 1,
      width: 20,
      height: 20,
    };
    setup({ x: 100, y: 300 }, { x: 700, y: 300 }, [obstacle]);
    const targetPosition = { x: 700, y: 300 };
    expect(api.isLineOfSightClear(targetPosition)).toBe(false);
  });

  it("should return true for a near miss between robot and target", () => {
    const projectileRadius = standardCannon.projectileRadius;
    const obstacle = {
      x: 390,
      y: 300 + projectileRadius + 1,
      width: 20,
      height: 20,
    };
    setup({ x: 100, y: 300 }, { x: 700, y: 300 }, [obstacle]);
    const targetPosition = { x: 700, y: 300 };
    expect(api.isLineOfSightClear(targetPosition)).toBe(true);
  });

  it("should return false for a diagonal shot blocked by an obstacle", () => {
    const obstacle = { x: 390, y: 390, width: 20, height: 20 };
    setup({ x: 100, y: 100 }, {}, [obstacle]);
    const targetPosition = { x: 700, y: 700 };
    expect(api.isLineOfSightClear(targetPosition)).toBe(false);
  });

  it("should return true for a diagonal shot not blocked by an obstacle", () => {
    const obstacle = { x: 390, y: 450, width: 20, height: 20 };
    setup({ x: 100, y: 100 }, {}, [obstacle]);
    const targetPosition = { x: 700, y: 700 };
    expect(api.isLineOfSightClear(targetPosition)).toBe(true);
  });

  it("should return false when the line of sight touches the corner of an obstacle", () => {
    // The line is y = x. The obstacle corner is at (200, 200).
    // The line segment from (100, 100) to (300, 300) passes through (200, 200).
    // The distance from the center of the projectile to the corner is 0, which is < radius.
    const obstacle = { x: 200, y: 200, width: 20, height: 20 };
    setup({ x: 100, y: 100 }, {}, [obstacle]);
    const targetPosition = { x: 300, y: 300 };
    expect(api.isLineOfSightClear(targetPosition)).toBe(false);
  });

  it("should return false when the robot is inside an obstacle", () => {
    const obstacle = { x: 390, y: 290, width: 20, height: 20 };
    // Robot at (400, 300) is inside the obstacle
    setup({ x: 400, y: 300 }, {}, [obstacle]);
    const targetPosition = { x: 700, y: 300 };
    expect(api.isLineOfSightClear(targetPosition)).toBe(false);
  });

  it("should return false when the target is inside an obstacle", () => {
    const obstacle = { x: 690, y: 290, width: 20, height: 20 };
    setup({ x: 100, y: 300 }, {}, [obstacle]);
    // Target at (700, 300) is inside the obstacle
    const targetPosition = { x: 700, y: 300 };
    expect(api.isLineOfSightClear(targetPosition)).toBe(false);
  });

  it("should return false when the path lies along the edge of an obstacle", () => {
    // The path is at y=300. The obstacle's top edge is at y=300.
    // The distance from the projectile's center to the edge is 0, which is < radius.
    const obstacle = { x: 200, y: 300, width: 200, height: 20 };
    setup({ x: 100, y: 300 }, {}, [obstacle]);
    const targetPosition = { x: 500, y: 300 };
    expect(api.isLineOfSightClear(targetPosition)).toBe(false);
  });
});