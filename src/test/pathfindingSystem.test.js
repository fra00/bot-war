import { describe, it, expect } from "vitest";
import { createNavigationGrid } from "../game/systems/navigationGrid.js";
import { findPath } from "../game/systems/pathfindingSystem.js";
import Robot from "../game/Robot.js";
import Arena from "../game/Arena.js";
import * as components from "../game/components.js";

describe("Pathfinding System", () => {
  // Mock Arena and Robot for grid/pathfinding tests
  const mockArena = {
    width: 300, // 10 cells
    height: 300, // 10 cells
    obstacles: [],
  };
  const robotRadius = Robot.RADIUS; // 15
  const CELL_SIZE = robotRadius * 2; // 30

  describe("createNavigationGrid", () => {
    it("should create a grid with correct dimensions", () => {
      const grid = createNavigationGrid(mockArena, robotRadius);
      expect(grid.length).toBe(10); // height / CELL_SIZE
      expect(grid[0].length).toBe(10); // width / CELL_SIZE
    });

    it("should mark cells as unwalkable if they contain an obstacle", () => {
      const arenaWithObstacle = {
        ...mockArena,
        // Obstacle at world coords (100, 100) with size (40, 40)
        // This should block grid cells around (3, 3)
        obstacles: [{ x: 100, y: 100, width: 40, height: 40 }],
      };
      const grid = createNavigationGrid(arenaWithObstacle, robotRadius);

      // Cell (3,3) world center is (105, 105), which is inside the obstacle
      expect(grid[3][3].walkable).toBe(false);
      // Cell (4,4) world center is (135, 135), which is also inside
      expect(grid[4][4].walkable).toBe(false);
      // Cell (0,0) should be walkable
      expect(grid[0][0].walkable).toBe(true);
    });

    it("should mark cells near walls as unwalkable", () => {
      // In a 300x300 arena, cell (0,0) at world (15,15) is valid as the robot (radius 15) just touches the walls.
      const grid = createNavigationGrid(mockArena, robotRadius);
      expect(grid[0][0].walkable).toBe(true);

      // In a smaller arena, the first cell might be invalid
      const smallArena = { ...mockArena, width: 29, height: 29 };
      const smallGrid = createNavigationGrid(smallArena, robotRadius);
      // The only cell (0,0) at world (14.5, 14.5) is invalid because radius 15 would go outside.
      expect(smallGrid[0][0].walkable).toBe(false);
    });
  });

  describe("findPath (A*)", () => {
    it("should find a simple straight path in an empty grid", () => {
      const grid = createNavigationGrid(mockArena, robotRadius);
      const start = { x: 1, y: 1 };
      const end = { x: 8, y: 1 };
      const path = findPath(grid, start, end);
      expect(path).not.toBeNull();
      expect(path.length).toBe(8); // (1,1) -> (2,1) -> ... -> (8,1)
      expect(path[0]).toEqual(start);
      expect(path[path.length - 1]).toEqual(end);
    });

    it("should find a path around an obstacle", () => {
      const arenaWithObstacle = {
        ...mockArena,
        // A vertical wall of obstacles
        obstacles: [{ x: 150, y: 0, width: 30, height: 200 }],
      };
      const grid = createNavigationGrid(arenaWithObstacle, robotRadius);
      // The obstacle should block column x=5 for y=0 to y=6
      const start = { x: 1, y: 3 };
      const end = { x: 8, y: 3 };
      const path = findPath(grid, start, end);

      expect(path).not.toBeNull();
      // The path should not go through the unwalkable cells
      const goesThroughObstacle = path.some(
        (node) => !grid[node.y][node.x].walkable
      );
      expect(goesThroughObstacle).toBe(false);
    });

    it("should return null if no path exists", () => {
      const arenaWithObstacle = {
        ...mockArena,
        // A wall that blocks the entire width
        obstacles: [{ x: 150, y: 0, width: 30, height: 300 }],
      };
      const grid = createNavigationGrid(arenaWithObstacle, robotRadius);
      const start = { x: 1, y: 3 };
      const end = { x: 8, y: 3 };
      const path = findPath(grid, start, end);
      expect(path).toBeNull();
    });
  });

  describe("api.moveTo integration", () => {
    let robot, gameState, api;

    const setup = (robotConfig = {}, obstacles = []) => {
      const arena = new Arena(300, 300);
      arena.obstacles = obstacles;

      const playerLoadout = {
        armor: { ...components.standardArmor },
        cannon: { ...components.standardCannon },
        battery: { ...components.standardBattery },
        motor: { ...components.standardMotor },
        radar: { ...components.standardRadar },
      };

      robot = new Robot({
        id: "player",
        x: 45, // Grid cell (1, 1)
        y: 45,
        rotation: 0,
        ai: { run: () => {} },
        ...playerLoadout,
        ...robotConfig,
      });

      gameState = {
        arena: {
          width: arena.width,
          height: arena.height,
          obstacles: arena.obstacles,
        },
        robots: [robot.getState()],
        events: [],
        projectiles: [],
      };

      api = robot.getApi(gameState);
    };

    it("should queue commands to navigate around an obstacle", () => {
      const obstacle = { x: 150, y: 0, width: 30, height: 200 };
      setup({}, [obstacle]);

      // Target is at (255, 45), which is grid cell (8, 1)
      // Start is at (45, 45), which is grid cell (1, 1)
      // Obstacle blocks column 5. The path must go around.
      api.moveTo(255, 45);

      expect(robot.nextActions.length).toBeGreaterThan(2); // Should be more than a simple rotate+move
      const rotateActions = robot.nextActions.filter(
        (a) => a.type === "START_ROTATE"
      );

      // The path will not be a straight line, so there must be at least one rotation command.
      expect(rotateActions.length).toBeGreaterThan(0);
    });
  });
});
