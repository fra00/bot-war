export const toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Macchina a Stati",
      colour: "290",
      contents: [
        {
          kind: "block",
          type: "ai_definition",
        },
        {
          kind: "block",
          type: "fsm_state",
        },
        {
          kind: "block",
          type: "fsm_transition",
        },
        {
          kind: "block",
          type: "fsm_tactical_transition",
        },
        {
          kind: "block",
          type: "fsm_emergency_transition",
        },
        {
          kind: "block",
          type: "fsm_return_state",
        },
        {
          kind: "block",
          type: "state_reference",
        },
      ],
    },
    {
      kind: "category",
      name: "Azioni",
      colour: "160",
      contents: [
        {
          kind: "block",
          type: "api_log",
        },
        {
          kind: "block",
          type: "api_move_random",
        },
        {
          kind: "block",
          type: "api_fire",
        },
        {
          kind: "block",
          type: "api_turn",
        },
        {
          kind: "block",
          type: "aim_at_enemy",
        },
        {
          kind: "block",
          type: "api_move_to",
        },
        {
          kind: "block",
          type: "actions_move_to_and_check",
        },
        {
          kind: "block",
          type: "api_stop",
        },
        {
          kind: "block",
          type: "api_strafe",
          inputs: {
            DISTANCE: { shadow: { type: "math_number", fields: { NUM: 100 } } },
          },
        },
        {
          kind: "block",
          type: "action_sequence",
        },
      ],
    },
    {
      kind: "category",
      name: "Percezioni",
      colour: "230",
      contents: [
        {
          kind: "block",
          type: "is_enemy_visible",
        },
        {
          kind: "block",
          type: "context_battery_percent",
        },
        {
          kind: "block",
          type: "get_enemy_distance",
        },
        {
          kind: "block",
          type: "get_enemy_angle",
        },
        {
          kind: "block",
          type: "was_hit",
        },
        {
          kind: "block",
          type: "is_turret_aligned",
        },
        {
          kind: "block",
          type: "context_my_x",
        },
        {
          kind: "block",
          type: "context_my_y",
        },
        {
          kind: "block",
          type: "get_enemy_position",
        },
        {
          kind: "block",
          type: "context_is_moving",
        },
        {
          kind: "block",
          type: "context_can_fire",
        },
        {
          kind: "block",
          type: "get_arena_width",
        },
        {
          kind: "block",
          type: "get_arena_height",
        },
        {
          kind: "block",
          type: "is_projectile_incoming",
        },
        {
          kind: "block",
          type: "is_wall_collision",
        },
        {
          kind: "block",
          type: "api_is_queue_empty",
        },
        {
          kind: "block",
          type: "api_is_obstacle_ahead",
        },
        {
          kind: "block",
          type: "api_is_position_valid",
          inputs: {
            POSITION: { shadow: { type: "position_create" } },
          },
        },
        {
          kind: "block",
          type: "api_get_state",
        },
        {
          kind: "block",
          type: "api_get_random_point",
        },
        {
          kind: "block",
          type: "api_is_line_of_sight_clear",
          inputs: {
            POSITION: { shadow: { type: "get_enemy_position" } },
          },
        },
        {
          kind: "block",
          type: "api_scan_obstacles",
        },
        {
          kind: "block",
          type: "api_get_events",
        },
      ],
    },
    {
      kind: "sep",
    },
    {
      kind: "category",
      kind: "category",
      name: "Logica",
      colour: "%{BKY_LOGIC_HUE}",
      contents: [
        { kind: "block", type: "controls_if" },
        { kind: "block", type: "logic_compare" },
        { kind: "block", type: "logic_operation" },
        { kind: "block", type: "logic_negate" },
        { kind: "block", type: "logic_null" },
        { kind: "block", type: "logic_ternary" },
      ],
    },
    {
      kind: "category",
      name: "Cicli",
      colour: "%{BKY_LOOPS_HUE}",
      contents: [
        {
          kind: "block",
          type: "controls_repeat_ext",
          inputs: {
            TIMES: {
              shadow: {
                type: "math_number",
                fields: { NUM: 10 },
              },
            },
          },
        },
        { kind: "block", type: "controls_whileUntil" },
        {
          kind: "block",
          type: "controls_for",
          inputs: {
            FROM: { shadow: { type: "math_number", fields: { NUM: 1 } } },
            TO: { shadow: { type: "math_number", fields: { NUM: 10 } } },
            BY: { shadow: { type: "math_number", fields: { NUM: 1 } } },
          },
        },
        { kind: "block", type: "controls_forEach" },
        { kind: "block", type: "controls_flow_statements" },
      ],
    },
    {
      kind: "category",
      name: "Matematica",
      colour: "%{BKY_MATH_HUE}",
      contents: [
        { kind: "block", type: "math_arithmetic" },
        { kind: "block", type: "math_single" },
      ],
    },
    {
      kind: "category",
      name: "Valori",
      colour: "%{BKY_MATH_HUE}",
      contents: [
        {
          kind: "block",
          type: "text",
        },
        {
          kind: "block",
          type: "math_number",
          fields: { NUM: 0 },
        },
        {
          kind: "block",
          type: "logic_boolean",
        },
      ],
    },
    {
      kind: "category",
      name: "Liste",
      colour: "%{BKY_LISTS_HUE}",
      contents: [
        {
          kind: "block",
          type: "lists_create_with",
          extraState: {
            itemCount: 2,
          },
        },
        {
          kind: "block",
          type: "lists_repeat",
          inputs: {
            NUM: { shadow: { type: "math_number", fields: { NUM: 5 } } },
          },
        },
        {
          kind: "block",
          type: "lists_length",
        },
        {
          kind: "block",
          type: "lists_isEmpty",
        },
        { kind: "block", type: "lists_indexOf" },
        { kind: "block", type: "lists_getIndex" },
        { kind: "block", type: "lists_setIndex" },
        {
          kind: "block",
          type: "lists_getSublist",
        },
        {
          kind: "block",
          type: "lists_sort",
        },
        {
          kind: "block",
          type: "lists_split",
          inputs: {
            DELIM: { shadow: { type: "text", fields: { TEXT: "," } } },
          },
        },
      ],
    },
    {
      kind: "category",
      name: "Oggetti",
      colour: 20,
      contents: [
        {
          kind: "block",
          type: "object_get_property",
        },
        {
          kind: "block",
          type: "position_create",
          inputs: {
            X: { shadow: { type: "math_number", fields: { NUM: 100 } } },
            Y: { shadow: { type: "math_number", fields: { NUM: 100 } } },
          },
        },
      ],
    },
    {
      kind: "sep",
    },
    // {
    //   kind: "category",
    //   name: "Funzioni",
    //   colour: "%{BKY_PROCEDURES_HUE}",
    //   custom: "PROCEDURE",
    // },
    {
      kind: "category",
      name: "Variabili",
      colour: "%{BKY_VARIABLES_HUE}",
      custom: "VARIABLE",
    },
    {
      kind: "category",
      name: "Variabili Locali",
      colour: "%{BKY_VARIABLES_HUE}",
      contents: [
        {
          kind: "block",
          type: "local_scope",
        },
        {
          kind: "block",
          type: "local_declare_variable",
          inputs: {
            INITIAL_VALUE: {
              shadow: { type: "math_number", fields: { NUM: 0 } },
            },
          },
        },
        {
          kind: "block",
          type: "local_set_variable",
        },
        {
          kind: "block",
          type: "local_get_variable",
        },
      ],
    },
    {
      kind: "category",
      name: "Memoria",
      colour: "%{BKY_VARIABLES_HUE}",
      contents: [
        {
          kind: "block",
          type: "memory_set",
        },
        {
          kind: "block",
          type: "memory_get",
        },
      ],
    },
    {
      kind: "category",
      name: "Costanti Custom",
      colour: 280,
      contents: [
        {
          kind: "block",
          type: "custom_constant_define",
        },
        {
          kind: "block",
          type: "custom_constant_get",
        },
      ],
    },
    {
      kind: "category",
      name: "Funzioni Custom",
      colour: 290,
      contents: [
        {
          kind: "block",
          type: "custom_function_define",
        },
        {
          kind: "block",
          type: "custom_function_call",
          inputs: {
            ARGS: {
              shadow: {
                type: "lists_create_with",
                extraState: { itemCount: 0 },
              },
            },
          },
        },
        {
          kind: "block",
          type: "debug_breakpoint",
        },
      ],
    },
    {
      kind: "category",
      name: "Costanti di Gioco",
      colour: 100,
      contents: [
        {
          kind: "block",
          type: "game_constant",
        },
      ],
    },
  ],
};
