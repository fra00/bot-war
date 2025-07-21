import { describe, it, expect, vi } from "vitest";
import Game from "../game/Game.js";
import Projectile from "../game/Projectile.js";

describe("Game Engine", () => {
  it("should generate a PROJECTILE_HIT_ROBOT event on collision", () => {
    // Mock delle IA per non interferire con il test
    const mockAI = { run: () => {} };

    // 1. Setup del gioco
    const game = new Game(mockAI, mockAI);
    game.start();

    const player = game.robots.find((r) => r.id === "player");
    const opponent = game.robots.find((r) => r.id === "opponent");

    // 2. Creazione manuale di un proiettile destinato a colpire
    // Posizioniamo il proiettile proprio di fronte all'avversario
    const projectile = new Projectile({
      id: "test_proj",
      ownerId: player.id,
      x: opponent.x - 10, // Leggermente a sinistra dell'avversario
      y: opponent.y,
      rotation: 0, // Si muove verso destra
      damage: 10,
      maxRange: 500,
    });
    game.projectiles.push(projectile);

    // 3. Esecuzione di un tick di gioco
    game.tick();

    // 4. Verifica
    const { events } = game.getGameState();
    // Ci aspettiamo che sia stato generato un evento di collisione
    const hitEvent = events.find((e) => e.type === "PROJECTILE_HIT_ROBOT");
    expect(hitEvent).toBeDefined();
    expect(hitEvent.targetId).toBe(opponent.id);
  });
});
