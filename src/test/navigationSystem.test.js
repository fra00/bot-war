import { describe, it, expect } from "vitest";
import {
  generateAimCommand,
  generateCommandsForPath,
} from "../game/systems/navigationSystem.js";

describe("Navigation System", () => {
  describe("generateAimCommand", () => {
    const startPosition = { x: 0, y: 0 };
    const speedPercentage = 100;

    it("should return a rotate command to aim right", () => {
      const startRotation = 90; // Facing up
      const targetPosition = { x: 10, y: 0 }; // Target is to the right
      const command = generateAimCommand(
        startPosition,
        startRotation,
        targetPosition,
        speedPercentage
      );
      expect(command).toEqual({
        type: "START_ROTATE",
        payload: { angle: -90, speedPercentage: 100 },
      });
    });

    it("should return a rotate command to aim up", () => {
      const startRotation = 0; // Facing right
      const targetPosition = { x: 0, y: 10 }; // Target is up
      const command = generateAimCommand(
        startPosition,
        startRotation,
        targetPosition,
        speedPercentage
      );
      expect(command).toEqual({
        type: "START_ROTATE",
        payload: { angle: 90, speedPercentage: 100 },
      });
    });

    it("should return null if already aimed correctly", () => {
      const startRotation = 45;
      const targetPosition = { x: 10, y: 10 }; // Target is at 45 degrees
      const command = generateAimCommand(
        startPosition,
        startRotation,
        targetPosition,
        speedPercentage
      );
      expect(command).toBeNull();
    });

    it("should calculate the shortest turn angle (e.g., 350deg to 10deg is +20deg)", () => {
      const startRotation = 350;
      const targetPosition = { x: 10, y: Math.tan((10 * Math.PI) / 180) * 10 }; // Target at 10 degrees
      const command = generateAimCommand(
        startPosition,
        startRotation,
        targetPosition,
        speedPercentage
      );
      expect(command.payload.angle).toBeCloseTo(20);
    });

    it("should calculate the shortest turn angle (e.g., 10deg to 350deg is -20deg)", () => {
      const startRotation = 10;
      const targetPosition = { x: 10, y: Math.tan((350 * Math.PI) / 180) * 10 }; // Target at 350 degrees
      const command = generateAimCommand(
        startPosition,
        startRotation,
        targetPosition,
        speedPercentage
      );
      expect(command.payload.angle).toBeCloseTo(-20);
    });

    it("should pass the correct speed percentage", () => {
      const startRotation = 0;
      const targetPosition = { x: 0, y: 10 };
      const command = generateAimCommand(
        startPosition,
        startRotation,
        targetPosition,
        75 // Custom speed
      );
      expect(command.payload.speedPercentage).toBe(75);
    });
  });

  describe("generateCommandsForPath", () => {
    const startPosition = { x: 15, y: 15 }; // Center of cell (0,0)
    const cellSize = 30;
    const speedPercentage = 100;

    it("should return an empty array for an empty or single-node path", () => {
      expect(generateCommandsForPath([], startPosition, 0, cellSize, speedPercentage)).toEqual([]);
      const singleNodePath = [{ x: 0, y: 0 }];
      expect(
        generateCommandsForPath(
          singleNodePath,
          startPosition,
          0,
          cellSize,
          speedPercentage
        )
      ).toEqual([]);
    });

    it("should generate a rotate and move command for a straight path if not aligned", () => {
      const path = [{ x: 1, y: 0 }]; // Move from (0,0) to (1,0)
      const commands = generateCommandsForPath(
        path,
        { x: 15, y: 15 },
        90,
        cellSize,
        speedPercentage
      );
      // Target is (45, 15). Angle is 0. Need to rotate -90 degrees.
      expect(commands.length).toBe(2);
      expect(commands[0].type).toBe("START_ROTATE");
      expect(commands[0].payload.angle).toBeCloseTo(-90);
      expect(commands[1].type).toBe("START_MOVE");
      expect(commands[1].payload.distance).toBeCloseTo(30);
    });

    it("should generate a sequence of commands for an L-shaped path", () => {
      const path = [
        { x: 1, y: 0 }, // Move right
        { x: 1, y: 1 }, // Move down
      ];
      const commands = generateCommandsForPath(
        path,
        { x: 15, y: 15 },
        90,
        cellSize,
        speedPercentage
      );

      // 1. To node (1,0) at world (45, 15). Angle is 0. Current rotation is 90. Rotate -90.
      // 2. Move 30.
      // 3. To node (1,1) at world (45, 45). Angle is 90. Current rotation is 0. Rotate +90.
      // 4. Move 30.

      expect(commands.length).toBe(4);
      expect(commands[0].type).toBe("START_ROTATE");
      expect(commands[0].payload.angle).toBeCloseTo(-90);
      expect(commands[1].type).toBe("START_MOVE");
      expect(commands[1].payload.distance).toBeCloseTo(30);
      expect(commands[2].type).toBe("START_ROTATE");
      expect(commands[2].payload.angle).toBeCloseTo(90);
      expect(commands[3].type).toBe("START_MOVE");
      expect(commands[3].payload.distance).toBeCloseTo(30);
    });

    it("should group straight line segments into a single move command", () => {
      // Path: (0,0) -> (1,0) -> (2,0) -> (3,0)
      const path = [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ];
      const commands = generateCommandsForPath(
        path,
        { x: 15, y: 15 }, // Start at cell (0,0)
        90, // Facing up
        cellSize,
        speedPercentage
      );

      // Should rotate once to face right (angle 0), then move 3 cells (90px)
      expect(commands.length).toBe(2);
      expect(commands[0].type).toBe("START_ROTATE");
      expect(commands[0].payload.angle).toBeCloseTo(-90);
      expect(commands[1].type).toBe("START_MOVE");
      expect(commands[1].payload.distance).toBeCloseTo(90);
    });
  });
});
