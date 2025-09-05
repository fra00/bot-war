export const customConstantsGenerators = {
  custom_constant_define: function (block) {
    const name = block.getFieldValue("NAME");
    const value =
      Blockly.JavaScript.valueToCode(
        block,
        "VALUE",
        Blockly.JavaScript.ORDER_ATOMIC
      ) || "undefined";
    return `const ${name} = ${value};\n`;
  },
  custom_constant_get: function (block) {
    const name = block.getFieldValue("NAME");
    return [name, Blockly.JavaScript.ORDER_ATOMIC];
  },
};
