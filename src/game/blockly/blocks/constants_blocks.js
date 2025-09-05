export const constantsBlocks = [
  {
    type: "game_constant",
    message0: "costante %1",
    args0: [
      {
        type: "field_dropdown",
        name: "CONSTANT",
        options: [
          ["Tolleranza Angolo", "aimTolerance"],
          ["Velocità massima", "MAX_SPEED"],
          ["Velocità rotazione", "ROTATION_SPEED"],
          ["Velocità torretta", "TURRET_ROTATION_SPEED"],
          ["Velocità proiettile", "PROJECTILE_SPEED"],
          ["Raggio del bot", "BOT_RADIUS"],
        ],
      },
    ],
    output: "Number",
    colour: 100,
    tooltip: "Restituisce il valore di una costante di gioco.",
    helpUrl: "",
  },
];
