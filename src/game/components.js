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
  energyCost: 5, // energia per colpo
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
  maxSpeed: 2,
  maxRotationSpeed: 5, // Gradi per tick al 100%
  maxWeight: 90, // Peso massimo supportato
  energyCostPerMove: 0.06, // energia per unità di velocità
  energyCostPerRotation: 0.02, // energia per grado di rotazione
};

// --- Componenti Radar ---
export const standardRadar = {
  name: "Standard Radar",
  range: 300,
  weight: 10,
};
