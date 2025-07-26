import { describe, it, expect } from "vitest";
import Game from "../game/Game.js";

describe("Game Engine - Game Mechanics", () => {
  it("should recharge robot energy each tick", () => {
    const mockAI = { run: () => {} };
    const game = new Game(mockAI, mockAI);
    game.start();

    const player = game.robots.find((r) => r.id === "player");
    const initialEnergy = 50;
    player.battery.energy = initialEnergy;
    const rechargeRate = player.battery.rechargeRate;

    game.tick();

    expect(player.battery.energy).toBe(initialEnergy + rechargeRate);
  });

  it("should not recharge energy beyond the maximum", () => {
    const mockAI = { run: () => {} };
    const game = new Game(mockAI, mockAI);
    game.start();

    const player = game.robots.find((r) => r.id === "player");
    player.battery.energy = player.battery.maxEnergy - 0.01; // Almost full

    game.tick();

    expect(player.battery.energy).toBe(player.battery.maxEnergy);
  });

  it("should enforce cannon cooldown between shots", () => {
    // IA che prova a sparare ad ogni tick
    const firingAI = { run: (api) => api.fire() };
    const opponentAI = { run: () => {} };
    const game = new Game(firingAI, opponentAI);
    game.start();

    const player = game.robots.find((r) => r.id === "player");
    const fireRate = player.cannon.fireRate; // e.g. 20

    // Tick 1: Il robot spara
    game.tick();
    expect(game.projectiles.length).toBe(1);
    expect(player.cannonCooldown).toBe(fireRate);

    // Ticks 2 to fireRate: Cooldown is active (from fireRate-1 down to 1), no new shots
    // We loop for `fireRate - 1` ticks, during which the cooldown will be > 0.
    for (let i = 0; i < fireRate - 1; i++) {
      game.tick();
      expect(game.projectiles.length, `Should not fire on tick ${i + 2} while cooldown is active`).toBe(1);
    }

    // At this point, cooldown is 1. The next tick will decrement it to 0, allowing a shot.
    expect(player.cannonCooldown).toBe(1);

    // Tick (fireRate + 1): Cooldown becomes 0, robot can fire again.
    game.tick();
    // In this tick, the cooldown is decremented to 0, the robot fires, and the cooldown is reset.
    expect(game.projectiles.length, "Should have fired a second shot after cooldown").toBe(2);
    expect(player.cannonCooldown, "Cooldown should be reset after firing").toBe(fireRate);
  });
});