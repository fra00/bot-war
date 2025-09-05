import { javascriptGenerator, Order } from "blockly/javascript";

export const memoryGenerators = {
  memory_set: function (block, generator) {
    //const key = generator.valueToCode(block, "KEY", Order.ATOMIC) || "''";
    const key = generator.quote_(block.getFieldValue("KEY"));
    const value = generator.valueToCode(block, "VALUE", Order.NONE) || "null";
    const code = `api.updateMemory({ [${key}]: ${value} });\n`;
    return code;
  },
  memory_get: function (block, generator) {
    //const key = generator.valueToCode(block, "KEY", Order.ATOMIC) || "''";
    const key = generator.quote_(block.getFieldValue("KEY"));
    // The || {} ensures that we don't crash if memory is null.
    const code = `(api.getMemory() || {})[${key}]`;
    return [code, Order.MEMBER];
  },
};
