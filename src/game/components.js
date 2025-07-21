// --- Componenti Armatura ---
export const standardArmor = {
  name: "Standard Plating",
  weight: 20,
  maxHp: 50,
};

// --- Componenti Cannone ---
export const standardCannon = {
  name: "Standard Cannon",
  weight: 15,
  damage: 10,
  fireRate: 20, // tick tra un colpo e l'altro (cooldown)
  range: 450,
  energyCost: 10,
};

// --- Componenti Batteria ---
export const standardBattery = {
  name: "Standard Battery",
  weight: 10,
  maxEnergy: 100,
  rechargeRate: 0.5, // energia per tick
};

// --- Componenti Motore ---
export const standardMotor = {
  name: "Standard Motor",
  weight: 25,
  maxSpeed: 3,
  maxWeight: 75,
  energyCostPerMove: 0.2, // energia per unità di velocità
};

// --- Componenti Radar ---
export const standardRadar = {
  name: "Standard Radar",
  range: 300,
  weight: 10,
};
