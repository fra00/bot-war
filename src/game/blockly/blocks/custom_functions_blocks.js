export const customFunctionsBlocks = [
  {
    type: "custom_function_define",
    message0: "definisci funzione JS %1 con parametri %2",
    args0: [
      {
        type: "field_input",
        name: "NAME",
        text: "miaFunzione",
      },
      {
        type: "field_input",
        name: "PARAMS",
        text: "arg1, arg2",
      },
    ],
    message1: "codice %1",
    args1: [
      {
        type: "field_multilinetext",
        name: "CODE",
        text: "return arg1 + arg2;",
        spellcheck: false,
      },
    ],
    colour: 290,
    tooltip:
      "Definisce una funzione JavaScript riutilizzabile. I parametri sono una stringa separata da virgole.",
    helpUrl: "",
  },
  {
    type: "custom_function_call",
    message0: "chiama funzione %1 con argomenti %2",
    args0: [
      {
        type: "field_input",
        name: "NAME",
        text: "miaFunzione",
      },
      {
        type: "input_value",
        name: "ARGS",
        check: "Array",
      },
    ],
    output: null,
    colour: 290,
    tooltip:
      "Chiama una funzione JavaScript definita, passando una lista di argomenti.",
    helpUrl: "",
  },
  {
    type: "debug_breakpoint",
    message0: "punto di interruzione (debugger)",
    previousStatement: null,
    nextStatement: null,
    colour: 20, // Un colore rossastro per evidenziarlo
    tooltip:
      "Inserisce un punto di interruzione nel codice. L'esecuzione si fermerà qui se gli strumenti per sviluppatori del browser sono aperti.",
    helpUrl:
      "https://developer.mozilla.org/it/docs/Web/JavaScript/Reference/Statements/debugger",
  },
];
