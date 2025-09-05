import { javascriptGenerator, Order } from "blockly/javascript";

export const customFunctionsGenerators = {
  custom_function_define: function (block) {
    const funcName = block.getFieldValue("NAME");
    const params = block.getFieldValue("PARAMS");
    const code = block.getFieldValue("CODE");

    // Sanitize function name to be a valid JS identifier
    const sanitizedFuncName = funcName.replace(/\s/g, "_");

    const functionCode = `function ${sanitizedFuncName}(${params}) {\n${code}\n}`;

    // Add the function definition to the top of the generated code.
    // The prefix prevents collisions with other definitions.
    javascriptGenerator.definitions_["custom_function_" + sanitizedFuncName] =
      functionCode;

    // This block itself doesn't produce executable code in the main flow.
    return null;
  },

  custom_function_call: function (block, generator) {
    const funcName = block.getFieldValue("NAME");
    const sanitizedFuncName = funcName.replace(/\s/g, "_");
    const args = generator.valueToCode(block, "ARGS", Order.ATOMIC) || "[]";

    const code = `${sanitizedFuncName}(...${args})`;

    return [code, Order.FUNCTION_CALL];
  },
  debug_breakpoint: function (block, generator) {
    return "debugger;\n";
  },
};
