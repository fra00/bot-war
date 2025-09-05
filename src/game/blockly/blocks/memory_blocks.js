export const memoryBlocks = [
  {
    type: "memory_set",
    message0: "imposta nella memoria la chiave %1 al valore %2",
    args0: [
      {
        type: "field_input",
        name: "KEY",
        text: "chiave",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: "Imposta un valore nella memoria del bot, associato a una chiave.",
    helpUrl: "",
  },
  {
    type: "memory_get",
    message0: "leggi dalla memoria la chiave %1",
    args0: [
      {
        type: "field_input",
        name: "KEY",
        text: "chiave",
      },
    ],
    output: null,
    colour: 160,
    tooltip: "Legge un valore dalla memoria del bot, usando una chiave.",
    helpUrl: "",
  },
];
