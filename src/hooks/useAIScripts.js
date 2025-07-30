import { useState, useCallback, useEffect } from "react";
import AIScriptService from "../services/AIScriptService";
import { compileAI } from "../game/ai/compiler";
import DefaultAI from "../game/ai/DefaultAI";

/**
 * Un custom hook per incapsulare tutta la logica di gestione
 * degli script AI del giocatore.
 */
export function useAIScripts() {
  const [scripts, setScripts] = useState([]);
  const [activeScript, setActiveScript] = useState(null);
  const [playerCode, setPlayerCode] = useState("");
  const [playerAI, setPlayerAI] = useState(() => DefaultAI);
  const [compileError, setCompileError] = useState(null);

  // Carica gli script al montaggio iniziale
  useEffect(() => {
    const allScripts = AIScriptService.getAllScripts();
    const lastActive = AIScriptService.loadLastActiveScript();
    setScripts(allScripts);
    if (lastActive) {
      setActiveScript(lastActive);
      setPlayerCode(lastActive.code);
      try {
        setPlayerAI(() => compileAI(lastActive.code));
      } catch (e) {
        setCompileError(e.message);
        setPlayerAI(() => DefaultAI);
      }
    }
  }, []);

  const handleSelectScript = useCallback(
    (scriptId) => {
      const scriptToSelect = scripts.find((s) => s.id === scriptId);
      if (scriptToSelect) {
        setActiveScript(scriptToSelect);
        setPlayerCode(scriptToSelect.code);
        AIScriptService.setLastActiveScriptId(scriptId);
      }
    },
    [scripts]
  );

  const handleDeleteScript = useCallback(
    (scriptId) => {
      if (scripts.length <= 1) {
        alert("Non puoi eliminare l'ultimo script.");
        return;
      }
      AIScriptService.deleteScript(scriptId);
      const remainingScripts = scripts.filter((s) => s.id !== scriptId);
      setScripts(remainingScripts);

      if (activeScript && activeScript.id === scriptId) {
        handleSelectScript(remainingScripts[0].id);
      }
    },
    [scripts, activeScript, handleSelectScript]
  );

  const handleCreateNewScript = useCallback(() => {
    const newScriptName = prompt("Inserisci il nome:", `Mio Script #${scripts.length + 1}`);
    if (newScriptName && newScriptName.trim() !== "") {
      const newScript = {
        name: newScriptName.trim(),
        code: `/**\n * @name ${newScriptName.trim()}\n */\n(class PlayerAI {\n  onTick(game, me) {\n    // Il tuo codice qui...\n    me.log('Tick!');\n  }\n})`,
      };
      const savedScript = AIScriptService.saveScript(newScript);
      setScripts((prev) => [...prev, savedScript]);
      handleSelectScript(savedScript.id);
    }
  }, [scripts.length, handleSelectScript]);

  const handleSaveOnly = useCallback(() => {
    if (!activeScript) return;
    const updatedScript = { ...activeScript, code: playerCode };
    AIScriptService.saveScript(updatedScript);
    // Aggiorna lo stato locale per riflettere il salvataggio
    setActiveScript(updatedScript);
    setScripts((prev) =>
      prev.map((s) => (s.id === updatedScript.id ? updatedScript : s))
    );
  }, [playerCode, activeScript]);

  const handleUpdateAI = useCallback(() => {
    if (!activeScript) return { success: false };
    try {
      const newAI = compileAI(playerCode);
      const updatedScript = { ...activeScript, code: playerCode };
      AIScriptService.saveScript(updatedScript);
      setPlayerAI(() => newAI);
      setCompileError(null);
      setActiveScript(updatedScript);
      setScripts((prev) => prev.map((s) => (s.id === updatedScript.id ? updatedScript : s)));
      return { success: true };
    } catch (error) {
      setCompileError(`Error: ${error.message}`);
      return { success: false };
    }
  }, [playerCode, activeScript]);

  return { scripts, activeScript, playerCode, playerAI, compileError, setPlayerCode, handleSelectScript, handleDeleteScript, handleCreateNewScript, handleUpdateAI, handleSaveOnly };
}