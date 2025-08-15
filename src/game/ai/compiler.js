import DefaultAIBase from "./DefaultAIBase.js";

/**
 * Tenta di "compilare" la stringa di codice in un oggetto AI valido.
 * Il codice deve essere un'espressione JavaScript che restituisce un oggetto.
 * NOTA: `new Function()` ha implicazioni di sicurezza. In un'app reale,
 * questo dovrebbe essere eseguito in un Web Worker o in un sandbox più sicuro.
 * @param {string} code - Il codice scritto dal giocatore, che dovrebbe essere un'espressione che restituisce un oggetto.
 * @returns {object} L'oggetto AI con il metodo `run` e uno stato potenziale.
 * @throws {Error} Se il codice non è sintatticamente valido o non restituisce un oggetto AI valido.
 */
export const compileAI = (code) => {
  // Aggiungiamo un controllo per codice vuoto o nullo per evitare errori non gestiti.
  if (!code || code.trim() === "") {
    throw new Error("Il codice AI non può essere vuoto.");
  }

  let aiObject;
  try {
    // Il codice dell'utente deve essere un'espressione che restituisce un oggetto.
    // Lo avvolgiamo in una funzione che lo restituisce.
    // L'uso di `(` e `)` intorno al codice è un trucco per garantire che
    // un oggetto letterale `{...}` venga interpretato come un'espressione e non come un blocco di codice.
    const factory = new Function(`return (${code})`);
    aiObject = factory();
  } catch (e) {
    // Se il parsing iniziale fallisce, lancia un errore più descrittivo.
    // Questo aiuta a diagnosticare problemi come codice con sintassi non valida.
    console.error("Errore di sintassi nel codice AI:", e);
    // Riformuliamo il messaggio per essere più chiaro per l'utente.
    // throw new Error(
    //   `Errore di sintassi nel codice: ${e.message}. Assicurati che il codice sia un oggetto JavaScript valido, es: ({ run: function(api) { ... } }).`
    // );
    throw new Error(
      "Errore di sintassi nel codice: Assicurati che il codice sia un oggetto JavaScript valido)."
    );
  }

  // Validazione della struttura dell'oggetto AI compilato
  if (typeof aiObject !== "object" || aiObject === null) {
    throw new Error("AI code must evaluate to an object.");
  }

  // Se l'oggetto non ha un metodo 'run' ma ha una proprietà 'states',
  // presumiamo che sia una definizione di macchina a stati (es. dall'editor visuale).
  // In questo caso, lo fondiamo con l'IA di base che contiene il motore di esecuzione.
  if (
    typeof aiObject.run !== "function" &&
    typeof aiObject.states === "object"
  ) {
    const finalAI = { ...DefaultAIBase, ...aiObject };

    // Eseguiamo una validazione finale sull'oggetto fuso.
    if (typeof finalAI.run !== "function") {
      // Questo non dovrebbe accadere se DefaultAIBase è corretto.
      throw new Error(
        "Failed to merge with base AI engine. The 'run' method is still missing."
      );
    }
    return finalAI;
  }

  if (typeof aiObject.run !== "function") {
    throw new Error("The AI object must have a 'run' method.");
  }

  // Abbiamo rimosso il test di validazione "a secco" (dry-run) per essere meno restrittivi.
  // Questo permette all'utente di definire qualsiasi struttura di oggetto AI,
  // purché rispetti il contratto minimo di avere un metodo `run`.
  // Gli errori di runtime verranno ora rilevati durante la simulazione del gioco.

  // Restituiamo l'oggetto AI creato. Non è più necessario creare una nuova istanza
  // perché non eseguiamo una chiamata di test che potrebbe mutarne lo stato.
  return aiObject;
};

import * as dagre from "dagre";

/**
 * Genera una stringa di codice JavaScript eseguibile a partire dal visualModel.
 * @param {object} visualModel - Il modello visuale dell'IA.
 * @returns {string} Una stringa di codice JavaScript che rappresenta l'IA.
 */
