import { javascriptGenerator, Order } from "blockly/javascript";

export const objectGenerators = {
  object_get_property: function (block) {
    const property = block.getFieldValue("PROPERTY");
    const object =
      javascriptGenerator.valueToCode(block, "OBJECT", Order.MEMBER) || "{}";
    const code = `${object}['${property}']`;
    return [code, Order.MEMBER];
  },
  position_create: function (block) {
    const x = javascriptGenerator.valueToCode(block, "X", Order.ATOMIC) || 0;
    const y = javascriptGenerator.valueToCode(block, "Y", Order.ATOMIC) || 0;
    const code = `({ x: ${x}, y: ${y} })`;
    return [code, Order.ATOMIC];
  },
};
