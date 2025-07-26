import { describe, it, expect } from "vitest";
import Robot from "../game/Robot.js";
import Arena from "../game/Arena.js";
import {
  standardArmor,
  standardBattery,
  standardCannon,
  standardMotor,
  standardRadar,
} from "../game/components.js";
import { scanForObstacles } from "../game/systems/perceptionSystem.js";

describe("Robot API - scanObstacles", () => {
  let robot;

  // Helper per configurare uno stato pulito per ogni test
  const setup = (robotConfig = {}, obstacles = []) => {
    const arena = new Arena(800, 600);
    arena.obstacles = obstacles;

    const playerLoadout = {
      armor: { ...standardArmor },
      cannon: { ...standardCannon },
      battery: { ...standardBattery },
      motor: { ...standardMotor },
      radar: { ...standardRadar, range: 200 }, // Usa un raggio specifico per i test
    };

    robot = new Robot({
      id: "player",
      x: 400,
      y: 300,
      rotation: 0,
      ai: { run: () => {} },
      ...playerLoadout,
      ...robotConfig,
    });

    // Il ciclo di gioco normalmente farebbe questo. Lo simuliamo qui.
    robot.lastObstaclesScan = scanForObstacles(robot, arena.obstacles);

    // Restituiamo l'API per il test
    return robot.getApi({ arena });
  };

  it("dovrebbe restituire un array vuoto quando nessun ostacolo è nel raggio", () => {
    const obstacleFarAway = { id: "o1", x: 700, y: 300, width: 20, height: 20 };
    const api = setup({}, [obstacleFarAway]);
    const obstacles = api.scanObstacles();
    expect(obstacles).toEqual([]);
  });

  it("dovrebbe restituire un array vuoto quando non ci sono ostacoli", () => {
    const api = setup({}, []);
    const obstacles = api.scanObstacles();
    expect(obstacles).toEqual([]);
  });

  it("dovrebbe rilevare un singolo ostacolo all'interno del raggio", () => {
    const obstacleInRange = { id: "o1", x: 500, y: 300, width: 20, height: 20 }; // distanza ~100
    const api = setup({}, [obstacleInRange]);
    const obstacles = api.scanObstacles();
    expect(obstacles.length).toBe(1);
    expect(obstacles[0].id).toBe("o1");
  });

  it("dovrebbe rilevare più ostacoli e ordinarli per distanza", () => {
    const obstacleNear = { id: "near", x: 450, y: 300, width: 10, height: 10 }; // dist ~50
    const obstacleFar = { id: "far", x: 550, y: 300, width: 10, height: 10 }; // dist ~150
    const api = setup({}, [obstacleFar, obstacleNear]); // Aggiunti in ordine inverso di distanza

    const obstacles = api.scanObstacles();

    expect(obstacles.length).toBe(2);
    expect(obstacles[0].id).toBe("near");
    expect(obstacles[1].id).toBe("far");
    expect(obstacles[0].distance).toBeLessThan(obstacles[1].distance);
  });

  it("dovrebbe calcolare distanza e angolo correttamente", () => {
    // Robot a (400, 300), rotazione 0 (verso destra)
    // Centro dell'ostacolo a (500, 300)
    const obstacle = { id: "o1", x: 490, y: 290, width: 20, height: 20 };
    const api = setup({}, [obstacle]);

    const obstacles = api.scanObstacles();
    expect(obstacles.length).toBe(1);

    // Distanza da (400, 300) a (500, 300) è 100
    expect(obstacles[0].distance).toBeCloseTo(100);
    // Angolo da (400, 300) a (500, 300) è 0 gradi. Rotazione del robot è 0. Angolo relativo è 0.
    expect(obstacles[0].angle).toBeCloseTo(0);
  });

  it("dovrebbe calcolare l'angolo relativo correttamente quando il robot è ruotato", () => {
    // Robot a (400, 300), rotazione 90 (verso il basso)
    // Centro dell'ostacolo a (500, 300) (angolo nel mondo 0)
    const obstacle = { id: "o1", x: 490, y: 290, width: 20, height: 20 };
    const api = setup({ rotation: 90 }, [obstacle]);

    const obstacles = api.scanObstacles();
    expect(obstacles.length).toBe(1);

    // Angolo nel mondo è 0. Rotazione del robot è 90. L'angolo relativo dovrebbe essere (0 - 90 + 360) % 360 = 270.
    expect(obstacles[0].angle).toBeCloseTo(270);
  });
});
