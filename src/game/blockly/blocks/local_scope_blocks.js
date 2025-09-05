export const localScopeBlocks = [
  // Block for creating a scope.
  {
    type: "local_scope",
    message0: "con variabili locali %1 %2 fai %3",
    args0: [
      {
        type: "input_dummy",
      },
      {
        type: "input_statement",
        name: "VARIABLES",
        check: "local_declare_variable",
      },
      {
        type: "input_statement",
        name: "BODY",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: "%{BKY_VARIABLES_HUE}",
    tooltip:
      "Definisce uno scope locale per dichiarare e usare variabili temporanee.",
    helpUrl: "",
  },
  // Block for declaring a variable.
  {
    type: "local_declare_variable",
    message0: "dichiara %1 = %2",
    args0: [
      {
        type: "field_input",
        name: "VAR_NAME",
        text: "miaVariabile",
      },
      {
        type: "input_value",
        name: "INITIAL_VALUE",
      },
    ],
    previousStatement: "local_declare_variable",
    nextStatement: "local_declare_variable",
    colour: "%{BKY_VARIABLES_HUE}",
    tooltip: "Dichiara una nuova variabile locale con un valore iniziale.",
    helpUrl: "",
  },
  // Block for setting a variable.
  {
    type: "local_set_variable",
    message0: "imposta %1 = %2",
    args0: [
      {
        type: "field_input",
        name: "VAR_NAME",
        text: "miaVariabile",
      },
      {
        type: "input_value",
        name: "VALUE",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: "%{BKY_VARIABLES_HUE}",
    tooltip: "Imposta il valore di una variabile locale.",
    helpUrl: "",
  },
  // Block for getting a variable.
  {
    type: "local_get_variable",
    message0: "%1",
    args0: [
      {
        type: "field_input",
        name: "VAR_NAME",
        text: "miaVariabile",
      },
    ],
    output: null,
    colour: "%{BKY_VARIABLES_HUE}",
    tooltip: "Ottiene il valore di una variabile locale.",
    helpUrl: "",
  },
];
