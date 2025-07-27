import { describe, it, expect } from "vitest";
import Game from "../../game/Game.js";
import DefaultAI from "../../game/ai/DefaultAI.js";

// Un'IA fittizia che non fa nulla, da usare per l'avversario per rendere il test deterministico.
const passiveAI = {
  state: {},
  run: () => {},
};

// Funzione helper per creare una nuova istanza "pulita" dell'IA per ogni test,
// evitando che lo stato di un test influenzi il successivo.
const createFreshAI = () => {
  return {
    state: {},
    run: DefaultAI.run,
  };
};

describe("DefaultAI Integration - Search and Attack Flow", () => {
  it("should start searching, detect an enemy, transition to attacking, and aim at the enemy", () => {
    // 1. SETUP
    const playerAI = createFreshAI();
    const game = new Game(playerAI, passiveAI);
    const player = game.robots.find((r) => r.id === "player");
    const opponent = game.robots.find((r) => r.id === "opponent");

    // Posiziona l'avversario lontano, fuori dal raggio del radar.
    opponent.x = 1000;
    opponent.y = 1000;

    game.start();

    // 2. STATO INIZIALE: SEARCHING
    // Tick 1: L'IA inizializza il suo stato in SEARCHING e decide di muoversi.
    game.tick();
    expect(player.ai.state.current).toBe("SEARCHING");
    // La decisione di muoversi popola la coda di comandi.
    expect(player.commandQueue.length).toBeGreaterThan(0);
    expect(player.commandQueue[0].type).toBe("ROTATE"); // moveTo inizia con una rotazione.

    // 3. SIMULAZIONE RILEVAMENTO NEMICO
    // Sposta l'avversario nel raggio del radar del giocatore (il raggio di default è 300).
    opponent.x = player.x + 150;
    opponent.y = player.y;

    // Tick 2: Il sistema di percezione rileva il nemico e genera l'evento ENEMY_DETECTED.
    // L'IA vede l'evento, passa allo stato ATTACKING e chiama api.stop().
    game.tick();

    // 4. VERIFICA TRANSIZIONE DI STATO
    // Lo stato è cambiato.
    expect(player.ai.state.current).toBe("ATTACKING");
    // La chiamata a api.stop() ha svuotato la coda di comandi.
    expect(player.commandQueue.length).toBe(0);

    // 5. VERIFICA NUOVO COMPORTAMENTO
    // Tick 3: L'IA è in stato ATTACKING con la coda vuota.
    // Dovrebbe decidere di mirare al nemico.
    game.tick();
    expect(player.commandQueue.length).toBeGreaterThan(0);
    expect(player.commandQueue[0].type).toBe("ROTATE"); // aimAt è un comando di rotazione.
    // L'IA dovrebbe aver memorizzato la posizione del nemico.
    expect(player.ai.state.lastKnownEnemyPosition).toEqual({
      x: opponent.x,
      y: opponent.y,
    });
  });
});
