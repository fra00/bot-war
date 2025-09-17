import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import StateNode from "./StateNode"; // This is in src/game/
import GlobalNode from "./GlobalNode"; // This is in src/game/
import StateNodeEditorModal from "./StateNodeEditorModal"; // Assicurati che il percorso sia corretto
import TransitionEditorModal from "./TransitionEditorModal"; // Importa la nuova modale
import GlobalTransitionsPanel from "./GlobalTransitionsPanel";
import GlobalTransitionEditorModal from "./GlobalTransitionEditorModal";
import Button from "../ui/Button";
import { GLOBAL_TRANSITIONS_NODE_ID } from "../../game/ai/compiler";
import useDisclosure from "../ui/useDisclosure";

const nodeTypes = { stateNode: StateNode, globalNode: GlobalNode };

const VisualEditor = ({
  activeScript,
  visualModel,
  onModelChange,
  isInteractive = true, // Default a interattivo per retrocompatibilità
  onHelpOpen,
}) => {
  // Se non c'è un modello visuale per lo script attivo, mostra un placeholder.
  // Questo accade se lo script è stato creato prima dell'introduzione del visualModel.
  if (!visualModel) {
    return (
      <div className="flex-grow relative rounded-md overflow-hidden border border-gray-700 bg-gray-900 p-4">
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <h2 className="text-2xl font-bold">Editor Visuale</h2>
          <p className="mt-2 text-center">
            {activeScript
              ? `Lo script "${activeScript.name}" non ha ancora un modello visuale.`
              : "Seleziona o crea uno script per iniziare."}
          </p>
          <p className="mt-1 text-sm text-center">
            Puoi continuare a usare l'editor di codice o, se salvi, verrà creato
            un modello visuale vuoto.
          </p>
        </div>
      </div>
    );
  }

  // Stato per tenere traccia del nodo attualmente in fase di modifica
  const [editingNode, setEditingNode] = useState(null);
  // Stato per tenere traccia della transizione attualmente in fase di modifica
  const [editingEdge, setEditingEdge] = useState(null);
  // Stato per la modale delle transizioni globali
  const [editingGlobalTransition, setEditingGlobalTransition] = useState({
    isOpen: false,
    transition: null,
    type: "emergency", // 'emergency' or 'tactical'
  });

  // Ref per evitare di marcare l'editor come "dirty" al caricamento iniziale.
  const isInitializedRef = useRef(false);

  // Resetta il flag di inizializzazione quando lo script attivo cambia.
  useEffect(() => {
    isInitializedRef.current = false;
  }, [activeScript]);

  // La libreria imposta lo stato iniziale, quindi attendiamo che finisca.
  const onInit = useCallback(() => {
    setTimeout(() => (isInitializedRef.current = true), 50);
  }, []);

  const { nodes = [], edges = [] } = visualModel;

  // Sanificazione dei nodi: ci assicuriamo che ogni nodo abbia le proprietà necessarie.
  // Questo risolve il bug degli stati senza nome e del doppio click non funzionante.
  const processedNodes = useMemo(() => {
    return nodes.map((node) => {
      if (node.type === "stateNode" && !node.data.name) {
        return {
          ...node,
          data: {
            ...node.data,
            name: node.id, // Il compilatore usa il nome dello stato come ID.
          },
        };
      }
      return node;
    });
  }, [nodes]);

  // Separiamo gli archi per tipo per la UI, ma li manteniamo uniti per ReactFlow
  const { emergencyTransitions, tacticalTransitions } = useMemo(() => {
    const emergency = [];
    const tactical = [];

    edges.forEach((edge) => {
      if (edge.data?.type === "emergency") {
        emergency.push(edge);
      } else if (edge.data?.type === "tactical") {
        tactical.push(edge);
      }
    });
    return {
      emergencyTransitions: emergency,
      tacticalTransitions: tactical,
    };
  }, [edges]);

  const onNodesChange = useCallback(
    (changes) => {
      if (!isInteractive || !isInitializedRef.current) return;
      const newNodes = applyNodeChanges(changes, processedNodes);
      onModelChange({ ...visualModel, nodes: newNodes });
    },
    [processedNodes, onModelChange, visualModel, isInteractive]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      if (!isInteractive || !isInitializedRef.current) return;
      const newEdges = applyEdgeChanges(changes, edges);
      onModelChange({ ...visualModel, edges: newEdges });
    },
    [edges, onModelChange, visualModel, isInteractive]
  );

  const onConnect = useCallback(
    (params) => {
      if (!isInteractive) return;
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        label: "Nuova transizione",
        data: {
          type: "standard",
          condition: "(api, memory, context, events) => {\n  return true;\n}",
        },
      };
      const newEdges = addEdge(newEdge, edges);
      onModelChange({ ...visualModel, edges: newEdges });
      // Apre subito la modale per modificare la nuova transizione.
      setEditingEdge(newEdge);
    },
    [visualModel, edges, onModelChange, setEditingEdge, isInteractive]
  );

  const onNodesDelete = useCallback(
    (deletedNodes) => {
      if (
        !window.confirm(
          `Sei sicuro di voler eliminare ${deletedNodes.length} stato/i? Questa azione eliminerà anche tutte le transizioni collegate.`
        )
      ) {
        return;
      }

      const deletedNodeIds = new Set(deletedNodes.map((n) => n.id));
      const newNodes = processedNodes.filter((n) => !deletedNodeIds.has(n.id));
      // Rimuovi anche gli archi collegati ai nodi eliminati
      const newEdges = edges.filter(
        (e) => !deletedNodeIds.has(e.source) && !deletedNodeIds.has(e.target)
      );
      onModelChange({ ...visualModel, nodes: newNodes, edges: newEdges });
    },
    [processedNodes, edges, onModelChange, visualModel]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges) => {
      // Nessuna conferma per l'eliminazione delle transizioni
      const deletedEdgeIds = new Set(deletedEdges.map((e) => e.id));
      const newEdges = edges.filter((e) => !deletedEdgeIds.has(e.id));
      onModelChange({ ...visualModel, edges: newEdges });
    },
    [edges, onModelChange, visualModel]
  );

  const onNodeDoubleClick = useCallback(
    (event, node) => {
      if (!isInteractive) return;
      setEditingNode(node);
    },
    [isInteractive]
  );

  const onEdgeDoubleClick = useCallback(
    (event, edge) => {
      if (!isInteractive) return;
      setEditingEdge(edge);
    },
    [isInteractive]
  );

  const handleSaveNodeChanges = useCallback(
    (nodeId, newData) => {
      if (!isInteractive) return;
      const newNodes = processedNodes.map((n) => {
        if (n.id === nodeId) {
          // Aggiorna i dati del nodo mantenendo la posizione e altri metadati
          return { ...n, data: newData };
        }
        return n;
      });
      onModelChange({ ...visualModel, nodes: newNodes });
      setEditingNode(null); // Chiudi la modale
    },
    [processedNodes, onModelChange, visualModel, isInteractive]
  );

  // Calcola il numero di transizioni in uscita per ogni nodo.
  // Questo viene fatto qui in modo che i dati possano essere passati ai nodi figli.
  const nodesWithOutDegree = useMemo(() => {
    const outDegrees = new Map();
    edges.forEach((edge) => {
      outDegrees.set(edge.source, (outDegrees.get(edge.source) || 0) + 1);
    });

    return processedNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        outDegree: outDegrees.get(node.id) || 0,
      },
    }));
  }, [processedNodes, edges]);

  const handleSaveEdgeChanges = useCallback(
    (updatedEdge) => {
      if (!isInteractive) return;
      const newEdges = edges.map((e) => {
        if (e.id === updatedEdge.id) {
          return updatedEdge;
        }
        return e;
      });
      onModelChange({ ...visualModel, edges: newEdges });
      setEditingEdge(null); // Chiudi la modale
    },
    [edges, onModelChange, visualModel, isInteractive]
  );

  const handleOpenGlobalTransitionModal = (transition = null, type) => {
    if (!isInteractive) return;
    setEditingGlobalTransition({ isOpen: true, transition, type });
  };

  const handleSaveGlobalTransition = (transitionToSave, type) => {
    const existing = edges.find((e) => e.id === transitionToSave.id);
    let newEdges;

    if (existing) {
      // Update
      newEdges = edges.map((e) =>
        e.id === transitionToSave.id ? { ...existing, ...transitionToSave } : e
      );
    } else {
      // Add
      const newGlobalEdge = {
        id: `e-${type}-${transitionToSave.target}-${Date.now()}`,
        source: GLOBAL_TRANSITIONS_NODE_ID,
        target: transitionToSave.target,
        label: transitionToSave.label,
        //type: "floating",
        data: {
          ...transitionToSave.data,
          type: type,
        },
      };
      newEdges = [...edges, newGlobalEdge];
    }
    onModelChange({ ...visualModel, edges: newEdges });
  };

  const handleDeleteGlobalTransition = (transitionId) => {
    const newEdges = edges.filter((e) => e.id !== transitionId);
    onModelChange({ ...visualModel, edges: newEdges });
  };

  const addStateNode = () => {
    if (!isInteractive) return;
    const newNode = {
      id: `state_${processedNodes.length + 1}_${Date.now()}`,
      type: "stateNode",
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        name: `NUOVO_STATO_${processedNodes.length + 1}`,
        onEnter: "onEnter(api, memory, context) {\n  \n}",
        onExecute: "onExecute(api, memory, context, events) {\n  \n}",
        onExit: "onExit(api, memory) {\n  \n}",
      },
    };
    onModelChange({ ...visualModel, nodes: [...nodes, newNode] });
  };

  const availableStates = useMemo(
    () =>
      processedNodes.map((node) => ({
        value: node.data.name,
        label: node.data.name,
      })),
    [processedNodes]
  );

  // Aggiungiamo stili diversi agli archi in base al tipo
  const edgesWithStyles = useMemo(() => {
    return edges.map((edge) => {
      if (edge.data?.type === "emergency") {
        return {
          ...edge,
          style: { stroke: "#EF4444", strokeWidth: 2.5 },
          animated: true,
        };
      }
      if (edge.data?.type === "tactical") {
        return {
          ...edge,
          style: { stroke: "#FBBF24", strokeWidth: 2.5 },
          animated: true,
        };
      }
      return { ...edge, style: { stroke: "#6B7280", strokeWidth: 2 } };
    });
  }, [edges]);

  return (
    <div className="flex-grow flex gap-2 relative rounded-md overflow-hidden border border-gray-700 bg-gray-900 p-2">
      <div className="flex-grow h-full relative">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodesWithOutDegree}
            edges={edgesWithStyles}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onInit={onInit}
            nodeTypes={nodeTypes}
            fitView
            className={`bg-gray-800 rounded-md ${
              !isInteractive ? "cursor-not-allowed" : ""
            }`}
            // Disabilita le interazioni principali se non è interattivo
            nodesDraggable={isInteractive}
            nodesConnectable={isInteractive}
            elementsSelectable={isInteractive}
          >
            <Controls />
            <Background color="#4a5568" gap={16} />
          </ReactFlow>
        </ReactFlowProvider>
        {isInteractive && (
          <div className="absolute top-2 left-2 z-10">
            <Button onClick={addStateNode}>Aggiungi Stato</Button>
          </div>
        )}
        {isInteractive && onHelpOpen && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              onClick={onHelpOpen}
              variant="ghost"
              className="p-2"
              title="Guida Editor Visuale"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </Button>
          </div>
        )}
      </div>

      {isInteractive && (
        <div className="w-72 flex-shrink-0 flex flex-col gap-4 p-2 bg-gray-800 rounded-md overflow-y-auto">
          <GlobalTransitionsPanel
            title="Transizioni di Emergenza"
            transitions={emergencyTransitions}
            onAdd={() => handleOpenGlobalTransitionModal(null, "emergency")}
            onEdit={(transition) =>
              handleOpenGlobalTransitionModal(transition, "emergency")
            }
            onDelete={handleDeleteGlobalTransition}
          />
          <GlobalTransitionsPanel
            title="Transizioni Tattiche"
            transitions={tacticalTransitions}
            onAdd={() => handleOpenGlobalTransitionModal(null, "tactical")}
            onEdit={(transition) =>
              handleOpenGlobalTransitionModal(transition, "tactical")
            }
            onDelete={handleDeleteGlobalTransition}
          />
        </div>
      )}

      <StateNodeEditorModal
        isOpen={!!editingNode}
        onClose={() => setEditingNode(null)}
        node={editingNode}
        onSave={handleSaveNodeChanges}
      />
      <TransitionEditorModal
        isOpen={!!editingEdge}
        onClose={() => setEditingEdge(null)}
        edge={editingEdge}
        onSave={handleSaveEdgeChanges}
      />
      <GlobalTransitionEditorModal
        isOpen={editingGlobalTransition.isOpen}
        onClose={() =>
          setEditingGlobalTransition({
            isOpen: false,
            transition: null,
            type: "emergency",
          })
        }
        transition={editingGlobalTransition.transition}
        type={editingGlobalTransition.type}
        onSave={handleSaveGlobalTransition}
        availableStates={availableStates}
      />
    </div>
  );
};

VisualEditor.propTypes = {
  activeScript: PropTypes.object,
  visualModel: PropTypes.shape({
    nodes: PropTypes.array,
    edges: PropTypes.array,
  }),
  onModelChange: PropTypes.func.isRequired,
  isInteractive: PropTypes.bool,
  onHelpOpen: PropTypes.func,
};

export default VisualEditor;
