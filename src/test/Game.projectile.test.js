import { describe, it, expect } from "vitest";
import Game from "../game/Game.js";
import Projectile from "../game/Projectile.js";

describe("Game Engine - Projectile Collisions", () => {
  it("should generate an ENEMY_HIT event for the shooter on collision", () => {
    // Mock delle IA per non interferire
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
    const hitEvent = events.find((e) => e.type === "ENEMY_HIT");
    expect(hitEvent).toBeDefined();
    expect(hitEvent.targetId).toBe(opponent.id);
    expect(hitEvent.ownerId).toBe(player.id);
  });

  it("should generate a HIT_BY_PROJECTILE event for the robot that was hit", () => {
    // Mock delle IA per non interferire con il test
    const mockAI = { run: () => {} };

    // 1. Setup del gioco
    const game = new Game(mockAI, mockAI);
    game.start();

    const player = game.robots.find((r) => r.id === "player");
    const opponent = game.robots.find((r) => r.id === "opponent");
    const projectileDamage = 15;

    // 2. Creazione manuale di un proiettile destinato a colpire
    const projectile = new Projectile({
      id: "test_proj_hit",
      ownerId: player.id,
      x: opponent.x - 10,
      y: opponent.y,
      rotation: 0,
      damage: projectileDamage,
      maxRange: 500,
    });
    game.projectiles.push(projectile);

    // 3. Esecuzione di un tick di gioco
    game.tick();

    // 4. Verifica che l'evento sia stato generato correttamente
    const { events } = game.getGameState();
    const hitByEvent = events.find((e) => e.type === "HIT_BY_PROJECTILE");
    expect(hitByEvent).toBeDefined();
    expect(hitByEvent.robotId).toBe(opponent.id);
    expect(hitByEvent.ownerId).toBe(player.id);
    expect(hitByEvent.damage).toBe(projectileDamage);
  });

  it("should generate a PROJECTILE_HIT_WALL event on collision with a wall", () => {
    const mockAI = { run: () => {} };
    const game = new Game(mockAI, mockAI);
    game.start();
    const player = game.robots.find((r) => r.id === "player");

    // Crea un proiettile vicino al muro destro, che si muove verso di esso
    const projectile = new Projectile({
      id: "test_proj_wall",
      ownerId: player.id,
      x: game.arena.width - 10,
      y: game.arena.height / 2,
      rotation: 0, // Verso destra
      damage: 10,
      maxRange: 500,
    });
    game.projectiles.push(projectile);

    game.tick(); // Il proiettile si muove a x=795
    game.tick(); // Il proiettile si muove a x=800 e colpisce il muro

    const { events } = game.getGameState();
    const wallHitEvent = events.find((e) => e.type === "PROJECTILE_HIT_WALL");
    expect(wallHitEvent).toBeDefined();
    expect(wallHitEvent.ownerId).toBe(player.id);
  });

  it("should generate a PROJECTILE_HIT_OBSTACLE event on collision with an obstacle", () => {
    // L'IA del giocatore sparerà solo una volta, al primo tick.
    let hasFired = false;
    const playerAI = {
      run: (api) => {
        if (!hasFired) {
          api.fire();
          hasFired = true;
        }
      },
    };
    const opponentAI = { run: () => {} };
    const game = new Game(playerAI, opponentAI);
    // Aggiungi un ostacolo conosciuto per il test
    const obstacle = { id: "test_obstacle", x: 300, y: 300, width: 50, height: 50 };
    // Svuota gli ostacoli casuali e aggiungi solo quello per il test per renderlo deterministico
    game.arena.obstacles = [obstacle];
    game.start();
    const player = game.robots.find((r) => r.id === "player");

    // Posiziona il robot in modo che il proiettile colpisca l'ostacolo al secondo tick
    player.x = 290;
    player.y = 325; // Allineato con l'ostacolo
    player.rotation = 0; // Verso destra

    game.tick(); // L'IA spara
    game.tick(); // Il proiettile si muove e colpisce l'ostacolo

    const { events } = game.getGameState();
    const obstacleHitEvent = events.find((e) => e.type === "PROJECTILE_HIT_OBSTACLE");
    expect(obstacleHitEvent).toBeDefined();
    expect(obstacleHitEvent.ownerId).toBe(player.id);
    expect(obstacleHitEvent.obstacleId).toBe(obstacle.id);
  });
});