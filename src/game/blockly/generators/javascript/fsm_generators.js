import { Order } from "blockly/javascript";

// Funzione di supporto per generare il codice per qualsiasi tipo di transizione globale.
const transitionGenerator = (block, generator) => {
  const targetState = JSON.stringify(block.getFieldValue("TARGET"));
  const condition =
    generator.valueToCode(block, "CONDITION", Order.ATOMIC) || "() => false";
  const description = JSON.stringify(block.getFieldValue("DESCRIPTION"));

  const codeObject = `    {
      target: ${targetState},
      condition: function (api, readOnlyMemory, context, events) {
        return (${condition})
      },
      description: ${description}
    }`;

  return codeObject;
};

export const fsmGenerators = {
  ai_definition: function (block, generator) {
    const initialState = JSON.stringify(block.getFieldValue("INITIAL_STATE"));
    const statesCode = generator.statementToCode(block, "STATES") || "";

    const tacticalTransitions = [];
    const emergencyTransitions = [];
    let currentBlock = block.getInputTargetBlock("GLOBAL_TRANSITIONS");

    while (currentBlock) {
      const code = generator.blockToCode(currentBlock, true);
      if (code) {
        if (currentBlock.type === "fsm_tactical_transition") {
          tacticalTransitions.push(code);
        } else if (currentBlock.type === "fsm_emergency_transition") {
          emergencyTransitions.push(code);
        }
      }
      currentBlock = currentBlock.getNextBlock();
    }

    const statesObject = `{
      ${statesCode.trim().replace(/,\s*$/, "")}
    }`;

    var tacticalCode = tacticalTransitions.map((c) => c.trim()).join(",\n");
    var emergencyCode = emergencyTransitions.map((c) => c.trim()).join(",\n");
    const code = `return {
  initialState: ${initialState},
  states: ${statesObject},
  tacticalTransitions: [
${tacticalCode}
  ],
  emergencyTransitions: [
${emergencyCode}
  ]
};`;
    return code;
  },

  fsm_state: function (block, generator) {
    // CORREZIONE: Il campo si chiama 'STATE_NAME' nella definizione originale del blocco.
    const stateName = JSON.stringify(block.getFieldValue("STATE_NAME"));

    // CORREZIONE: Usa i nomi corretti degli input ('ON_ENTER', 'ON_EXECUTE')
    // e controlla che esistano prima di generare il codice.
    const onEnterCode = block.getInput("ON_ENTER")
      ? generator.statementToCode(block, "ON_ENTER")
      : "";
    const onExecuteCode = block.getInput("ON_EXECUTE")
      ? generator.statementToCode(block, "ON_EXECUTE")
      : "";
    const onExitCode = block.getInput("ON_EXIT")
      ? generator.statementToCode(block, "ON_EXIT")
      : "";
    const transitions = generator.statementToCode(block, "TRANSITIONS") || "";

    // Logica robusta per l'iterazione. Previene il crash `Expecting string from statement block`.
    const interruptibleByStates = [];
    let currentInterruptBlock = block.getInputTargetBlock("INTERRUPTIBLE_BY");
    while (currentInterruptBlock) {
      let stateNameJson = null;
      // Controlla il tipo di blocco PRIMA di chiamare il generatore per evitare il crash.
      if (currentInterruptBlock.type === "state_reference_statement") {
        // Chiama il generatore per il blocco statement, che a sua volta gestisce il valore interno.
        const code = generator.blockToCode(currentInterruptBlock);
        stateNameJson = code.trim().replace(/,$/, "");
      } else if (currentInterruptBlock.type === "state_reference") {
        // Estrae il valore direttamente dal blocco valore, se l'utente lo collega per errore.
        stateNameJson = JSON.stringify(
          currentInterruptBlock.getFieldValue("STATE_NAME")
        );
      }

      if (stateNameJson) {
        interruptibleByStates.push(stateNameJson);
      }
      currentInterruptBlock = currentInterruptBlock.getNextBlock();
    }

    const transitionsArray = `[${transitions.trim().replace(/,\s*$/, "")}]`;
    const interruptibleByArray =
      interruptibleByStates.length > 0
        ? `[${interruptibleByStates.join(", ")}]`
        : "null";

    const stateObject = `{
      onEnter: function(api, readOnlyMemory, context) { ${onEnterCode} },
      onExecute: function(api, readOnlyMemory, events, context) { ${onExecuteCode} },
      onExit: function(api, readOnlyMemory) { ${onExitCode} },
      interruptibleBy: ${interruptibleByArray},
      transitions: ${transitionsArray}
    }`;

    return `${stateName}: ${stateObject},`;
  },

  fsm_transition: function (block, generator) {
    // CORREZIONE: Basato sulla definizione originale del blocco, 'TARGET' è un campo di testo.
    const targetState = JSON.stringify(block.getFieldValue("TARGET"));
    const condition =
      generator.valueToCode(block, "CONDITION", Order.ATOMIC) || "false";
    const code = `{
      target: ${targetState},
      condition: function (api, readOnlyMemory, context) {
        return (${condition})
      },
    }`;
    return code + ",\n";
  },

  fsm_tactical_transition: function (block, generator) {
    return transitionGenerator(block, generator);
  },

  fsm_emergency_transition: function (block, generator) {
    const targetState = JSON.stringify(block.getFieldValue("TARGET"));
    const condition =
      generator.valueToCode(block, "CONDITION", Order.ATOMIC) || "() => false";
    const description = JSON.stringify(block.getFieldValue("DESCRIPTION"));
    const codeObject = `    {
      target: ${targetState},
      condition: function (api, readOnlyMemory, context, events) {
        return (${condition})
      },
      description: ${description},
      isEmergency: true
    }`;
    return codeObject;
  },

  state_reference: function (block, generator) {
    const stateName = block.getFieldValue("STATE_NAME");
    return [JSON.stringify(stateName), Order.ATOMIC];
  },

  state_reference_statement: function (block, generator) {
    const stateName =
      generator.valueToCode(block, "STATE", Order.ATOMIC) || '""';
    return `${stateName},`;
  },

  fsm_return_state: function (block, generator) {
    // CORREZIONE: Ripristinato il generatore corretto per questo blocco.
    // Questo assume che il blocco sia uno statement block con un field_input 'STATE_NAME'.
    const stateName = block.getFieldValue("STATE_NAME");
    return `return ${JSON.stringify(stateName)};\n`;
  },

  // --- Generatori Oggetti ---
  position_get_coordinate: function (block, generator) {
    const coordinate = block.getFieldValue("COORDINATE").toLowerCase();
    const position =
      generator.valueToCode(block, "POSITION", Order.MEMBER) || "{x:0, y:0}";
    const code = `${position}.${coordinate}`;
    return [code, Order.MEMBER];
  },

  position_create: function (block, generator) {
    const x = generator.valueToCode(block, "X", Order.NONE) || "0";
    const y = generator.valueToCode(block, "Y", Order.NONE) || "0";
    const code = `{ x: ${x}, y: ${y} }`;
    return [code, Order.ATOMIC];
  },

  object_get_property: function (block, generator) {
    const property = block.getFieldValue("PROPERTY");
    const object = generator.valueToCode(block, "OBJECT", Order.MEMBER) || "{}";
    const code = `${object}['${property}']`;
    return [code, Order.MEMBER];
  },
};
