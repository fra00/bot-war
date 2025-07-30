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
        // Il template precedente generava una classe, ma il nostro compilatore si aspetta un oggetto.
        // Questo nuovo template è corretto e coerente con il resto dell'applicazione.
        code: `({\n  state: {},\n\n  /**\n   * @param {object} api - L'API del robot per interagire con il gioco.\n   */\n  run: function (api) {\n    // Il tuo codice qui...\n    api.log('Tick!');\n  }\n})`,
      };
      const savedScript = AIScriptService.saveScript(newScript);
      setScripts((prev) => [...prev, savedScript]);
      handleSelectScript(savedScript.id);
    }
  }, [scripts.length, handleSelectScript]);

  const handleSaveOnly = useCallback(() => {
    if (!activeScript) return { success: false };

    try {
      // Tenta di compilare il codice per validarlo.
      // La funzione compileAI lancerà un errore se il codice non è valido.
      compileAI(playerCode);

      // Se la compilazione ha successo, procedi con il salvataggio.
      const updatedScript = { ...activeScript, code: playerCode };
      AIScriptService.saveScript(updatedScript);
      setActiveScript(updatedScript);
      setScripts((prev) =>
        prev.map((s) => (s.id === updatedScript.id ? updatedScript : s))
      );
      // Imposta questo script come l'ultimo attivo solo se il salvataggio ha successo.
      AIScriptService.setLastActiveScriptId(updatedScript.id);
      setCompileError(null); // Pulisci eventuali errori precedenti
      return { success: true };
    } catch (error) {
      // Se la compilazione fallisce, imposta il messaggio di errore e non salvare.
      setCompileError(`Errore di compilazione: ${error.message}`);
      return { success: false };
    }
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
      setCompileError(`Errore di compilazione: ${error.message}`);
      return { success: false };
    }
  }, [playerCode, activeScript]);

  return { scripts, activeScript, playerCode, playerAI, compileError, setPlayerCode, handleSelectScript, handleDeleteScript, handleCreateNewScript, handleUpdateAI, handleSaveOnly };
}