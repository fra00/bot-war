import { describe, it, expect } from "vitest";
import Robot from "../game/Robot.js";
import {
  standardArmor,
  standardBattery,
  standardCannon,
  standardMotor,
  standardRadar,
} from "../game/components.js";

describe("Robot Mechanics", () => {
  let robot;

  // Helper to set up a clean robot for each test
  const setup = (config = {}) => {
    const loadout = {
      armor: { ...standardArmor },
      cannon: { ...standardCannon },
      battery: { ...standardBattery },
      motor: { ...standardMotor },
      radar: { ...standardRadar },
      // Total weight: 20 + 15 + 10 + 25 + 10 = 80
    };

    robot = new Robot({
      id: "test-robot",
      x: 100,
      y: 100,
      ai: { run: () => {} },
      ...loadout,
      ...config,
    });
  };

  describe("takeDamage", () => {
    it("should reduce armor HP first", () => {
      setup(); // armor.maxHp = 50
      robot.takeDamage(20);
      expect(robot.armor.hp).toBe(30);
      expect(robot.hullHp).toBe(100);
    });

    it("should reduce hull HP after armor is depleted", () => {
      setup(); // armor.maxHp = 50
      robot.takeDamage(60); // 50 to armor, 10 to hull
      expect(robot.armor.hp).toBe(0);
      expect(robot.hullHp).toBe(90);
    });

    it("should handle damage exactly equal to armor HP", () => {
      setup();
      robot.takeDamage(50);
      expect(robot.armor.hp).toBe(0);
      expect(robot.hullHp).toBe(100);
    });
  });

  describe("consumeEnergy", () => {
    // Questo è un moltiplicatore implicito nella classe Robot. Lo definiamo qui
    // per rendere i test robusti e leggibili.
    const OVERWEIGHT_ENERGY_MULTIPLIER = 1.5;

    it("should consume more energy when overweight", () => {
      // Setup: Crea un motore debole per forzare la condizione di sovrappeso.
      const weakMotor = { ...standardMotor, maxWeight: 75 }; // totalWeight (80) > maxWeight (75)
      setup({ motor: weakMotor });
      expect(robot.isOverweight).toBe(true);

      const initialEnergy = 50;
      const baseCost = 10;
      robot.battery.energy = initialEnergy;

      const expectedCost = baseCost * OVERWEIGHT_ENERGY_MULTIPLIER;
      const consumed = robot.consumeEnergy(baseCost);

      expect(consumed).toBe(true);
      expect(robot.battery.energy).toBe(initialEnergy - expectedCost);
    });

    it("should not consume energy and return false if there is not enough (when overweight)", () => {
      // Setup: Crea un motore debole per forzare la condizione di sovrappeso.
      const weakMotor = { ...standardMotor, maxWeight: 75 };
      setup({ motor: weakMotor });
      expect(robot.isOverweight).toBe(true);

      const initialEnergy = 10;
      const baseCost = 10;
      robot.battery.energy = initialEnergy;

      const expectedCost = baseCost * OVERWEIGHT_ENERGY_MULTIPLIER; // 15
      expect(initialEnergy).toBeLessThan(expectedCost); // Sanity check for the test itself

      const consumed = robot.consumeEnergy(baseCost);
      expect(consumed).toBe(false);
      expect(robot.battery.energy).toBe(initialEnergy); // L'energia non dovrebbe cambiare
    });

    it("should consume the correct amount when not overweight", () => {
      // La configurazione di default non è in sovrappeso (peso 80 < max 90)
      setup();
      expect(robot.isOverweight).toBe(false);
      const initialEnergy = 50;
      const baseCost = 10;
      robot.battery.energy = initialEnergy;

      const consumed = robot.consumeEnergy(baseCost);
      expect(consumed).toBe(true);
      expect(robot.battery.energy).toBe(initialEnergy - baseCost); // No multiplier
    });
  });
});
