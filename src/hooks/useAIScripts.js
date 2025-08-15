import { useState, useCallback, useEffect } from "react";
import AIScriptService from "../services/AIScriptService";
import FirestoreService from "../services/FirestoreService";
import { compileAI, stringifyAI } from "../game/ai/compiler";
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
  const [visualModel, setVisualModel] = useState(null);
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
        const modelToLoad = scriptToActivate.visualModel || null;
        setActiveScript(scriptToActivate);
        setPlayerCode(codeToLoad);
        setVisualModel(modelToLoad);
        try {
          var compiledAI = compileAI(codeToLoad);
          setPlayerAI(() => compiledAI);
        } catch (e) {
          setCompileError(e.message);
          setPlayerAI(() => DefaultAI);
        }
      } else {
        // Nessuno script trovato, resetta allo stato iniziale
        setActiveScript(null);
        setPlayerCode("");
        setVisualModel(null);
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
        const modelToLoad = scriptToSelect.visualModel || null;
        setPlayerCode(codeToLoad);
        setVisualModel(modelToLoad);
        if (!user) {
          // Salva l'ultimo attivo solo per gli utenti non loggati
          AIScriptService.setLastActiveScriptId(scriptId);
        }
      }
    },
    [scripts, user]
  );

  const handleDeleteScript = useCallback(
    async (scriptId) => {
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

  const handleCreateNewScript = useCallback(
    async (newScriptName, code, visualModel) => {
      if (newScriptName && newScriptName.trim() !== "") {
        // Il codice non è più predefinito qui, ma viene passato come argomento.
        // Questo rende la funzione più flessibile e riutilizzabile.
        const minifiedCode = minifyScript(code);

        // Se un visualModel non viene passato, ne crea uno vuoto di default.
        const newScript = {
          name: newScriptName.trim(),
          script: code,
          visualModel: visualModel || {
            nodes: [],
            edges: [],
            globalTransitions: [],
          },
          multiplayerScript: minifiedCode,
        };

        let savedScript;
        if (user) {
          // Passiamo l'oggetto completo a createBot
          const newId = await FirestoreService.createBot(user.uid, {
            name: newScript.name,
            script: newScript.script,
            multiplayerScript: newScript.multiplayerScript,
            visualModel: newScript.visualModel,
          });
          savedScript = { ...newScript, id: newId, userId: user.uid };
        } else {
          savedScript = AIScriptService.saveScript(newScript);
        }

        // Aggiorna lo stato degli script e imposta subito il nuovo script come attivo
        // per evitare race condition con l'aggiornamento asincrono dello stato.
        setScripts((prev) => [...prev, savedScript]);
        setActiveScript(savedScript);
        setPlayerCode(savedScript.script);
        setVisualModel(savedScript.visualModel);
        if (!user) {
          AIScriptService.setLastActiveScriptId(savedScript.id);
        }

        addToast("Nuovo script creato!", "success");
      }
    },
    [handleSelectScript, user, addToast]
  );

  const handleSaveOnly = useCallback(async (codeToSave) => {
    if (!activeScript) return { success: false };

    try {
      // Tenta di compilare il codice per validarlo.
      // La funzione compileAI eseguirà anche il merge se necessario.
      const compiledObject = compileAI(codeToSave);
      // Normalizza il codice: ri-stringifica l'oggetto compilato per avere sempre un codice completo.
      const finalCode = stringifyAI(compiledObject);

      const modelToSave = visualModel || {
        nodes: [],
        edges: [],
        globalTransitions: [],
      };

      const minifiedCode = minifyScript(finalCode);
      const updatedScript = {
        ...activeScript,
        script: finalCode,
        visualModel: modelToSave,
        multiplayerScript: minifiedCode,
      };

      if (user) {
        await FirestoreService.updateBot(activeScript.id, {
          script: finalCode,
          multiplayerScript: minifiedCode,
          visualModel: modelToSave,
        });
      } else {
        // Per localStorage, salviamo solo il codice principale
        updatedScript.visualModel = modelToSave;
        updatedScript.code = finalCode;
        AIScriptService.saveScript(updatedScript);
        // Imposta questo script come l'ultimo attivo solo se il salvataggio ha successo.
        AIScriptService.setLastActiveScriptId(updatedScript.id);
      }

      setPlayerCode(finalCode); // Aggiorna anche il codice nell'editor
      setActiveScript(updatedScript);
      setVisualModel(modelToSave);
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
  }, [activeScript, user, visualModel, addToast, setPlayerCode]);

  const handleUpdateAI = useCallback(async (codeToSave) => {
    if (!activeScript) return { success: false };
    try {
      const compiledObject = compileAI(codeToSave);
      // Normalizza il codice: ri-stringifica l'oggetto compilato per avere sempre un codice completo.
      const finalCode = stringifyAI(compiledObject);

      const modelToSave = visualModel || {
        nodes: [],
        edges: [],
        globalTransitions: [],
      };

      const minifiedCode = minifyScript(finalCode);
      const updatedScript = {
        ...activeScript,
        script: finalCode,
        visualModel: modelToSave,
        multiplayerScript: minifiedCode,
      };

      if (user) {
        await FirestoreService.updateBot(activeScript.id, {
          script: finalCode,
          multiplayerScript: minifiedCode,
          visualModel: modelToSave,
        });
      } else {
        // Per localStorage, salviamo solo il codice principale
        updatedScript.code = finalCode;
        AIScriptService.saveScript(updatedScript);
        AIScriptService.setLastActiveScriptId(updatedScript.id);
      }

      setPlayerCode(finalCode); // Aggiorna anche il codice nell'editor
      setPlayerAI(() => compiledObject);
      setCompileError(null);
      setVisualModel(modelToSave);
      setActiveScript(updatedScript);
      setScripts((prev) =>
        prev.map((s) => (s.id === updatedScript.id ? updatedScript : s))
      );

      return { success: true };
    } catch (error) {
      setCompileError(`Errore di compilazione: ${error.message}`);
      return { success: false };
    }
  }, [activeScript, user, visualModel, addToast, setPlayerCode]);

  const handleUpdateBotSettings = useCallback(
    async (botId, settings) => {
      if (!user) {
        addToast(
          "Devi essere loggato per modificare le impostazioni cloud.",
          "danger"
        );
        return;
      }
      try {
        await FirestoreService.updateBot(botId, settings);
        const updatedScript = {
          ...scripts.find((s) => s.id === botId),
          ...settings,
        };
        setScripts((prev) =>
          prev.map((s) => (s.id === botId ? updatedScript : s))
        );
        if (activeScript?.id === botId) {
          setActiveScript(updatedScript);
        }
        addToast("Impostazioni del bot aggiornate!", "success");
      } catch (error) {
        addToast("Errore nell'aggiornamento delle impostazioni.", "danger");
        console.error("Failed to update bot settings:", error);
      }
    },
    [user, addToast, scripts, activeScript]
  );

  return {
    scripts,
    activeScript,
    playerCode,
    playerAI,
    compileError,
    isLoading,
    visualModel,
    setPlayerCode,
    setVisualModel,
    handleSelectScript,
    handleDeleteScript,
    handleCreateNewScript,
    handleUpdateAI,
    handleSaveOnly,
    handleUpdateBotSettings,
  };
}
