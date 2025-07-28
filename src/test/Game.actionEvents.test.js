import { describe, it, expect } from "vitest";
import Game from "../game/Game.js";

describe("Game Engine - Asynchronous Action Events", () => {
  it("should generate a MOVE_COMPLETED event when a move action finishes", () => {
    // Setup: L'IA del giocatore eseguirà il comando di movimento solo una volta.
    const distance = 50;
    let moveCommandSent = false;
    const playerAI = {
      run: (api) => {
        if (!moveCommandSent) {
          api.move(distance, 100);
          moveCommandSent = true;
        }
      },
    };
    const opponentAI = { run: () => {} };
    const game = new Game(playerAI, opponentAI);
    game.start();
    const player = game.robots.find((r) => r.id === "player");
    // The robot is overweight (80 > 75), so speed is halved.
    // Movement speed is rounded, so 1.5 becomes 2.
    const baseSpeed = player.motor.maxSpeed * (player.isOverweight ? 0.5 : 1);
    const effectiveSpeed = Math.round(baseSpeed);
    const ticksToComplete = Math.ceil(distance / effectiveSpeed);

    // Action: Esegui i tick necessari per completare l'azione.
    // Il primo tick avvia il comando, i successivi lo eseguono.
    for (let i = 0; i <= ticksToComplete; i++) {
      game.tick();
    }

    // Assert
    const { events } = game.getGameState();
    const moveCompletedEvent = events.find((e) => e.type === "MOVE_COMPLETED");
    expect(moveCompletedEvent).toBeDefined();
    expect(moveCompletedEvent.robotId).toBe(player.id);
    expect(player.commandQueue.length).toBe(0);
  });

  it("should generate a ROTATION_COMPLETED event when a rotation action finishes", () => {
    // Setup
    const angle = 90;
    let rotationCommandSent = false;
    const playerAI = {
      run: (api) => {
        if (!rotationCommandSent) {
          api.rotate(angle, 100);
          rotationCommandSent = true;
        }
      },
    };
    const opponentAI = { run: () => {} };
    const game = new Game(playerAI, opponentAI);
    game.start();
    const player = game.robots.find((r) => r.id === "player");
    // The robot is overweight (80 > 75), so rotation speed is halved.
    const effectiveRotationSpeed = player.motor.maxRotationSpeed * (player.isOverweight ? 0.5 : 1); // 5 * 0.5 = 2.5
    const ticksToComplete = Math.ceil(angle / effectiveRotationSpeed); // ceil(90 / 2.5) = 36

    // Action: Esegui i tick necessari
    for (let i = 0; i <= ticksToComplete; i++) {
      game.tick();
    }

    // Assert
    const { events } = game.getGameState();
    const rotationCompletedEvent = events.find((e) => e.type === "ROTATION_COMPLETED");
    expect(rotationCompletedEvent).toBeDefined();
    expect(rotationCompletedEvent.robotId).toBe(player.id);
    expect(player.commandQueue.length).toBe(0);
  });

  it("should generate an ACTION_STOPPED event when stop() is called by the user", () => {
    // Setup: L'IA avvia un movimento lungo, poi chiama stop() al tick successivo.
    let tickCounter = 0;
    const playerAI = {
      run: (api) => {
        if (tickCounter === 0) {
          api.move(500, 100); // Avvia un'azione lunga
        } else if (tickCounter === 1) {
          api.stop(); // Interrompe l'azione
        }
        tickCounter++;
      },
    };
    const opponentAI = { run: () => {} };
    const game = new Game(playerAI, opponentAI);
    game.start();
    const player = game.robots.find((r) => r.id === "player");

    // Action
    game.tick(); // Tick 0: L'IA chiama api.move()
    expect(player.commandQueue.length).toBe(1);
    game.tick(); // Tick 1: L'IA chiama api.stop()

    // Assert
    const { events } = game.getGameState();
    const actionStoppedEvent = events.find((e) => e.type === "ACTION_STOPPED");
    expect(actionStoppedEvent).toBeDefined();
    expect(actionStoppedEvent.robotId).toBe(player.id);
    expect(actionStoppedEvent.commandType).toBe("MOVE");
    expect(actionStoppedEvent.reason).toBe("USER_COMMAND");
    expect(player.commandQueue.length).toBe(0);
  });

  it("should generate an ACTION_STOPPED event on collision with a wall", () => {
    // Setup
    let moveCommandSent = false;
    const playerAI = {
      run: (api) => {
        if (!moveCommandSent) {
          api.move(100, 100); // Comando che causerà una collisione
          moveCommandSent = true;
        }
      },
    };
    const opponentAI = { run: () => {} };
    const game = new Game(playerAI, opponentAI);
    game.start();
    const player = game.robots.find((r) => r.id === "player");

    // Position the robot near a wall and make it move towards it
    // Force the overweight condition for this test to be deterministic
    player.motor.maxWeight = 75;
    player.isOverweight = player.totalWeight > player.motor.maxWeight;
    expect(player.isOverweight).toBe(true);

    player.x = game.arena.width - 20; // 780
    player.rotation = 0; // Facing the right wall

    // Action:
    // The robot is overweight, so its speed is halved and rounded.
    // The wall is at 800. Robot radius is 15.
    // It will collide when x > 800 - 15 = 785.
    const baseSpeed = player.motor.maxSpeed * (player.isOverweight ? 0.5 : 1);
    const effectiveSpeed = Math.round(baseSpeed);

    // Tick 0: AI calls api.move(). The game engine sets the activeCommand.
    game.tick();
    expect(player.commandQueue.length).toBe(1);

    // Simulate ticks until collision
    const initialX = player.x;
    let currentX = initialX;
    while (currentX + effectiveSpeed <= game.arena.width - player.radius) {
      game.tick();
      currentX += effectiveSpeed;
      expect(player.x).toBe(currentX);
    }
    game.tick();

    // Assert
    const { events } = game.getGameState();
    const actionStoppedEvent = events.find((e) => e.type === "ACTION_STOPPED");
    expect(actionStoppedEvent).toBeDefined();
    expect(actionStoppedEvent.robotId).toBe(player.id);
    expect(actionStoppedEvent.commandType).toBe("MOVE");
    expect(actionStoppedEvent.reason).toBe("COLLISION");
    expect(player.commandQueue.length).toBe(0);
    // The robot should not have moved on the collision tick
    expect(player.x).toBe(currentX);
  });

  it("should generate an ACTION_STOPPED event if the robot runs out of energy", () => {
    // Setup: L'IA del giocatore eseguirà il comando di movimento solo una volta.
    let moveCommandSent = false;
    const playerAI = {
      run: (api) => {
        if (!moveCommandSent) {
          api.move(500, 100); // Azione lunga che consumerà energia
          moveCommandSent = true;
        }
      },
    };
    const opponentAI = { run: () => {} };
    const game = new Game(playerAI, opponentAI);
    game.start();
    const player = game.robots.find((r) => r.id === "player");

    // Imposta l'energia a un valore molto basso e disabilita la ricarica per il test
    player.battery.energy = 0.1;
    player.battery.rechargeRate = 0;

    // Il costo per un tick di movimento è superiore a 0.1, quindi il primo tentativo fallirà.

    // Action
    game.tick(); // Tick 0: L'IA chiama api.move(), l'azione viene impostata.
    expect(player.commandQueue.length).toBe(1);

    game.tick(); // Tick 1: Il gioco prova a eseguire il movimento, ma l'energia non è sufficiente.

    // Assert
    const { events } = game.getGameState();
    const actionStoppedEvent = events.find((e) => e.type === "ACTION_STOPPED");
    expect(actionStoppedEvent).toBeDefined();
    expect(actionStoppedEvent.robotId).toBe(player.id);
    expect(actionStoppedEvent.commandType).toBe("MOVE");
    expect(actionStoppedEvent.reason).toBe("NO_ENERGY");
    expect(player.commandQueue.length).toBe(0);
  });

  it("should execute commands sequentially from the queue", () => {
    // Setup: L'IA accoda una rotazione e poi un movimento.
    let commandsSent = false;
    const playerAI = {
      run: (api) => {
        if (!commandsSent) {
          api.rotate(90, 100);
          api.move(50, 100);
          commandsSent = true;
        }
      },
    };
    const opponentAI = { run: () => {} };
    const game = new Game(playerAI, opponentAI);
    game.start();
    const player = game.robots.find((r) => r.id === "player");

    // Action: Tick 1 - I comandi vengono accodati
    game.tick();
    expect(player.commandQueue.length).toBe(2);
    expect(player.commandQueue[0].type).toBe("ROTATE");
    expect(player.commandQueue[1].type).toBe("MOVE");

    // Calcola i tick necessari per la rotazione
    const effectiveRotationSpeed = player.motor.maxRotationSpeed * (player.isOverweight ? 0.5 : 1); // 2.5
    const ticksForRotation = Math.ceil(90 / effectiveRotationSpeed); // 36

    // Esegui i tick per la rotazione
    for (let i = 0; i < ticksForRotation; i++) {
      game.tick();
    }

    // Assert: La rotazione è completa, la coda ha 1 elemento (MOVE)
    let { events } = game.getGameState();
    expect(events.some((e) => e.type === "ROTATION_COMPLETED")).toBe(true);
    expect(player.commandQueue.length).toBe(1);
    expect(player.commandQueue[0].type).toBe("MOVE");

    // Esegui i tick per il movimento
    const baseSpeed = player.motor.maxSpeed * (player.isOverweight ? 0.5 : 1);
    const effectiveSpeed = Math.round(baseSpeed);
    const ticksForMove = Math.ceil(50 / effectiveSpeed);
    for (let i = 0; i < ticksForMove; i++) {
      game.tick();
    }

    // Assert: Il movimento è completo, la coda è vuota
    ({ events } = game.getGameState());
    expect(events.some((e) => e.type === "MOVE_COMPLETED")).toBe(true);
    expect(player.commandQueue.length).toBe(0);
  });
});