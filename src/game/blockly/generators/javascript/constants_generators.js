import { javascriptGenerator, Order } from "blockly/javascript";

export const constantsGenerators = {
  game_constant: function (block) {
    const constantName = block.getFieldValue("CONSTANT");
    const code = `context.constants.${constantName}`;
    return [code, Order.MEMBER];
  },
};
