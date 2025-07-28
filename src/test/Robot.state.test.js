import { describe, it, expect } from "vitest";
import Robot from "../game/Robot.js";
import {
  standardArmor,
  standardBattery,
  standardCannon,
  standardMotor,
  standardRadar,
} from "../game/components.js";

describe("Robot State", () => {
  let robot;

  // Helper to set up a clean robot for each test
  const setup = (config = {}) => {
    const loadout = {
      armor: { ...standardArmor }, // maxHp: 50, weight: 20
      cannon: { ...standardCannon }, // weight: 15
      battery: { ...standardBattery }, // maxEnergy: 100, weight: 10
      motor: { ...standardMotor }, // maxWeight: 75, weight: 25
      radar: { ...standardRadar }, // weight: 10
      // Total weight: 80
    };

    robot = new Robot({
      id: "test-robot",
      x: 100,
      y: 200,
      rotation: 90,
      ai: { run: () => {} },
      ...loadout,
      ...config,
    });
  };

  describe("getState", () => {
    it("should return an object with the correct structure and initial values", () => {
      setup();
      const state = robot.getState();

      expect(state).toBeTypeOf("object");
      expect(state).toHaveProperty("id", "test-robot");
      expect(state).toHaveProperty("x", 100);
      expect(state).toHaveProperty("y", 200);
      expect(state).toHaveProperty("rotation", 90);
      expect(state).toHaveProperty("hullHp", 100);
      expect(state).toHaveProperty("armorHp", standardArmor.maxHp);
      expect(state).toHaveProperty("maxArmorHp", standardArmor.maxHp);
      expect(state).toHaveProperty("energy", standardBattery.maxEnergy);
      expect(state).toHaveProperty("maxEnergy", standardBattery.maxEnergy);
      expect(state).toHaveProperty("totalWeight");
      expect(state).toHaveProperty("isOverweight");
      expect(state).toHaveProperty("radarRange", standardRadar.range);
    });

    it("should correctly calculate totalWeight and isOverweight (true)", () => {
      // Usa un motore più debole per forzare la condizione di sovrappeso per questo test.
      const weakMotor = { ...standardMotor, maxWeight: 75 };
      setup({ motor: weakMotor });
      const state = robot.getState();

      const expectedWeight =
        standardArmor.weight +
        standardCannon.weight +
        standardBattery.weight +
        weakMotor.weight +
        standardRadar.weight;

      expect(state.totalWeight).toBe(expectedWeight);
      expect(state.isOverweight).toBe(true);
    });

    it("should correctly calculate totalWeight and isOverweight (false)", () => {
      // La configurazione di default non è in sovrappeso (80 < 90)
      setup();

      const state = robot.getState();

      const expectedWeight =
        standardArmor.weight +
        standardCannon.weight +
        standardBattery.weight +
        standardMotor.weight +
        standardRadar.weight;

      expect(state.totalWeight).toBe(expectedWeight);
      expect(state.isOverweight).toBe(false);
    });

    it("should reflect updated state after taking damage and consuming energy", () => {
      // La configurazione di default non è in sovrappeso.
      setup();
      const OVERWEIGHT_ENERGY_MULTIPLIER = 1.5; // From Robot.js logic
      const baseEnergyCost = 10;
      const expectedEnergyCost = robot.isOverweight
        ? baseEnergyCost * OVERWEIGHT_ENERGY_MULTIPLIER
        : baseEnergyCost;

      robot.takeDamage(20);
      robot.consumeEnergy(baseEnergyCost);
      const state = robot.getState();

      expect(state.armorHp).toBe(standardArmor.maxHp - 20);
      expect(state.hullHp).toBe(100);
      expect(state.energy).toBe(standardBattery.maxEnergy - expectedEnergyCost);
    });
  });
});
