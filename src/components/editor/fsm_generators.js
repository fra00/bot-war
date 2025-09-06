import { javascriptGenerator } from "blockly/javascript";

/**
 * Helper function to correctly generate comma-separated code for statement blocks
 * that represent elements in a JavaScript array.
 * @param {!Blockly.Block} block The block containing the statement input.
 * @param {string} inputName The name of the statement input.
 * @returns {string} The generated code, with elements separated by commas.
 */
const statementArrayToCode = (block, inputName) => {
  const statements = [];
  let currentBlock = block.getInputTargetBlock(inputName);
  while (currentBlock) {
    // The second argument `true` generates code for this block only,
    // not any connected next blocks. This is crucial.
    const code = javascriptGenerator.blockToCode(currentBlock, true);
    if (code) {
      statements.push(code);
    }
    currentBlock = currentBlock.getNextBlock();
  }
  return statements.join(",\n");
};

export const fsmGenerators = {
  fsm_root: function (block) {
    const constants =
      javascriptGenerator.statementToCode(block, "CONSTANTS") || "{}";
    const helpers = javascriptGenerator.statementToCode(block, "HELPERS") || "";
    const emergencyTransitions = statementArrayToCode(
      block,
      "EMERGENCY_TRANSITIONS"
    );
    const tacticalTransitions = statementArrayToCode(
      block,
      "TACTICAL_TRANSITIONS"
    );
    const states = javascriptGenerator.statementToCode(block, "STATES") || "";

    // The 'states' are concatenated with commas by their own generator, so we need to remove the last one.
    const finalStates = states.trim().endsWith(",")
      ? states.trim().slice(0, -1)
      : states.trim();

    const code = `({
  constants: ${constants},
  ${helpers}
  emergencyTransitions: [
    ${emergencyTransitions}
  ],
  tacticalTransitions: [
    ${tacticalTransitions}
  ],
  states: {
    ${finalStates}
  }
})`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
  },

  fsm_state: function (block) {
    const stateName = block.getFieldValue("STATE_NAME");
    const onEnter = javascriptGenerator.statementToCode(block, "ON_ENTER");
    const onExecute = javascriptGenerator.statementToCode(block, "ON_EXECUTE");
    const onExit = javascriptGenerator.statementToCode(block, "ON_EXIT");
    const transitions =
      javascriptGenerator.statementToCode(block, "TRANSITIONS") || "";

    const code = `'${stateName}': {
      onEnter: function(api, memory, context) {
        ${onEnter}
      },
      onExecute: function(api, memory, events, context) {
        ${onExecute}
      },
      onExit: function(api, memory) {
        ${onExit}
      },
      transitions: [
        ${transitions}
      ]
    },`; // The comma at the end is important for when multiple states are stacked.
    return code;
  },

  fsm_transition: function (block) {
    const targetState =
      javascriptGenerator.valueToCode(
        block,
        "TARGET_STATE",
        javascriptGenerator.ORDER_ATOMIC
      ) || "''";
    const description = block.getFieldValue("DESCRIPTION");
    const condition =
      javascriptGenerator.valueToCode(
        block,
        "CONDITION",
        javascriptGenerator.ORDER_ATOMIC
      ) || "function() { return false; }";

    let code = `{
  target: ${targetState},
  condition: ${condition},
  description: '${description.replace(/'/g, "\\'")}'
}`;
    // If there is a next block, add a comma.
    // statementToCode will add a newline.
    if (block.getNextBlock()) {
      code += ",";
    }
    return code;
  },
};