export const generateAICodeFromVisualModel = (visualModel) => {
  if (!visualModel) {
    return "/* No visual model found */";
  }

  const { nodes, edges, globalTransitions } = visualModel;

  // Crea una mappa per cercare rapidamente il nome di un nodo dal suo ID.
  const nodeNameMap = new Map(nodes.map((node) => [node.id, node.data.name]));

  // 1. Genera il codice per la mappa degli stati
  const statesCode = nodes
    .map((node) => {
      const { id, data } = node;
      // 1. Genera il frammento di codice per questo stato specifico.
      // Usiamo JSON.stringify per garantire che nomi, target e descrizioni
      // con caratteri speciali (es. apostrofi) vengano gestiti correttamente.
      // Questa è la soluzione standard e robusta per questo tipo di problema.
      const stateCodeFragment = `${JSON.stringify(data.name)}: {
       ${data.onEnter || ""} ,
       ${data.onExecute || ""} ,
      ${data.onExit || ""} ,
      transitions: [
        ${edges
          .filter((edge) => edge.source === id)
          .map((edge) => {
            const targetNodeName = nodeNameMap.get(edge.target);
            if (!targetNodeName) {
              // Questo caso non dovrebbe accadere se il modello è consistente.
              // Aggiungiamo un commento per il debug in caso di problemi.
              return `/* Transizione non valida: target ${edge.target} non trovato */`;
            }
            return `
          {
            target: ${JSON.stringify(targetNodeName)},
            condition: ${edge.data.condition || "() => true"},
            description: ${JSON.stringify(edge.label || "")}
          }
        `;
          })
          .join(",\n")}
      ]
    }`;

      // 2. Tenta di validare questo frammento isolandolo in un oggetto valido.
      // Questo cattura errori di sintassi sia nel codice utente (onEnter, etc.)
      // sia nella struttura (es. un nome di stato con un apostrofo non gestito).
      try {
        const validationWrapper = `({ ${stateCodeFragment} })`;
        new Function(`return ${validationWrapper}`)();
      } catch (e) {
        // Se la validazione fallisce, lancia un errore specifico e utile.
        throw new Error(
          `Errore di sintassi nello stato "${data.name}": ${e.message}`
        );
      }

      // 3. Se la validazione ha successo, restituisci il frammento per l'assemblaggio finale.
      return stateCodeFragment;
    })
    .join(",\n");

  // 2. Genera il codice per le transizioni globali
  const globalTransitionsCode = globalTransitions
    .map(
      (transition) => `
    {
      target: ${JSON.stringify(transition.target)},
      condition: ${transition.data.condition || "() => true"},
      description: ${JSON.stringify(transition.label || "")}
    }
  `
    )
    .join(",\n");

  // 3. Assembla il codice completo
  const code = `
  ({
    states: {${statesCode}},
    globalTransitions: [${globalTransitionsCode}]
  })
  `;

  return code;
};

/**
 * Genera un oggetto visualModel compatibile con React Flow a partire da un oggetto AI.
 * @param {object} aiObject - L'oggetto AI da "decompilare".
 * @returns {object} Un visualModel con nodi, archi e transizioni globali.
 */
