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
      armor: { ...standardArmor }, // maxHp: 50, weight: 20
      cannon: { ...standardCannon }, // weight: 15
      battery: { ...standardBattery }, // maxEnergy: 100, weight: 10
      motor: { ...standardMotor }, // maxWeight: 75, weight: 25
      radar: { ...standardRadar }, // weight: 10
      // Total weight: 20 + 15 + 10 + 25 + 10 = 80
      // isOverweight: true (80 > 75)
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
    it("should consume energy and return true if there is enough", () => {
      setup(); // isOverweight is true by default
      robot.battery.energy = 50;
      const consumed = robot.consumeEnergy(10); // cost = 10 * 1.5 = 15
      expect(consumed).toBe(true);
      expect(robot.battery.energy).toBe(35);
    });

    it("should not consume energy and return false if there is not enough", () => {
      setup();
      robot.battery.energy = 10;
      const consumed = robot.consumeEnergy(10); // cost = 15
      expect(consumed).toBe(false);
      expect(robot.battery.energy).toBe(10); // Energy should not change
    });

    it("should consume the correct amount when not overweight", () => {
      // Modify motor to not be overweight
      const lightMotor = { ...standardMotor, maxWeight: 100 }; // 80 < 100
      setup({ motor: lightMotor });

      expect(robot.isOverweight).toBe(false);
      robot.battery.energy = 50;
      const consumed = robot.consumeEnergy(10); // cost = 10
      expect(consumed).toBe(true);
      expect(robot.battery.energy).toBe(40);
    });
  });
});
