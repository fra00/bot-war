import { useState, useCallback, useEffect } from "react";
import AIScriptService from "../services/AIScriptService";
import FirestoreService from "../services/FirestoreService";
import { compileAI } from "../game/ai/compiler";
import { minifyScript } from "../services/codeMinifier";
import DefaultAI from "../game/ai/DefaultAI";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/toast/ToastProvider";

/**
 * Un custom hook per incapsulare tutta la logica di gestione
 * degli script AI del giocatore, sia in locale che su Firestore.
 */
export function useAIScripts() {
  const [scripts, setScripts] = useState([]);
  const [activeScript, setActiveScript] = useState(null);
  const [playerCode, setPlayerCode] = useState("");
  const [playerAI, setPlayerAI] = useState(() => DefaultAI);
  const [compileError, setCompileError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Stato per il caricamento

  const { user } = useAuth();
  const { addToast } = useToast();

  // Carica gli script al montaggio iniziale
  useEffect(() => {
    const loadScripts = async () => {
      setIsLoading(true);
      setCompileError(null);
      let allScripts = [];
      let lastActiveId = null;

      if (user) {
        // Utente loggato: carica da Firestore
        try {
          allScripts = await FirestoreService.getUserBots(user.uid);
          // Firestore non ha un "last active", potremmo implementarlo in futuro.
          // Per ora, prendiamo il primo.
          lastActiveId = allScripts.length > 0 ? allScripts[0].id : null;
        } catch (error) {
          addToast("Errore nel caricamento degli script dal cloud.", "danger");
          console.error("Firestore load error:", error);
        }
      } else {
        // Utente non loggato: carica da localStorage
        allScripts = AIScriptService.getAllScripts();
        lastActiveId = AIScriptService.getLastActiveScriptId();
      }

      setScripts(allScripts);

      const scriptToActivate =
        allScripts.find((s) => s.id === lastActiveId) || allScripts[0];

      if (scriptToActivate) {
        // La struttura dati di Firestore ha il codice in `bot.script`
        const codeToLoad = scriptToActivate.script || scriptToActivate.code;
        setActiveScript(scriptToActivate);
        setPlayerCode(codeToLoad);
        try {
          setPlayerAI(() => compileAI(codeToLoad));
        } catch (e) {
          setCompileError(e.message);
          setPlayerAI(() => DefaultAI);
        }
      } else {
        // Nessuno script trovato, resetta allo stato iniziale
        setActiveScript(null);
        setPlayerCode("");
        setPlayerAI(() => DefaultAI);
      }
      setIsLoading(false);
    };

    loadScripts();
  }, [user, addToast]); // Ricarica quando l'utente cambia

  const handleSelectScript = useCallback(
    (scriptId) => {
      const scriptToSelect = scripts.find((s) => s.id === scriptId);
      if (scriptToSelect) {
        setActiveScript(scriptToSelect);
        const codeToLoad = scriptToSelect.script || scriptToSelect.code;
        setPlayerCode(codeToLoad);
        if (!user) {
          // Salva l'ultimo attivo solo per gli utenti non loggati
          AIScriptService.setLastActiveScriptId(scriptId);
        }
      }
    },
    [scripts, user]
  );

  const handleDeleteScript = useCallback(async (scriptId) => {
      if (scripts.length <= 1) {
        addToast("Non puoi eliminare l'ultimo script.", "warning");
        return;
      }

      if (user) {
        await FirestoreService.deleteBot(scriptId);
      } else {
        AIScriptService.deleteScript(scriptId);
      }

      const remainingScripts = scripts.filter((s) => s.id !== scriptId);
      setScripts(remainingScripts);

      if (activeScript && activeScript.id === scriptId) {
        handleSelectScript(remainingScripts[0].id);
      }
      addToast("Script eliminato.", "success");
    },
    [scripts, activeScript, handleSelectScript, user, addToast]
  );

  const handleCreateNewScript = useCallback(async () => {
    const newScriptName = prompt("Inserisci il nome:", `Mio Script #${scripts.length + 1}`);
    if (newScriptName && newScriptName.trim() !== "") {
      const code = `({\n  state: {},\n\n  /**\n   * @param {object} api - L'API del robot per interagire con il gioco.\n   */\n  run: function (api) {\n    // Il tuo codice qui...\n    api.log('Tick!');\n  }\n})`;
      const minifiedCode = minifyScript(code);

      const newScript = {
        name: newScriptName.trim(),
        script: code,
        multiplayerScript: minifiedCode,
      };

      let savedScript;
      if (user) {
        // Passiamo l'oggetto completo a createBot
        const newId = await FirestoreService.createBot(user.uid, {
          name: newScript.name,
          script: newScript.script,
          multiplayerScript: newScript.multiplayerScript,
        });
        savedScript = { ...newScript, id: newId, userId: user.uid };
      } else {
        savedScript = AIScriptService.saveScript(newScript);
      }

      setScripts((prev) => [...prev, savedScript]);
      handleSelectScript(savedScript.id);
      addToast("Nuovo script creato!", "success");
    }
  }, [scripts.length, handleSelectScript, user, addToast]);

  const handleSaveOnly = useCallback(async () => {
    if (!activeScript) return { success: false };

    try {
      // Tenta di compilare il codice per validarlo.
      // La funzione compileAI lancerà un errore se il codice non è valido.
      compileAI(playerCode);

      const minifiedCode = minifyScript(playerCode);
      const updatedScript = {
        ...activeScript,
        script: playerCode,
        multiplayerScript: minifiedCode,
      };

      if (user) {
        await FirestoreService.updateBot(activeScript.id, { script: playerCode, multiplayerScript: minifiedCode });
      } else {
        // Per localStorage, salviamo solo il codice principale
        updatedScript.code = playerCode;
        AIScriptService.saveScript(updatedScript);
        // Imposta questo script come l'ultimo attivo solo se il salvataggio ha successo.
        AIScriptService.setLastActiveScriptId(updatedScript.id);
      }

      setActiveScript(updatedScript);
      setScripts((prev) =>
        prev.map((s) => (s.id === updatedScript.id ? updatedScript : s))
      );
      setCompileError(null); // Pulisci eventuali errori precedenti
      return { success: true };
    } catch (error) {
      // Se la compilazione fallisce, imposta il messaggio di errore e non salvare.
      setCompileError(`Errore di compilazione: ${error.message}`);
      return { success: false };
    }
  }, [playerCode, activeScript, user]);

  const handleUpdateAI = useCallback(async () => {
    if (!activeScript) return { success: false };
    try {
      const newAI = compileAI(playerCode);

      const minifiedCode = minifyScript(playerCode);
      const updatedScript = {
        ...activeScript,
        script: playerCode,
        multiplayerScript: minifiedCode,
      };

      if (user) {
        await FirestoreService.updateBot(activeScript.id, { script: playerCode, multiplayerScript: minifiedCode });
      } else {
        // Per localStorage, salviamo solo il codice principale
        updatedScript.code = playerCode;
        AIScriptService.saveScript(updatedScript);
        AIScriptService.setLastActiveScriptId(updatedScript.id);
      }

      setPlayerAI(() => newAI);
      setCompileError(null);
      setActiveScript(updatedScript);
      setScripts((prev) => prev.map((s) => (s.id === updatedScript.id ? updatedScript : s)));

      return { success: true };
    } catch (error) {
      setCompileError(`Errore di compilazione: ${error.message}`);
      return { success: false };
    }
  }, [playerCode, activeScript, user]);

  const handleUpdateBotSettings = useCallback(async (botId, settings) => {
    if (!user) {
      addToast("Devi essere loggato per modificare le impostazioni cloud.", "danger");
      return;
    }
    try {
      await FirestoreService.updateBot(botId, settings);
      const updatedScript = { ...scripts.find(s => s.id === botId), ...settings };
      setScripts(prev => prev.map(s => s.id === botId ? updatedScript : s));
      if (activeScript?.id === botId) {
        setActiveScript(updatedScript);
      }
      addToast("Impostazioni del bot aggiornate!", "success");
    } catch (error) {
      addToast("Errore nell'aggiornamento delle impostazioni.", "danger");
      console.error("Failed to update bot settings:", error);
    }
  }, [user, addToast, scripts, activeScript]);

  return { scripts, activeScript, playerCode, playerAI, compileError, isLoading, setPlayerCode, handleSelectScript, handleDeleteScript, handleCreateNewScript, handleUpdateAI, handleSaveOnly, handleUpdateBotSettings };
}