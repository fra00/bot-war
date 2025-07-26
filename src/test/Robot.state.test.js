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
      setup(); // Default loadout weight is 80, maxWeight is 75
      const state = robot.getState();

      const expectedWeight =
        standardArmor.weight +
        standardCannon.weight +
        standardBattery.weight +
        standardMotor.weight +
        standardRadar.weight;

      expect(state.totalWeight).toBe(expectedWeight);
      expect(state.isOverweight).toBe(true);
    });

    it("should correctly calculate totalWeight and isOverweight (false)", () => {
      const lightCannon = { ...standardCannon, weight: 5 }; // Total weight = 70
      setup({ cannon: lightCannon }); // maxWeight is 75

      const state = robot.getState();

      const expectedWeight =
        standardArmor.weight +
        lightCannon.weight +
        standardBattery.weight +
        standardMotor.weight +
        standardRadar.weight;

      expect(state.totalWeight).toBe(expectedWeight);
      expect(state.isOverweight).toBe(false);
    });

    it("should reflect updated state after taking damage and consuming energy", () => {
      setup();
      robot.takeDamage(20);
      robot.consumeEnergy(10); // Overweight cost = 15
      const state = robot.getState();

      expect(state.armorHp).toBe(standardArmor.maxHp - 20);
      expect(state.hullHp).toBe(100);
      expect(state.energy).toBe(standardBattery.maxEnergy - 15);
    });
  });
});
