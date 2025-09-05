export const localScopeGenerators = {
  local_scope: function (block, generator) {
    const variables = generator.statementToCode(block, "VARIABLES");
    const body = generator.statementToCode(block, "BODY");
    // The parent FSM generator is fragile and fails to close its braces
    // when it encounters a raw block scope. Adding a semicolon after
    // the block makes it a valid "empty statement" and satisfies the
    // parent generator, preventing it from breaking.
    const code = `\n${variables}${body};\n`;
    return code;
  },
  local_declare_variable: function (block, generator) {
    const varName = block.getFieldValue("VAR_NAME");
    const initialValue =
      generator.valueToCode(
        block,
        "INITIAL_VALUE",
        generator.ORDER_ASSIGNMENT
      ) || "0";
    return `let ${varName} = ${initialValue};\n`;
  },
  local_set_variable: function (block, generator) {
    const varName = block.getFieldValue("VAR_NAME");
    const value =
      generator.valueToCode(block, "VALUE", generator.ORDER_ASSIGNMENT) || "0";
    return `${varName} = ${value};\n`;
  },
  local_get_variable: function (block, generator) {
    const varName = block.getFieldValue("VAR_NAME");
    return [varName, generator.ORDER_ATOMIC];
  },
};
