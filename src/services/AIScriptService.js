import { nanoid } from "nanoid";
import initialPlayerCode from "../game/ai/PlayerAI";

const LAST_ACTIVE_SCRIPT_ID_KEY = "last_active_ai_script_id";
const SCRIPTS_COLLECTION_KEY = "ai_scripts_collection";

/**
 * Un servizio per gestire il salvataggio e il caricamento di più script AI del giocatore.
 * Questa implementazione utilizza il localStorage, ma può essere facilmente
 * sostituita con un'implementazione basata su server senza modificare il resto dell'applicazione.
 */
class AIScriptService {
  /**
   * Recupera tutti gli script AI dal localStorage.
   * Se non viene trovato nessuno script, ne inizializza uno di default.
   * @returns {Array<{id: string, name: string, code: string}>} Un array di oggetti script.
   */
  getAllScripts() {
    try {
      const scriptsJson = localStorage.getItem(SCRIPTS_COLLECTION_KEY);
      if (scriptsJson) {
        const scripts = JSON.parse(scriptsJson);
        // Assicura che ci sia sempre almeno uno script
        if (scripts.length > 0) {
          return scripts;
        }
      }

      // Se non esistono script, o l'array è vuoto, creane uno di default e salvalo.
      const defaultScript = {
        id: nanoid(),
        name: "Default Script",
        // Avvolgiamo il codice iniziale tra parentesi per trasformarlo in un'espressione.
        // Questo assicura che il codice, una volta valutato, restituisca la classe
        // e risolve l'errore "must evaluate to an object" del compilatore.
        code: `(${initialPlayerCode})`,
      };
      this._saveAllScripts([defaultScript]);
      this.setLastActiveScriptId(defaultScript.id);
      return [defaultScript];
    } catch (error) {
      console.error("Failed to load AI scripts from localStorage:", error);
      // In caso di errore, ritorna uno script di default per non bloccare l'app
      return [
        {
          id: "fallback",
          name: "Fallback Script",
          code: initialPlayerCode,
        },
      ];
    }
  }

  /**
   * Salva un singolo script. Se lo script ha un ID, lo aggiorna.
   * Altrimenti, ne crea uno nuovo.
   * @param {{id?: string, name: string, code: string}} script L'oggetto script da salvare.
   * @returns {{id: string, name: string, code: string}} Lo script salvato con il suo ID.
   */
  saveScript(script) {
    const scripts = this.getAllScripts();
    if (script.id) {
      const index = scripts.findIndex((s) => s.id === script.id);
      if (index > -1) {
        scripts[index] = script;
      } else {
        scripts.push(script);
      }
    } else {
      script.id = nanoid();
      scripts.push(script);
    }
    this._saveAllScripts(scripts);
    return script;
  }

  /**
   * Elimina uno script tramite il suo ID.
   * @param {string} scriptId L'ID dello script da eliminare.
   */
  deleteScript(scriptId) {
    let scripts = this.getAllScripts();
    scripts = scripts.filter((s) => s.id !== scriptId);
    this._saveAllScripts(scripts);
  }

  /**
   * Carica l'ultimo script attivo. Se non ne viene trovato nessuno, carica il primo disponibile.
   * @returns {{id: string, name: string, code: string} | null} L'ultimo script attivo o null.
   */
  loadLastActiveScript() {
    const scripts = this.getAllScripts();
    if (scripts.length === 0) {
      return null;
    }
    const lastId = this.getLastActiveScriptId();
    const script = scripts.find((s) => s.id === lastId);
    return script || scripts[0];
  }

  /**
   * Ottiene l'ID dell'ultimo script attivo dal localStorage.
   * @returns {string | null}
   */
  getLastActiveScriptId() {
    try {
      return localStorage.getItem(LAST_ACTIVE_SCRIPT_ID_KEY);
    } catch (error) {
      console.error("Failed to get last active script ID:", error);
      return null;
    }
  }

  /**
   * Imposta l'ID dell'ultimo script attivo nel localStorage.
   * @param {string} scriptId
   */
  setLastActiveScriptId(scriptId) {
    try {
      localStorage.setItem(LAST_ACTIVE_SCRIPT_ID_KEY, scriptId);
    } catch (error) {
      console.error("Failed to set last active script ID:", error);
    }
  }

  /**
   * @private
   * Funzione di supporto per salvare l'intero array di script nel localStorage.
   * @param {Array<object>} scripts
   */
  _saveAllScripts(scripts) {
    try {
      localStorage.setItem(SCRIPTS_COLLECTION_KEY, JSON.stringify(scripts));
    } catch (error) {
      console.error(
        "Failed to save scripts collection to localStorage:",
        error
      );
    }
  }
}

export default new AIScriptService();
