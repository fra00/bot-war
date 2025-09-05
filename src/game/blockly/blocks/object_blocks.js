export const objectBlocks = [
  {
    type: "object_get_property",
    message0: "proprietà %1 di %2",
    args0: [
      {
        type: "field_dropdown",
        name: "PROPERTY",
        options: [
          ["x", "x"],
          ["y", "y"],
          ["larghezza (width)", "width"],
          ["altezza (height)", "height"],
          ["distanza", "distance"],
          ["angolo", "angle"],
          ["tipo", "type"],
        ],
      },
      {
        type: "input_value",
        name: "OBJECT",
      },
    ],
    output: "Number",
    colour: 20,
    tooltip: "Ottiene una proprietà da un oggetto (es. un ostacolo).",
    helpUrl: "",
  },
  {
    type: "position_create",
    message0: "Crea posizione X: %1 Y: %2",
    args0: [
      {
        type: "input_value",
        name: "X",
        check: "Number",
      },
      {
        type: "input_value",
        name: "Y",
        check: "Number",
      },
    ],
    output: "Position",
    colour: 20,
    tooltip: "Crea un oggetto posizione con coordinate X e Y",
    helpUrl: "",
  },
];
