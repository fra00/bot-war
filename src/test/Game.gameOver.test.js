import { describe, it, expect } from "vitest";
import Game from "../game/Game.js";

describe("Game Engine - Game Over Conditions", () => {
  it("should finish the game and declare a winner when one robot is destroyed", () => {
    const mockAI = { run: () => {} };
    const game = new Game(mockAI, mockAI);
    game.start();

    const opponent = game.robots.find((r) => r.id === "opponent");
    opponent.hullHp = 0; // Opponent is destroyed

    game.tick();

    const { status, winner } = game.getGameState();
    expect(status).toBe("finished");
    expect(winner).toBe("player");
  });

  it("should finish the game and declare the opponent as winner if the player is destroyed", () => {
    const mockAI = { run: () => {} };
    const game = new Game(mockAI, mockAI);
    game.start();

    const player = game.robots.find((r) => r.id === "player");
    player.hullHp = 0; // Player is destroyed

    game.tick();

    const { status, winner } = game.getGameState();
    expect(status).toBe("finished");
    expect(winner).toBe("opponent");
  });

  it("should result in a draw if both robots are destroyed in the same tick", () => {
    const mockAI = { run: () => {} };
    const game = new Game(mockAI, mockAI);
    game.start();

    game.robots.forEach((robot) => (robot.hullHp = 0)); // Both are destroyed

    game.tick();

    const { status, winner } = game.getGameState();
    expect(status).toBe("finished");
    expect(winner).toBeNull();
  });
});