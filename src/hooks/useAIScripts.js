import { useState, useCallback, useEffect, useRef } from "react";
import AIScriptService from "../services/AIScriptService";
import FirestoreService from "../services/FirestoreService";
import {
  compileAI,
  stringifyAI,
  prepareCodeForSaving,
} from "../game/ai/compiler";
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
  const [blocklyModel, setBlocklyModel] = useState(null);

  // Usiamo un ref per mantenere una referenza sempre aggiornata allo stato volatile.
  // Questo risolve i problemi di "stale closure" nelle callback di salvataggio,
  // garantendo che usino sempre i dati più recenti.
  const volatileStateRef = useRef();
  useEffect(() => {
    volatileStateRef.current = {
      scripts,
      activeScript,
      playerCode,
      visualModel,
      blocklyModel,
    };
  }, [scripts, activeScript, playerCode, visualModel, blocklyModel]);
  const [playerAI, setPlayerAI] = useState(() => DefaultAI);
  const [compileError, setCompileError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Stato per il caricamento

  // --- Stato per l'IA dell'avversario ---
  const [opponentScriptId, setOpponentScriptId] = useState(null);
  const [opponentAI, setOpponentAI] = useState(() => DefaultAI);
  const [opponentCompileError, setOpponentCompileError] = useState(null);

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
        const rawBlocklyModel = scriptToActivate.blocklyModel;
        const blocklyModelToLoad =
          rawBlocklyModel && typeof rawBlocklyModel === "string"
            ? JSON.parse(rawBlocklyModel)
            : rawBlocklyModel || null;
        setActiveScript(scriptToActivate);
        setPlayerCode(codeToLoad);
        setVisualModel(modelToLoad);
        setBlocklyModel(blocklyModelToLoad);
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
        setBlocklyModel(null);
        setPlayerAI(() => DefaultAI);
      }
      setIsLoading(false);
    };

    loadScripts();
  }, [user, addToast]); // Ricarica quando l'utente cambia

  const handleSelectScript = useCallback(
    (scriptId) => {
      // Legge dal ref per evitare di usare una lista di script "stale".
      const scriptToSelect = volatileStateRef.current.scripts.find(
        (s) => s.id === scriptId
      );
      if (scriptToSelect) {
        setActiveScript(scriptToSelect);
        const codeToLoad = scriptToSelect.script || scriptToSelect.code;
        const modelToLoad = scriptToSelect.visualModel || null;
        const rawBlocklyModel = scriptToSelect.blocklyModel;
        const blocklyModelToLoad =
          rawBlocklyModel && typeof rawBlocklyModel === "string"
            ? JSON.parse(rawBlocklyModel)
            : rawBlocklyModel || null;
        setPlayerCode(codeToLoad);
        setVisualModel(modelToLoad);
        setBlocklyModel(blocklyModelToLoad);
        if (!user) {
          // Salva l'ultimo attivo solo per gli utenti non loggati
          AIScriptService.setLastActiveScriptId(scriptId);
        }
      }
    },
    [user] // Le dipendenze sono stabili
  );

  const handleDeleteScript = useCallback(
    async (scriptId) => {
      const { scripts: currentScripts, activeScript: currentActiveScript } =
        volatileStateRef.current;

      if (currentScripts.length <= 1) {
        addToast("Non puoi eliminare l'ultimo script.", "warning");
        return;
      }

      if (user) {
        await FirestoreService.deleteBot(scriptId);
      } else {
        AIScriptService.deleteScript(scriptId);
      }

      const remainingScripts = currentScripts.filter((s) => s.id !== scriptId);
      setScripts(remainingScripts);

      if (currentActiveScript && currentActiveScript.id === scriptId) {
        handleSelectScript(remainingScripts[0].id);
      }
      addToast("Script eliminato.", "success");
    },
    [handleSelectScript, user, addToast]
  );

  const handleCreateNewScript = useCallback(
    async (newScriptName, code, visualModel, blocklyModel) => {
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
          blocklyModel: blocklyModel || {
            blocks: { languageVersion: 0, blocks: [] },
          },
          multiplayerScript: minifiedCode,
        };

        let savedScript;
        if (user) {
          // Passiamo l'oggetto completo a createBot
          // Stringifichiamo il modello Blockly per un salvataggio sicuro su Firestore
          const newId = await FirestoreService.createBot(user.uid, {
            name: newScript.name,
            script: newScript.script,
            multiplayerScript: newScript.multiplayerScript,
            visualModel: newScript.visualModel,
            blocklyModel: newScript.blocklyModel
              ? JSON.stringify(newScript.blocklyModel)
              : null,
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
        setBlocklyModel(savedScript.blocklyModel);
        if (!user) {
          AIScriptService.setLastActiveScriptId(savedScript.id);
        }

        addToast("Nuovo script creato!", "success");
      }
    },
    [handleSelectScript, user, addToast]
  );

  const handleSaveOnly = useCallback(
    async (activeView) => {
      const {
        activeScript: currentActiveScript,
        playerCode: currentPlayerCode,
        visualModel: currentVisualModel,
        blocklyModel: currentBlocklyModel,
      } = volatileStateRef.current;

      if (!currentActiveScript) return { success: false };

      try {
        // Tenta di compilare il codice per validarlo.
        const codeToProcess = prepareCodeForSaving(currentPlayerCode);
        const compiledObject = compileAI(codeToProcess);
        const finalCode = stringifyAI(compiledObject);

        const minifiedCode = minifyScript(finalCode);

        // Crea l'oggetto base da aggiornare
        const updatePayload = {
          script: finalCode,
          multiplayerScript: minifiedCode,
        };

        // Aggiorna i modelli solo se la vista attiva è quella corrispondente
        // per evitare di salvare dati stantii.
        if (activeView === "visual") {
          updatePayload.visualModel = currentVisualModel || {
            nodes: [],
            edges: [],
          };
        }
        if (activeView === "blockly") {
          const modelToSave = currentBlocklyModel || {
            blocks: { languageVersion: 0, blocks: [] },
          };
          // Stringifichiamo il modello per un salvataggio sicuro su Firestore.
          // Questo evita problemi con valori 'undefined' o altri tipi non supportati.
          updatePayload.blocklyModel = JSON.stringify(modelToSave);
        }

        if (user) {
          await FirestoreService.updateBot(
            currentActiveScript.id,
            updatePayload
          );
        } else {
          const scriptToSave = { ...currentActiveScript, code: finalCode };
          if (activeView === "visual") {
            scriptToSave.visualModel = updatePayload.visualModel;
          }
          if (activeView === "blockly") {
            scriptToSave.blocklyModel = updatePayload.blocklyModel;
          }
          AIScriptService.saveScript(scriptToSave);
          AIScriptService.setLastActiveScriptId(scriptToSave.id);
        }

        // Aggiorna lo stato locale in modo coerente
        const updatedScriptData = {
          ...currentActiveScript,
          ...updatePayload,
        };

        setPlayerCode(finalCode); // Aggiorna anche il codice nell'editor
        setActiveScript(updatedScriptData);
        if (activeView === "visual") {
          setVisualModel(updatePayload.visualModel);
        }
        if (activeView === "blockly") {
          // NON impostare il modello con la stringa! Lo stato deve rimanere un oggetto.
          // Lo stato `blocklyModel` è già aggiornato tramite `onWorkspaceChange`.
          // Questa riga serve solo a garantire che non sia null se era la prima modifica.
          // CORREZIONE: Usa il valore più recente dal ref, non quello stantio dalla closure.
          setBlocklyModel(
            currentBlocklyModel || {
              blocks: { languageVersion: 0, blocks: [] },
            }
          );
        }
        setScripts((prev) =>
          prev.map((s) =>
            s.id === updatedScriptData.id ? updatedScriptData : s
          )
        );
        setCompileError(null); // Pulisci eventuali errori precedenti
        return { success: true, updatedScript: updatedScriptData };
      } catch (error) {
        // Se la compilazione fallisce, imposta il messaggio di errore e non salvare.
        setCompileError(`Errore di compilazione: ${error.message}`);
        return { success: false };
      }
    },
    [user, addToast, setPlayerCode] // Dipendenze stabili
  );

  const handleUpdateAI = useCallback(
    async (activeView) => {
      const {
        activeScript: currentActiveScript,
        playerCode: currentPlayerCode,
        visualModel: currentVisualModel,
        blocklyModel: currentBlocklyModel,
      } = volatileStateRef.current;

      if (!currentActiveScript) return { success: false };

      try {
        const codeToProcess = prepareCodeForSaving(currentPlayerCode);
        const compiledObject = compileAI(codeToProcess);
        const finalCode = stringifyAI(compiledObject);

        const minifiedCode = minifyScript(finalCode);

        // Crea l'oggetto base da aggiornare
        const updatePayload = {
          script: finalCode,
          multiplayerScript: minifiedCode,
        };

        // Aggiorna i modelli solo se la vista attiva è quella corrispondente
        if (activeView === "visual") {
          updatePayload.visualModel = currentVisualModel || {
            nodes: [],
            edges: [],
          };
        }
        if (activeView === "blockly") {
          const modelToSave = currentBlocklyModel || {
            blocks: { languageVersion: 0, blocks: [] },
          };
          // Stringifichiamo il modello per un salvataggio sicuro su Firestore.
          // Questo evita problemi con valori 'undefined' o altri tipi non supportati.
          updatePayload.blocklyModel = JSON.stringify(modelToSave);
        }

        if (user) {
          await FirestoreService.updateBot(
            currentActiveScript.id,
            updatePayload
          );
        } else {
          const scriptToSave = { ...currentActiveScript, code: finalCode };
          if (activeView === "visual") {
            scriptToSave.visualModel = updatePayload.visualModel;
          }
          if (activeView === "blockly") {
            scriptToSave.blocklyModel = updatePayload.blocklyModel;
          }
          AIScriptService.saveScript(scriptToSave);
          AIScriptService.setLastActiveScriptId(scriptToSave.id);
        }

        const updatedScriptData = {
          ...currentActiveScript,
          ...updatePayload,
        };

        setPlayerCode(finalCode); // Aggiorna anche il codice nell'editor
        setPlayerAI(() => compiledObject);
        setCompileError(null);
        setActiveScript(updatedScriptData);
        if (activeView === "visual") {
          setVisualModel(updatePayload.visualModel);
        }
        if (activeView === "blockly") {
          // NON impostare il modello con la stringa! Lo stato deve rimanere un oggetto.
          // Lo stato `blocklyModel` è già aggiornato tramite `onWorkspaceChange`.
          // Questa riga serve solo a garantire che non sia null se era la prima modifica.
          // CORREZIONE: Usa il valore più recente dal ref, non quello stantio dalla closure.
          setBlocklyModel(
            currentBlocklyModel || {
              blocks: { languageVersion: 0, blocks: [] },
            }
          );
        }
        setScripts((prev) =>
          prev.map((s) =>
            s.id === updatedScriptData.id ? updatedScriptData : s
          )
        );

        return { success: true, updatedScript: updatedScriptData };
      } catch (error) {
        setCompileError(`Errore di compilazione: ${error.message}`);
        return { success: false };
      }
    },
    [user, addToast, setPlayerCode] // Dipendenze stabili
  );

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

  const handleSelectOpponentScript = useCallback(
    (scriptId) => {
      setOpponentScriptId(scriptId);
      setOpponentCompileError(null);

      if (!scriptId) {
        setOpponentAI(() => DefaultAI);
        addToast("Avversario impostato su IA di Default.", "info");
        return;
      }

      const script = scripts.find((s) => s.id === scriptId);
      if (!script) {
        const errorMsg = `Script avversario con ID ${scriptId} non trovato.`;
        console.error(errorMsg);
        setOpponentCompileError(errorMsg);
        setOpponentAI(() => DefaultAI);
        addToast(errorMsg, "danger");
        return;
      }

      const code = script.script || script.code;
      try {
        const compiledAI = compileAI(code);
        setOpponentAI(() => compiledAI);
        addToast(`Avversario impostato su "${script.name}".`, "success");
      } catch (e) {
        const errorMsg = `Errore di compilazione per l'IA avversaria "${script.name}": ${e.message}`;
        setOpponentCompileError(errorMsg);
        setOpponentAI(() => DefaultAI);
        addToast(errorMsg, "danger");
      }
    },
    [scripts, addToast]
  );

  const handleClearOpponentCompileError = useCallback(() => {
    setOpponentCompileError(null);
  }, []);

  const handleClearBlocklyModel = useCallback(
    async (scriptId) => {
      const updatePayload = { blocklyModel: null };
      if (user) {
        await FirestoreService.updateBot(scriptId, updatePayload);
      } else {
        const scriptToUpdate = scripts.find((s) => s.id === scriptId);
        if (scriptToUpdate) {
          const updatedScript = { ...scriptToUpdate, blocklyModel: null };
          AIScriptService.saveScript(updatedScript);
        }
      }
      // Aggiorna lo stato locale
      const updatedScript = {
        ...activeScript,
        ...updatePayload,
      };
      setBlocklyModel(null);
      setActiveScript(updatedScript);
      setScripts((prev) =>
        prev.map((s) => (s.id === scriptId ? updatedScript : s))
      );
    },
    [user, scripts, activeScript]
  );
  return {
    scripts,
    activeScript,
    playerCode,
    playerAI,
    compileError,
    isLoading,
    visualModel,
    blocklyModel,
    opponentScriptId,
    opponentAI,
    opponentCompileError,
    setPlayerCode,
    setVisualModel,
    setBlocklyModel,
    handleSelectScript,
    handleDeleteScript,
    handleCreateNewScript,
    handleUpdateAI,
    handleSaveOnly,
    handleUpdateBotSettings,
    // Gestori per l'avversario
    handleSelectOpponentScript,
    handleClearOpponentCompileError,
    handleClearBlocklyModel,
  };
}
