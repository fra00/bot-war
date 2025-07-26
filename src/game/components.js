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
  energyCost: 2,
  projectileRadius: 3,
};

// --- Componenti Batteria ---
export const standardBattery = {
  name: "Standard Battery",
  weight: 10,
  maxEnergy: 100,
  rechargeRate: 0.1, // energia per tick
};

// --- Componenti Motore ---
export const standardMotor = {
  name: "Standard Motor",
  weight: 25,
  maxSpeed: 3,
  maxRotationSpeed: 5, // Gradi per tick al 100%
  maxWeight: 75,
  energyCostPerMove: 0.05, // energia per unità di velocità
  energyCostPerRotation: 0.01, // energia per grado di rotazione
};

// --- Componenti Radar ---
export const standardRadar = {
  name: "Standard Radar",
  range: 300,
  weight: 10,
};
