import { describe, it, expect } from "vitest";
import { compileAI } from "../game/ai/compiler.js";

describe("AI Compiler", () => {
  it("should successfully compile valid AI code", () => {
    const validCode = `({
      run: (api) => { /* do nothing */ }
    })`;
    const ai = compileAI(validCode);
    expect(ai).toBeTypeOf("object");
    expect(ai).not.toBeNull();
    expect(ai.run).toBeTypeOf("function");
  });

  it("should successfully compile valid AI code with a state property", () => {
    const validCode = `({
      state: {
        isAttacking: false
      },
      run: function(api) {
        this.state.isAttacking = true;
      }
    })`;
    const ai = compileAI(validCode);
    expect(ai).toBeTypeOf("object");
    expect(ai.state).toEqual({ isAttacking: false });
    expect(ai.run).toBeTypeOf("function");
    // La validazione interna non dovrebbe lanciare errori
  });

  it("should throw an error for code with a syntax error", () => {
    const invalidCode = `({
      run: (api) => { console.log("hello" } // Parentesi di chiusura mancante
    })`;
    // Il messaggio di errore può variare tra i motori JS, quindi verifichiamo solo che venga lanciato un errore.
    expect(() => compileAI(invalidCode)).toThrow();
  });

  it("should throw an error if the code does not evaluate to an object", () => {
    const nonObjectCode = `"a string"`;
    expect(() => compileAI(nonObjectCode)).toThrow(
      "AI code must evaluate to an object."
    );
  });

  it("should throw an error if the code evaluates to null", () => {
    const nullCode = `null`;
    expect(() => compileAI(nullCode)).toThrow(
      "AI code must evaluate to an object."
    );
  });

  it("should throw an error if the AI object is missing the 'run' method", () => {
    const noRunMethodCode = `({ someOtherProperty: true })`;
    expect(() => compileAI(noRunMethodCode)).toThrow(
      "The AI object must have a 'run' method."
    );
  });

  it("should throw an error if 'run' is not a function", () => {
    const runNotFunctionCode = `({ run: 123 })`;
    expect(() => compileAI(runNotFunctionCode)).toThrow(
      "The AI object must have a 'run' method."
    );
  });

  it("should throw a descriptive error for runtime errors during validation", () => {
    const runtimeErrorCode = `({
      run: (api) => { nonExistentFunction(); }
    })`;
    // Il messaggio esatto può variare, quindi usiamo una regex per essere più robusti.
    expect(() => compileAI(runtimeErrorCode)).toThrow(
      /Error during AI validation:.*not defined/
    );
  });
});
