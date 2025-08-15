import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
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
import StateNodeEditorModal from "./StateNodeEditorModal"; // Assicurati che il percorso sia corretto
import TransitionEditorModal from "./TransitionEditorModal"; // Importa la nuova modale
import GlobalTransitionsPanel from "./GlobalTransitionsPanel";
import GlobalTransitionEditorModal from "./GlobalTransitionEditorModal";
import Button from "../ui/Button";
import useDisclosure from "../ui/useDisclosure";

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

  // Definiamo i tipi di nodi personalizzati che React Flow può usare.
  const nodeTypes = useMemo(() => ({ stateNode: StateNode }), []);

  const { nodes = [], edges = [], globalTransitions = [] } = visualModel;

  const onNodesChange = useCallback(
    (changes) => {
      if (!isInteractive || !isInitializedRef.current) return;
      const newNodes = applyNodeChanges(changes, nodes);
      onModelChange({ ...visualModel, nodes: newNodes });
    },
    [nodes, onModelChange, visualModel, isInteractive]
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
        id: `edge-${params.source}-${params.target}`,
        label: "Nuova transizione",
        data: {
          condition: "() => true",
        },
      };
      onModelChange({ ...visualModel, edges: addEdge(newEdge, edges) });
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
      const newNodes = nodes.filter((n) => !deletedNodeIds.has(n.id));
      // Rimuovi anche gli archi collegati ai nodi eliminati
      const newEdges = edges.filter(
        (e) => !deletedNodeIds.has(e.source) && !deletedNodeIds.has(e.target)
      );
      onModelChange({ ...visualModel, nodes: newNodes, edges: newEdges });
    },
    [nodes, edges, onModelChange, visualModel]
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

  const onNodeDoubleClick = useCallback((event, node) => {
    if (!isInteractive) return;
    setEditingNode(node);
  }, [isInteractive]);

  const onEdgeDoubleClick = useCallback((event, edge) => {
    if (!isInteractive) return;
    setEditingEdge(edge);
  }, [isInteractive]);

  const handleSaveNodeChanges = useCallback(
    (nodeId, newData) => {
      if (!isInteractive) return;
      const newNodes = nodes.map((n) => {
        if (n.id === nodeId) {
          // Aggiorna i dati del nodo mantenendo la posizione e altri metadati
          return { ...n, data: newData };
        }
        return n;
      });
      onModelChange({ ...visualModel, nodes: newNodes });
      setEditingNode(null); // Chiudi la modale
    },
    [nodes, onModelChange, visualModel, isInteractive]
  );

  // Calcola il numero di transizioni in uscita per ogni nodo.
  // Questo viene fatto qui in modo che i dati possano essere passati ai nodi figli.
  const nodesWithOutDegree = useMemo(() => {
    const outDegrees = new Map();
    edges.forEach((edge) => {
      outDegrees.set(edge.source, (outDegrees.get(edge.source) || 0) + 1);
    });

    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        outDegree: outDegrees.get(node.id) || 0,
      },
    }));
  }, [nodes, edges]);

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

  const handleOpenGlobalTransitionModal = (transition = null) => {
    if (!isInteractive) return;
    setEditingGlobalTransition({ isOpen: true, transition });
  };

  const handleSaveGlobalTransition = (transitionToSave) => {
    const existing = globalTransitions.find(
      (t) => t.id === transitionToSave.id
    );
    let newGlobalTransitions;
    if (existing) {
      // Update
      newGlobalTransitions = globalTransitions.map((t) =>
        t.id === transitionToSave.id ? transitionToSave : t
      );
    } else {
      // Add
      newGlobalTransitions = [...globalTransitions, transitionToSave];
    }
    onModelChange({ ...visualModel, globalTransitions: newGlobalTransitions });
  };

  const handleDeleteGlobalTransition = (transitionId) => {
    const newGlobalTransitions = globalTransitions.filter(
      (t) => t.id !== transitionId
    );
    onModelChange({ ...visualModel, globalTransitions: newGlobalTransitions });
  };

  const addStateNode = () => {
    if (!isInteractive) return;
    const newNode = {
      id: `state_${nodes.length + 1}_${Date.now()}`,
      type: "stateNode",
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        name: `NUOVO_STATO_${nodes.length + 1}`,
        onEnter: "",
        onExecute: "",
      },
    };
    onModelChange({ ...visualModel, nodes: [...nodes, newNode] });
  };

  const availableStates = useMemo(
    () =>
      nodes.map((node) => ({
        value: node.data.name,
        label: node.data.name,
      })),
    [nodes]
  );

  return (
    <div className="flex-grow flex gap-4 relative rounded-md overflow-hidden border border-gray-700 bg-gray-900 p-2">
      <div className="flex-grow h-full relative">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodesWithOutDegree}
            edges={edges}
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
            className={`bg-gray-800 rounded-md ${!isInteractive ? 'cursor-not-allowed' : ''}`}
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
            <Button onClick={onHelpOpen} variant="ghost" className="p-2" title="Guida Editor Visuale">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Button>
          </div>
        )}
      </div>

      {isInteractive && (
        <GlobalTransitionsPanel
          transitions={globalTransitions}
          onAdd={() => handleOpenGlobalTransitionModal(null)}
          onEdit={handleOpenGlobalTransitionModal}
          onDelete={handleDeleteGlobalTransition}
        />
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
          setEditingGlobalTransition({ isOpen: false, transition: null })
        }
        transition={editingGlobalTransition.transition}
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
    globalTransitions: PropTypes.array,
  }),
  onModelChange: PropTypes.func.isRequired,
  isInteractive: PropTypes.bool,
  onHelpOpen: PropTypes.func,
};

export default VisualEditor;
