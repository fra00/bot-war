export const actionBlocks = [
  {
    type: "api_log",
    message0: "log %1",
    args0: [{ type: "input_value", name: "MESSAGE" }],
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: "Stampa un messaggio nella console del bot.",
  },
  {
    type: "api_move_random",
    message0: "muovi a caso",
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: "Muove il bot verso una posizione casuale.",
  },
  {
    type: "api_fire",
    message0: "fuoco",
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: "Spara un proiettile nella direzione della torretta.",
  },
  {
    type: "api_turn",
    message0: "ruota di %1 gradi",
    args0: [{ type: "input_value", name: "DEGREES", check: "Number" }],
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: "Ruota il corpo del bot del numero di gradi specificato.",
  },
  {
    type: "aim_at_enemy",
    message0: "mira al nemico",
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: "Ruota la torretta per mirare alla posizione nota del nemico.",
  },
  {
    type: "api_move_to",
    message0: "vai a %1",
    args0: [{ type: "input_value", name: "POSITION", check: "Position" }],
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: "Muove il bot verso la posizione specificata.",
  },
  {
    type: "api_stop",
    message0: "fermati",
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip: "Ferma ogni movimento del bot.",
  },
  {
    type: "api_strafe",
    message0: "schiva in direzione %1",
    args0: [
      {
        type: "input_value",
        name: "DIRECTION",
        check: "String",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip:
      "Si muove lateralmente. La direzione deve essere 'left' o 'right'.",
  },
  {
    type: "action_sequence",
    message0: "esegui in sequenza %1 %2",
    args0: [
      {
        type: "input_dummy",
      },
      {
        type: "input_statement",
        name: "DO",
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 160,
    tooltip:
      "Esegue una serie di azioni una dopo l'altra, attendendo il completamento di ciascuna.",
    helpUrl: "",
  },
  {
    type: "actions_move_to_and_check",
    message0: "tenta di muoversi verso %1",
    args0: [
      {
        type: "input_value",
        name: "POSITION",
        check: "Position",
      },
    ],
    output: "Boolean",
    colour: 160,
    tooltip:
      "Tenta di muovere il bot verso la posizione specificata. Restituisce 'vero' se il movimento è possibile, 'falso' altrimenti.",
  },
  {
    type: "api_get_orbiting_position",
    message0: "punto orbitante intorno a %1 a distanza %2 in direzione %3",
    args0: [
      {
        type: "input_value",
        name: "TARGET_POINT",
        check: "Position",
      },
      {
        type: "input_value",
        name: "DISTANCE",
        check: "Number",
      },
      {
        type: "input_value",
        name: "DIRECTION",
        check: "String",
      },
    ],
    output: "Position",
    colour: 230, // Perception color
    tooltip: "Calcola un punto di orbita attorno a un punto bersaglio.",
    helpUrl: "",
  },
];
