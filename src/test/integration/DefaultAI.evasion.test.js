import { describe, it, expect } from "vitest";
import Game from "../../game/Game.js";
import DefaultAI from "../../game/ai/DefaultAI.js";
import Projectile from "../../game/Projectile.js";

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

describe("DefaultAI Integration - Evasion and Cover Flow", () => {
  it("should enter EVADING state when hit, move to cover, and then return to SEARCHING", () => {
    // 1. SETUP
    const playerAI = createFreshAI();
    const game = new Game(playerAI, passiveAI);
    const player = game.robots.find((r) => r.id === "player");
    const opponent = game.robots.find((r) => r.id === "opponent");

    // Posiziona un ostacolo che il bot userà come copertura.
    const coverObstacle = {
      id: "cover1",
      x: 400,
      y: 400,
      width: 50,
      height: 50,
    };
    game.arena.obstacles = [coverObstacle];

    // Posiziona i bot
    player.x = 425;
    player.y = 300;
    opponent.x = 600;
    opponent.y = 300;

    game.start();

    // Tick iniziale per far rilevare il nemico e passare in ATTACKING
    game.tick();
    expect(player.ai.state.current).toBe("ATTACKING");

    // 2. SIMULAZIONE COLPO
    // Crea un proiettile dall'avversario che colpirà il giocatore
    const projectile = new Projectile({
      id: "p1",
      ownerId: opponent.id,
      x: opponent.x,
      y: opponent.y,
      rotation: 180, // Spara a sinistra
      damage: 10,
      maxRange: 500,
    });
    game.projectiles.push(projectile);

    // Fai avanzare il gioco finché il proiettile non colpisce il giocatore.
    let hitEvent = null;
    for (let i = 0; i < 50; i++) {
      game.tick();
      hitEvent = game.lastTickEvents.find(
        (e) => e.type === "HIT_BY_PROJECTILE" && e.robotId === player.id
      );
      if (hitEvent) break;
    }

    expect(
      hitEvent,
      "HIT_BY_PROJECTILE event should have been fired"
    ).toBeDefined();

    // Aggiungi un tick extra per permettere all'IA di reagire all'evento 'HIT_BY_PROJECTILE'
    game.tick();

    // 3. VERIFICA TRANSIZIONE A EVADING
    // Dopo il tick in cui viene colpito, l'IA dovrebbe passare a EVADING.
    expect(player.ai.state.current).toBe("EVADING");
    // L'IA dovrebbe aver pianificato una mossa verso la copertura.
    expect(player.commandQueue.length).toBeGreaterThan(0);
    expect(player.commandQueue[0].type).toBe("ROTATE"); // moveTo inizia con una rotazione

    // 4. SIMULAZIONE COMPLETAMENTO MOVIMENTO
    // Fai avanzare il gioco finché il movimento di evasione non è completo.
    let evasionEndEvent = null;
    for (let i = 0; i < 230; i++) {
      // Limite di tick per evitare loop infiniti
      game.tick();
      evasionEndEvent = game.lastTickEvents.find(
        (e) => e.type === "SEQUENCE_COMPLETED" && e.robotId === player.id
      );
      if (evasionEndEvent) break;
    }
    console.log("Evasion End Event:", evasionEndEvent);
    // 5. VERIFICA RITORNO A SEARCHING
    expect(
      evasionEndEvent,
      "An event signaling the end of the evasion maneuver should have been fired"
    ).toBeDefined();

    // Aggiungi un tick extra per permettere all'IA di reagire all'evento di fine movimento.

    game.tick();

    // Dopo il completamento del movimento, l'IA dovrebbe tornare a cercare.
    expect(player.ai.state.current).toBe("SEARCHING");
  });
});
