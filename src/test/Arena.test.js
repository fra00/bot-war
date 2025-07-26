import { describe, it, expect } from "vitest";
import Arena from "../game/Arena.js";

describe("Arena", () => {
  describe("generateObstacles", () => {
    const arenaWidth = 800;
    const arenaHeight = 600;
    const safeRadius = 100; // As defined in Arena.js
    const obstacleMargin = 15; // As defined in Arena.js

    it("should generate the requested number of obstacles", () => {
      const arena = new Arena(arenaWidth, arenaHeight);
      const count = 5;
      arena.generateObstacles(count);
      expect(arena.obstacles.length).toBe(count);
    });

    it("should not place obstacles within the safe zones", () => {
      const arena = new Arena(arenaWidth, arenaHeight);
      const safeZones = [
        { x: 100, y: 300 },
        { x: 700, y: 300 },
      ];
      const count = 10; // Generate a good number to test against

      arena.generateObstacles(count, safeZones);

      arena.obstacles.forEach((obstacle) => {
        safeZones.forEach((zone) => {
          // Check the distance from the zone center to the *closest point* on the obstacle.
          const closestX = Math.max(
            obstacle.x,
            Math.min(zone.x, obstacle.x + obstacle.width)
          );
          const closestY = Math.max(
            obstacle.y,
            Math.min(zone.y, obstacle.y + obstacle.height)
          );

          const distance = Math.sqrt(
            (closestX - zone.x) ** 2 + (closestY - zone.y) ** 2
          );

          expect(distance).toBeGreaterThanOrEqual(safeRadius);
        });
      });
    });

    it("should not generate overlapping obstacles", () => {
      const arena = new Arena(arenaWidth, arenaHeight);
      const count = 10;
      arena.generateObstacles(count);

      const { obstacles } = arena;

      for (let i = 0; i < obstacles.length; i++) {
        for (let j = i + 1; j < obstacles.length; j++) {
          const o1 = obstacles[i];
          const o2 = obstacles[j];

          const overlaps =
            o1.x < o2.x + o2.width + obstacleMargin &&
            o1.x + o1.width + obstacleMargin > o2.x &&
            o1.y < o2.y + o2.height + obstacleMargin &&
            o1.y + o1.height + obstacleMargin > o2.y;

          expect(overlaps, `Obstacle ${i} overlaps with ${j}`).toBe(false);
        }
      }
    });

    it("should generate obstacles fully within the arena boundaries", () => {
      const arena = new Arena(arenaWidth, arenaHeight);
      const count = 10;
      arena.generateObstacles(count);

      arena.obstacles.forEach((obstacle) => {
        expect(obstacle.x).toBeGreaterThanOrEqual(0);
        expect(obstacle.y).toBeGreaterThanOrEqual(0);
        expect(obstacle.x + obstacle.width).toBeLessThanOrEqual(arenaWidth);
        expect(obstacle.y + obstacle.height).toBeLessThanOrEqual(arenaHeight);
      });
    });
  });
});