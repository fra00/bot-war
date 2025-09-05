export const fsmBlocks = [
  // Blocco per la definizione principale dell'IA
  {
    type: "ai_definition",
    message0: "definizione IA %1 stato iniziale %2 %3 transizioni globali %4",
    args0: [
      {
        type: "input_dummy",
      },
      {
        type: "field_input",
        name: "INITIAL_STATE",
        text: "patrol",
      },
      {
        type: "input_dummy",
      },
      {
        type: "input_statement",
        name: "GLOBAL_TRANSITIONS",
        check: ["fsm_tactical_transition", "fsm_emergency_transition"],
      },
    ],
    message1: "stati %1",
    args1: [
      {
        type: "input_statement",
        name: "STATES",
        check: "fsm_state",
      },
    ],
    colour: 290,
    tooltip:
      "Blocco principale che definisce l'intera IA, i suoi stati e le transizioni globali.",
    helpUrl: "",
  },
  // Blocco per un singolo stato della FSM
  {
    type: "fsm_state",
    message0:
      "stato %1 %2 onEnter %3 onExecute %4 transizioni %5 %6 interrompibile da %7",
    args0: [
      { type: "field_input", name: "STATE_NAME", text: "nome_stato" },
      { type: "input_dummy" },
      { type: "input_statement", name: "ON_ENTER" },
      { type: "input_statement", name: "ON_EXECUTE" },
      {
        type: "input_statement",
        name: "TRANSITIONS",
        check: "fsm_transition",
      },
      { type: "input_dummy" },
      {
        type: "input_statement",
        name: "INTERRUPTIBLE_BY",
        check: "StateReference",
      },
    ],
    previousStatement: "fsm_state",
    nextStatement: "fsm_state",
    colour: 290,
    tooltip:
      "Definisce un singolo stato, le sue azioni e le transizioni locali.",
    helpUrl: "",
  },
  // Blocco per una transizione
  {
    type: "fsm_transition",
    message0: "se %1 vai a %2 (descrizione: %3)",
    args0: [
      { type: "input_value", name: "CONDITION", check: "Boolean" },
      { type: "field_input", name: "TARGET", text: "nome_stato" },
      { type: "field_input", name: "DESCRIPTION", text: "opzionale" },
    ],
    inputsInline: true,
    previousStatement: "fsm_transition",
    nextStatement: "fsm_transition",
    colour: 290,
    tooltip: "Definisce una transizione all'interno di uno stato.",
    helpUrl: "",
  },
  {
    type: "fsm_tactical_transition",
    message0: "transizione tattica globale a %1",
    args0: [
      {
        type: "field_input",
        name: "TARGET",
        text: "nome_stato",
      },
    ],
    message1: "se %1",
    args1: [
      {
        type: "input_value",
        name: "CONDITION",
        check: "Boolean",
        align: "RIGHT",
      },
    ],
    message2: "descrizione %1",
    args2: [
      {
        type: "field_input",
        name: "DESCRIPTION",
        text: "descrizione transizione",
      },
    ],
    previousStatement: ["fsm_tactical_transition", "fsm_emergency_transition"],
    nextStatement: ["fsm_tactical_transition", "fsm_emergency_transition"],
    colour: 210,
    tooltip: "Definisce una transizione globale di tipo Tattico.",
    helpUrl: "",
  },
  {
    type: "fsm_emergency_transition",
    message0: "transizione di emergenza globale a %1",
    args0: [
      {
        type: "field_input",
        name: "TARGET",
        text: "nome_stato",
      },
    ],
    message1: "se %1",
    args1: [
      {
        type: "input_value",
        name: "CONDITION",
        check: "Boolean",
        align: "RIGHT",
      },
    ],
    message2: "descrizione %1",
    args2: [
      {
        type: "field_input",
        name: "DESCRIPTION",
        text: "descrizione transizione",
      },
    ],
    previousStatement: ["fsm_tactical_transition", "fsm_emergency_transition"],
    nextStatement: ["fsm_tactical_transition", "fsm_emergency_transition"],
    colour: 10, // Un colore rossastro per l'emergenza
    tooltip: "Definisce una transizione globale di tipo Emergenza.",
    helpUrl: "",
  },
  {
    type: "fsm_return_state",
    message0: "vai allo stato %1",
    args0: [
      {
        type: "field_input",
        name: "STATE_NAME",
        text: "nome_stato",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 290,
    tooltip:
      "Termina l'esecuzione di questo stato e passa allo stato specificato.",
  },
  {
    type: "state_reference",
    message0: "stato %1",
    args0: [
      {
        type: "field_input",
        name: "STATE_NAME",
        text: "nome_stato",
      },
    ],
    previousStatement: "StateReference",
    nextStatement: "StateReference",
    colour: 290,
    tooltip: "Riferimento a uno stato per nome. Usato in 'interruptibleBy'.",
    helpUrl: "",
  },
];
