import { describe, it, expect } from "vitest";
import Game from "../game/Game.js";

describe("Game Engine - Overweight Penalties", () => {
  it("should apply overweight penalty to movement speed", () => {
    // Setup: L'IA avvia un movimento.
    let commandSent = false;
    const movingAI = {
      run: (api) => {
        if (!commandSent) {
          api.move(100, 100);
          commandSent = true;
        }
      },
    };
    const opponentAI = { run: () => {} };
    const game = new Game(movingAI, opponentAI);
    game.start();

    const player = game.robots.find((r) => r.id === "player");
    // Forziamo la condizione di sovrappeso per il test, rendendolo indipendente
    // dalla configurazione di default dei componenti.
    player.motor.maxWeight = 75;
    player.isOverweight = player.totalWeight > player.motor.maxWeight;
    const initialX = player.x;
    const maxSpeed = player.motor.maxSpeed; // e.g. 3

    expect(player.isOverweight).toBe(true);

    // Action: Esegui un tick per avviare il comando, e un altro per muoversi.
    game.tick(); // AI sets the command
    game.tick(); // Game executes one step of the command

    // Assert: La distanza percorsa è la metà della velocità massima, arrotondata.
    const expectedDistance = Math.round(maxSpeed * 0.5);
    expect(player.x).toBe(initialX + expectedDistance);
  });

  it("should not apply overweight penalty to movement speed when not overweight", () => {
    // Setup: IA che si muove, ma con un loadout reso leggero.
    let commandSent = false;
    const movingAI = {
      run: (api) => {
        if (!commandSent) {
          api.move(100, 100);
          commandSent = true;
        }
      },
    };
    const opponentAI = { run: () => {} };
    const game = new Game(movingAI, opponentAI);
    game.start();

    const player = game.robots.find((r) => r.id === "player");
    // Rendi il robot non più in sovrappeso per il test
    player.motor.maxWeight = 100;
    player.isOverweight = player.totalWeight > player.motor.maxWeight;
    expect(player.isOverweight).toBe(false);

    const initialX = player.x;
    const maxSpeed = player.motor.maxSpeed;

    // Action
    game.tick(); // AI sets the command
    game.tick(); // Game executes one step of the command

    // Assert: La distanza percorsa è la velocità massima.
    expect(player.x).toBe(initialX + maxSpeed);
  });

  it("should apply overweight penalty to rotation speed", () => {
    // Setup: L'IA avvia una rotazione.
    let commandSent = false;
    const rotatingAI = {
      run: (api) => {
        if (!commandSent) {
          api.rotate(90, 100);
          commandSent = true;
        }
      },
    };
    const opponentAI = { run: () => {} };
    const game = new Game(rotatingAI, opponentAI);
    game.start();

    const player = game.robots.find((r) => r.id === "player");
    // Forziamo la condizione di sovrappeso per il test.
    player.motor.maxWeight = 75;
    player.isOverweight = player.totalWeight > player.motor.maxWeight;
    const initialRotation = player.rotation;
    const maxRotationSpeed = player.motor.maxRotationSpeed; // e.g. 5

    expect(player.isOverweight).toBe(true);

    // Action
    game.tick(); // AI sets the command
    game.tick(); // Game executes one step of the command

    // Assert: L'angolo ruotato è la metà della velocità massima.
    const expectedRotationDelta = maxRotationSpeed * 0.5;
    expect(player.rotation).toBe(initialRotation + expectedRotationDelta);
  });

  it("should not apply overweight penalty to rotation speed when not overweight", () => {
    // Setup: IA che ruota, ma con un loadout reso leggero.
    let commandSent = false;
    const rotatingAI = {
      run: (api) => {
        if (!commandSent) {
          api.rotate(90, 100);
          commandSent = true;
        }
      },
    };
    const opponentAI = { run: () => {} };
    const game = new Game(rotatingAI, opponentAI);
    game.start();

    const player = game.robots.find((r) => r.id === "player");
    // Rendi il robot non più in sovrappeso per il test
    player.motor.maxWeight = 100;
    player.isOverweight = player.totalWeight > player.motor.maxWeight;
    expect(player.isOverweight).toBe(false);

    const initialRotation = player.rotation;
    const maxRotationSpeed = player.motor.maxRotationSpeed;

    // Action
    game.tick(); // AI sets the command
    game.tick(); // Game executes one step of the command

    // Assert: L'angolo ruotato è la velocità massima.
    expect(player.rotation).toBe(initialRotation + maxRotationSpeed);
  });
});
