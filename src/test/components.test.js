import { describe, it, expect } from "vitest";
import * as components from "../game/components.js";

describe("Robot Components", () => {
  it("should define standardArmor with correct properties", () => {
    const { standardArmor } = components;
    expect(standardArmor).toBeDefined();
    expect(typeof standardArmor.maxHp).toBe("number");
    expect(typeof standardArmor.weight).toBe("number");
  });

  it("should define standardCannon with correct properties", () => {
    const { standardCannon } = components;
    expect(standardCannon).toBeDefined();
    expect(typeof standardCannon.damage).toBe("number");
    expect(typeof standardCannon.fireRate).toBe("number");
    expect(typeof standardCannon.energyCost).toBe("number");
    expect(typeof standardCannon.range).toBe("number");
    expect(typeof standardCannon.projectileRadius).toBe("number");
    expect(typeof standardCannon.weight).toBe("number");
  });

  it("should define standardBattery with correct properties", () => {
    const { standardBattery } = components;
    expect(standardBattery).toBeDefined();
    expect(typeof standardBattery.maxEnergy).toBe("number");
    expect(typeof standardBattery.rechargeRate).toBe("number");
    expect(typeof standardBattery.weight).toBe("number");
  });

  it("should define standardMotor with correct properties", () => {
    const { standardMotor } = components;
    expect(standardMotor).toBeDefined();
    expect(typeof standardMotor.maxSpeed).toBe("number");
    expect(typeof standardMotor.maxRotationSpeed).toBe("number");
    expect(typeof standardMotor.energyCostPerMove).toBe("number");
    expect(typeof standardMotor.energyCostPerRotation).toBe("number");
    expect(typeof standardMotor.maxWeight).toBe("number");
    expect(typeof standardMotor.weight).toBe("number");
  });

  it("should define standardRadar with correct properties", () => {
    const { standardRadar } = components;
    expect(standardRadar).toBeDefined();
    expect(typeof standardRadar.range).toBe("number");
    expect(typeof standardRadar.weight).toBe("number");
  });
});