export const generateVisualModelFromAIObject = (aiObject) => {
  const nodes = [];
  const edges = [];
  const globalTransitions = [];

  if (!aiObject || !aiObject.states) {
    return { nodes, edges, globalTransitions };
  }

  const stateNames = Object.keys(aiObject.states);
  const nameToIdMap = new Map();

  // Crea prima gli ID dei nodi, perché servono sia per i nodi che per gli archi
  stateNames.forEach((stateName, index) => {
    const nodeId = `state_${stateName.replace(/\s+/g, "_")}_${index}`;
    nameToIdMap.set(stateName, nodeId);
  });

  // --- Calcolo del Layout con Dagre ---
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 150 }); // Layout da Sinistra a Destra (Left-to-Right)
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Dimensioni approssimative di un nodo per il calcolo del layout
  const NODE_WIDTH = 256; // Corrisponde a w-64 in StateNode.jsx
  const NODE_HEIGHT = 110; // Altezza approssimativa

  // Aggiungi nodi e archi al grafo di Dagre
  stateNames.forEach((stateName) => {
    const sourceId = nameToIdMap.get(stateName);
    dagreGraph.setNode(sourceId, { width: NODE_WIDTH, height: NODE_HEIGHT });

    const stateData = aiObject.states[stateName];
    if (stateData.transitions) {
      stateData.transitions.forEach((transition) => {
        const targetId = nameToIdMap.get(transition.target);
        if (sourceId && targetId) {
          dagreGraph.setEdge(sourceId, targetId);
        }
      });
    }
  });

  dagre.layout(dagreGraph);
  // --- Fine Calcolo Layout ---

  // 1. Crea i nodi per ogni stato
  stateNames.forEach((stateName) => {
    const stateData = aiObject.states[stateName];
    const nodeId = nameToIdMap.get(stateName);
    const nodePosition = dagreGraph.node(nodeId);

    nodes.push({
      id: nodeId,
      type: "stateNode",
      position: {
        x: nodePosition.x - NODE_WIDTH / 2,
        y: nodePosition.y - NODE_HEIGHT / 2,
      },
      data: {
        name: stateName,
        onEnter: stateData.onEnter?.toString() || "",
        onExecute: stateData.onExecute?.toString() || "",
        onExit: stateData.onExit?.toString() || "",
      },
    });
  });

  // 2. Crea gli archi (transizioni locali) per ogni stato
  stateNames.forEach((stateName) => {
    const stateData = aiObject.states[stateName];
    if (stateData.transitions) {
      stateData.transitions.forEach((transition, i) => {
        const sourceId = nameToIdMap.get(stateName);
        const targetId = nameToIdMap.get(transition.target);

        if (sourceId && targetId) {
          edges.push({
            id: `edge_${sourceId}_to_${targetId}_${i}`,
            source: sourceId,
            target: targetId,
            label: transition.description || "",
            data: {
              condition: transition.condition?.toString() || "() => true",
            },
          });
        }
      });
    }
  });

  // 3. Crea le transizioni globali
  if (aiObject.globalTransitions) {
    aiObject.globalTransitions.forEach((transition, i) => {
      globalTransitions.push({
        id: `global_transition_${i}_${Date.now()}`,
        target: transition.target,
        label: transition.description || "",
        data: {
          condition: transition.condition?.toString() || "() => true",
        },
      });
    });
  }

  return { nodes, edges, globalTransitions };
};

/**
 * Funzione ricorsiva per stringificare un oggetto, gestendo correttamente
 * oggetti, array, funzioni e primitivi in una stringa di codice formattata.
 * @param {*} value - Il valore da stringificare.
 * @param {string} indent - La stringa di indentazione corrente.
 * @returns {string}
 */
function stringifyRecursive(value, indent) {
  const nextIndent = indent + "  ";

  // Gestione dei tipi primitivi e delle funzioni non in oggetti
  if (value === null) return "null";
  if (typeof value !== "object") {
    if (typeof value === "function") {
      // Assicura che l'indentazione sia corretta per funzioni multiriga
      return value.toString().replace(/\n/g, `\n${indent}`);
    }
    return JSON.stringify(value);
  }

  // Gestione degli Array
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const arrayParts = value.map(
      (item) => `${nextIndent}${stringifyRecursive(item, nextIndent)}`
    );
    return `[\n${arrayParts.join(",\n")}\n${indent}]`;
  }

  // Gestione degli Oggetti
  const keys = Object.keys(value);
  if (keys.length === 0) return "{}";

  const parts = [];
  for (const key of keys) {
    const propValue = value[key];

    if (typeof propValue === "function") {
      const funcStr = propValue.toString().replace(/\n/g, `\n${nextIndent}`);
      // Gestisce la differenza tra `myMethod() {}` e `myFunc: function() {}`
      if (funcStr.startsWith("function") || funcStr.startsWith("(")) {
        parts.push(`${nextIndent}${key}: ${funcStr}`);
      } else {
        parts.push(`${nextIndent}${funcStr}`);
      }
    } else {
      const valueStr = stringifyRecursive(propValue, nextIndent);
      parts.push(`${nextIndent}"${key}": ${valueStr}`);
    }
  }

  return `{\n${parts.join(",\n")}\n${indent}}`;
}

/**
 * Converte un oggetto AI in una stringa di codice sorgente che può essere valutata.
 * Gestisce correttamente oggetti annidati e funzioni.
 * @param {object} aiObject - L'oggetto AI da stringificare.
 * @returns {string}
 */
export const stringifyAI = (aiObject) => {
  // Le parentesi esterne sono cruciali per l'interpretazione come espressione oggetto.
  return `(${stringifyRecursive(aiObject, "")})`;
};
