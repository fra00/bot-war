import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as Blockly from "blockly";
import "blockly/blocks";
import { javascriptGenerator } from "blockly/javascript";
import { initializeBlockly } from "../../game/blockly/main";
import { toolbox } from "../../game/blockly/toolbox";

// Esegui l'inizializzazione una sola volta per registrare i blocchi custom
initializeBlockly();

const BlocklyEditor = forwardRef(
  ({ initialWorkspace, onWorkspaceChange }, ref) => {
    const blocklyDiv = useRef(null);
    const workspaceRef = useRef(null);

    useImperativeHandle(ref, () => ({
      getWorkspace: () => {
        return workspaceRef.current;
      },
      getWorkspaceJson: () => {
        if (workspaceRef.current) {
          return Blockly.serialization.workspaces.save(workspaceRef.current);
        }
        return null;
      },
      getGeneratedCode: () => {
        if (workspaceRef.current) {
          return javascriptGenerator.workspaceToCode(workspaceRef.current);
        }
        return "";
      },
      loadWorkspaceJson: (json) => {
        if (workspaceRef.current) {
          // Svuota l'area di lavoro e carica il nuovo stato.
          Blockly.serialization.workspaces.load(json, workspaceRef.current);
        }
      },
    }));

    useEffect(() => {
      if (blocklyDiv.current && !workspaceRef.current) {
        // Inietta l'editor Blockly nel div designato
        workspaceRef.current = Blockly.inject(blocklyDiv.current, {
          toolbox: toolbox,
          // Utilizziamo un renderer e un tema moderni
          renderer: "zelos",
          theme: Blockly.Themes.Dark, // <-- Usa l'oggetto tema
          horizontalLayout: false, // <-- Toolbox verticale (default)
        });
      }

      // Funzione di pulizia per distruggere l'istanza di Blockly quando il componente viene smontato
      return () => {
        workspaceRef.current?.dispose();
        workspaceRef.current = null;
      };
    }, []); // L'array vuoto assicura che l'effetto venga eseguito solo al mount e unmount

    // Aggiunge un listener per notificare al genitore i cambiamenti.
    useEffect(() => {
      const workspace = workspaceRef.current;
      if (!workspace || !onWorkspaceChange) {
        return;
      }

      const handleChange = (event) => {
        // Ignora eventi UI (zoom, pan) e eventi programmatici (come il caricamento)
        // che non dovrebbero essere registrati per l'undo.
        // Questo previene il loop di feedback dove il caricamento scatena un salvataggio.
        if (event.isUiEvent || !event.recordUndo) return;

        const json = Blockly.serialization.workspaces.save(workspace);
        onWorkspaceChange(json);
      };

      workspace.addChangeListener(handleChange);
      return () => workspace.removeChangeListener(handleChange);
    }, [onWorkspaceChange]);

    // Carica lo stato iniziale quando la prop cambia
    useEffect(() => {
      if (initialWorkspace && workspaceRef.current) {
        try {
          Blockly.serialization.workspaces.load(
            initialWorkspace,
            workspaceRef.current
          );
          console.log("Workspace caricato dallo stato iniziale.");
        } catch (e) {
          console.error("Errore nel caricamento dello spazio di lavoro:", e);
          workspaceRef.current.clear();
        }
      } else if (workspaceRef.current) {
        // Se non c'è uno stato iniziale, pulisci l'area di lavoro
        workspaceRef.current.clear();
      }
    }, [initialWorkspace]);

    return (
      <div className="w-full h-full flex flex-col">
        {/* Il contenitore per l'editor Blockly deve occupare lo spazio disponibile */}
        <div ref={blocklyDiv} className="flex-grow w-full h-full" />
      </div>
    );
  }
);

export default BlocklyEditor;
