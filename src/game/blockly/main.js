import * as Blockly from "blockly";
import { FieldTextInput } from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { actionBlocks } from "./blocks/action_blocks";
import { fsmBlocks } from "./blocks/fsm_blocks";
import { perceptionBlocks } from "./blocks/perception_blocks";
import { memoryBlocks } from "./blocks/memory_blocks";
import { objectBlocks } from "./blocks/object_blocks";
import { constantsBlocks } from "./blocks/constants_blocks";
import { customFunctionsBlocks } from "./blocks/custom_functions_blocks";
import { customConstantsBlocks } from "./blocks/custom_constants_blocks";
import { localScopeBlocks } from "./blocks/local_scope_blocks";
import { customConstantsGenerators } from "./generators/javascript/custom_constants_generators";
import { actionGenerators } from "./generators/javascript/action_generators";
import { fsmGenerators } from "./generators/javascript/fsm_generators";
import { perceptionGenerators } from "./generators/javascript/perception_generators";
import { memoryGenerators } from "./generators/javascript/memory_generators";
import { objectGenerators } from "./generators/javascript/object_generators";
import { constantsGenerators } from "./generators/javascript/constants_generators";
import { customFunctionsGenerators } from "./generators/javascript/custom_functions_generators";
import { localScopeGenerators } from "./generators/javascript/local_scope_generators";

// Funzione per inizializzare i blocchi e i generatori custom.
// Verrà chiamata una sola volta.
export const initializeBlockly = () => {
  // Registra il campo multilinea custom
  Blockly.fieldRegistry.register("field_multilinetext", FieldTextInput);
  // Registra le definizioni dei blocchi
  Blockly.defineBlocksWithJsonArray(actionBlocks);
  Blockly.defineBlocksWithJsonArray(fsmBlocks);
  Blockly.defineBlocksWithJsonArray(perceptionBlocks);
  Blockly.defineBlocksWithJsonArray(memoryBlocks);
  Blockly.defineBlocksWithJsonArray(objectBlocks);
  Blockly.defineBlocksWithJsonArray(constantsBlocks);
  Blockly.defineBlocksWithJsonArray(customFunctionsBlocks);
  Blockly.defineBlocksWithJsonArray(customConstantsBlocks);
  Blockly.defineBlocksWithJsonArray(localScopeBlocks);
  Object.assign(javascriptGenerator, customConstantsGenerators);

  // Registra i generatori di codice per i blocchi
  Object.assign(javascriptGenerator.forBlock, actionGenerators);
  Object.assign(javascriptGenerator.forBlock, fsmGenerators);
  Object.assign(javascriptGenerator.forBlock, perceptionGenerators);
  Object.assign(javascriptGenerator.forBlock, memoryGenerators);
  Object.assign(javascriptGenerator.forBlock, objectGenerators);
  Object.assign(javascriptGenerator.forBlock, constantsGenerators);
  Object.assign(javascriptGenerator.forBlock, customFunctionsGenerators);
  Object.assign(javascriptGenerator.forBlock, localScopeGenerators);
};
