import { circleIntersectsRectangle } from "../geometryHelpers/index.js";

/**
 * Represents a node in the navigation grid.
 * @typedef {Object} GridNode
 * @property {number} x - The grid x-coordinate.
 * @property {number} y - The grid y-coordinate.
 * @property {boolean} walkable - True if the robot can move through this node.
 */

/**
 * Creates a navigation grid from the arena layout.
 * The grid is used for pathfinding algorithms like A*.
 *
 * @param {import('../Arena.js').default} arena - The game arena.
 * @param {number} robotRadius - The radius of the robot, used for collision checking.
 * @returns {Array<Array<GridNode>>} A 2D array representing the grid.
 */
export function createNavigationGrid(arena, robotRadius) {
  const CELL_SIZE = robotRadius * 2;
  const gridWidth = Math.ceil(arena.width / CELL_SIZE);
  const gridHeight = Math.ceil(arena.height / CELL_SIZE);
  const grid = [];

  for (let y = 0; y < gridHeight; y++) {
    grid[y] = [];
    for (let x = 0; x < gridWidth; x++) {
      const worldX = x * CELL_SIZE + CELL_SIZE / 2;
      const worldY = y * CELL_SIZE + CELL_SIZE / 2;

      const isWalkable = isWorldPositionWalkable({ x: worldX, y: worldY }, robotRadius, arena);

      grid[y][x] = {
        x,
        y,
        walkable: isWalkable,
      };
    }
  }

  return grid;
}

/**
 * Checks if a specific position in the world coordinates is walkable for a robot.
 * A position is walkable if a robot centered there does not collide with walls or obstacles.
 * @param {{x: number, y: number}} position - The world position to check.
 * @param {number} robotRadius - The radius of the robot.
 * @param {import('../Arena.js').default} arena - The game arena.
 * @returns {boolean}
 */
function isWorldPositionWalkable(position, robotRadius, arena) {
  const { width, height, obstacles } = arena;
  const { x, y } = position;

  // Check arena boundaries
  if (
    x - robotRadius < 0 ||
    x + robotRadius > width ||
    y - robotRadius < 0 ||
    y + robotRadius > height
  ) {
    return false;
  }

  // Check for obstacle collisions
  const objectAsCircle = { x, y, radius: robotRadius };
  for (const obstacle of obstacles) {
    if (circleIntersectsRectangle(objectAsCircle, obstacle)) {
      return false;
    }
  }

  return true;
}
