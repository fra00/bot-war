import { javascriptGenerator, Order } from "blockly/javascript";

export const actionGenerators = {
  api_log: function (block) {
    const message =
      javascriptGenerator.valueToCode(
        block,
        "MESSAGE",
        javascriptGenerator.ORDER_ATOMIC
      ) || "''";
    return `api.log(${message});\n`;
  },
  api_move_random: function (block) {
    // The original code "api.moveTo(api.getRandomPoint());" is incorrect
    // if moveTo expects (x, y). This is the corrected version.
    return "\n  const p = api.getRandomPoint();\n  if (p) api.moveTo(p.x, p.y);\n";
  },
  api_fire: function (block) {
    const code = "api.fire();\n";
    return code;
  },
  api_turn: function (block, generator) {
    const degrees = generator.valueToCode(block, "DEGREES", Order.NONE) || "0";
    return `api.turn(${degrees});\n`;
  },
  aim_at_enemy: function (block) {
    const code = `{
  const enemy = api.scan();
  if (enemy) {
    api.aimAt(enemy.x, enemy.y);
  }
}\n`;
    return code;
  },
  get_enemy_position: function (block, generator) {
    const code = "api.scan()";
    return [code, generator.ORDER_FUNCTION_CALL];
  },
  api_move_to: function (block, generator) {
    const position =
      generator.valueToCode(block, "POSITION", Order.ATOMIC) ||
      "{ x: 0, y: 0 }";
    // Create a scope to avoid evaluating position twice and to handle nulls.
    return `{\n  const pos = ${position};\n  if (pos) api.moveTo(pos.y, pos.x);\n}\n`;
  },
  api_stop: function (block) {
    return "api.stop();\n";
  },
  api_strafe: function (block, generator) {
    const direction =
      generator.valueToCode(block, "DIRECTION", Order.ATOMIC) || "'left'";
    return `api.strafe(${direction});\n`;
  },
  action_sequence: function (block, generator) {
    const statements = generator.statementToCode(block, "DO");
    // Each statement is already a full line of code ending with ';\n'.
    // We'll split them, add 'await' to each, and join them back.
    // Awaiting a non-promise is a no-op, so it's safe.
    const lines = statements.trim().split(";\n").filter(Boolean);
    const awaitedLines = lines.map((line) => `await ${line};`);
    return awaitedLines.join("\n") + "\n";
  },
  actions_move_to_and_check: function (block, generator) {
    const position =
      generator.valueToCode(block, "POSITION", generator.ORDER_NONE) || "null";
    // Use an IIFE to create a scope, store the position in a temp variable,
    // and avoid evaluating it twice.
    const code = `((pos) => pos ? (api.moveTo(pos.x, pos.y) !== null) : false)(${position})`;
    return [code, generator.ORDER_FUNCTION_CALL];
  },
};
