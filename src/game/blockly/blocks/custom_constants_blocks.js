export const customConstantsBlocks = [
  {
    type: "custom_constant_define",
    message0: "definisci costante %1 valore %2",
    args0: [
      {
        type: "field_input",
        name: "NAME",
        text: "NOME_COSTANTE",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 280,
    tooltip: "Definisce una costante personalizzata.",
    helpUrl: "",
  },
  {
    type: "custom_constant_get",
    message0: "ottieni costante %1",
    args0: [
      {
        type: "field_input",
        name: "NAME",
        text: "NOME_COSTANTE",
      },
    ],
    output: null,
    colour: 280,
    tooltip: "Restituisce il valore di una costante personalizzata.",
    helpUrl: "",
  },
];
