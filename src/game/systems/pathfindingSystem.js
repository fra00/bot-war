/**
 * Calculates the heuristic (Manhattan distance) between two nodes.
 * @param {import('./navigationGrid.js').GridNode} nodeA
 * @param {import('./navigationGrid.js').GridNode} nodeB
 * @returns {number}
 */
function heuristic(nodeA, nodeB) {
  return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
}

/**
 * Gets the walkable neighbors of a node in the grid.
 * @param {Array<Array<import('./navigationGrid.js').GridNode>>} grid
 * @param {import('./navigationGrid.js').GridNode} node
 * @returns {Array<import('./navigationGrid.js').GridNode>}
 */
function getNeighbors(grid, node) {
  const neighbors = [];
  const { x, y } = node;
  const gridHeight = grid.length;
  const gridWidth = grid[0].length;

  // Check top, bottom, left, right
  if (y > 0) neighbors.push(grid[y - 1][x]);
  if (y < gridHeight - 1) neighbors.push(grid[y + 1][x]);
  if (x > 0) neighbors.push(grid[y][x - 1]);
  if (x < gridWidth - 1) neighbors.push(grid[y][x + 1]);

  return neighbors.filter((neighbor) => neighbor.walkable);
}

/**
 * Reconstructs the path from the cameFrom map.
 * @param {Map<Object, Object>} cameFrom
 * @param {import('./navigationGrid.js').GridNode} current
 * @returns {Array<{x: number, y: number}>}
 */
function reconstructPath(cameFrom, current) {
  const totalPath = [{ x: current.x, y: current.y }];
  while (cameFrom.has(current)) {
    current = cameFrom.get(current);
    totalPath.unshift({ x: current.x, y: current.y });
  }
  return totalPath;
}

/**
 * Finds the shortest path between two points on a grid using the A* algorithm.
 *
 * @param {Array<Array<import('./navigationGrid.js').GridNode>>} grid - The navigation grid.
 * @param {{x: number, y: number}} startCoords - The starting grid coordinates.
 * @param {{x: number, y: number}} endCoords - The ending grid coordinates.
 * @returns {Array<{x: number, y: number}> | null} An array of waypoints or null if no path is found.
 */
export function findPath(grid, startCoords, endCoords) {
  const gridHeight = grid.length;
  if (gridHeight === 0) {
    return null;
  }
  const gridWidth = grid[0].length;

  // Controlla che le coordinate di partenza e di arrivo siano all'interno della griglia.
  if (
    startCoords.y < 0 || startCoords.y >= gridHeight ||
    startCoords.x < 0 || startCoords.x >= gridWidth ||
    endCoords.y < 0 || endCoords.y >= gridHeight ||
    endCoords.x < 0 || endCoords.x >= gridWidth
  ) {
    return null; // Coordinate fuori dai limiti della griglia.
  }

  const startNode = grid[startCoords.y][startCoords.x];
  const endNode = grid[endCoords.y][endCoords.x];

  if (!startNode || !endNode || !startNode.walkable || !endNode.walkable) {
    return null; // Invalid start or end node
  }

  const openSet = [startNode];
  const cameFrom = new Map();

  const gScore = new Map(grid.flat().map((node) => [node, Infinity]));
  gScore.set(startNode, 0);

  const fScore = new Map(grid.flat().map((node) => [node, Infinity]));
  fScore.set(startNode, heuristic(startNode, endNode));

  while (openSet.length > 0) {
    openSet.sort((a, b) => fScore.get(a) - fScore.get(b));
    const current = openSet.shift();

    if (current === endNode) {
      return reconstructPath(cameFrom, current);
    }

    const neighbors = getNeighbors(grid, current);
    for (const neighbor of neighbors) {
      const tentativeGScore = gScore.get(current) + 1;
      if (tentativeGScore < gScore.get(neighbor)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + heuristic(neighbor, endNode));
        if (!openSet.some((node) => node === neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  // Open set is empty but goal was never reached
  return null;
}