import DefaultAIBase from "./DefaultAIBase.js";
import { baseFSM } from "./baseFSM.js";

/**
 * Un semplice wrapper per indicare che una stringa deve essere trattata come codice sorgente
 * e non deve essere racchiusa tra virgolette durante la stringificazione.
 */
class RawCode {
  constructor(value) {
    this.value = value || ""; // Assicura che il valore non sia mai null/undefined
    this.__isRawCode = true; // Aggiunge una proprietà unica per l'identificazione
  }
  toString() {
    return this.value;
  }
}

/**
 * Funzione ricorsiva per stringificare un oggetto, gestendo correttamente
 * oggetti, array, funzioni e primitivi in una stringa di codice formattata.
 * @param {*} value - Il valore da stringificare.
 * @param {string} indent - La stringa di indentazione corrente.
 * @returns {string}
 */
function stringifyRecursive(value, indent = "") {
  if (value && value.__isRawCode === true) {
    // Se è un oggetto con la nostra "brand", restituisci il suo valore senza virgolette.
    return value.toString().replace(/\n/g, `\n${indent}`);
  }

  if (value === null) {
    return "null";
  }

  const type = typeof value;

  if (type === "function") {
    return value.toString().replace(/\n/g, `\n${indent}`);
  }

  if (type !== "object") {
    return JSON.stringify(value);
  }

  const nextIndent = indent + "  ";

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map(
      (item) => `${nextIndent}${stringifyRecursive(item, nextIndent)}`
    );
    return `[\n${items.join(",\n")}\n${indent}]`;
  }

  // È un oggetto semplice
  const keys = Object.keys(value);
  if (keys.length === 0) return "{}";

  const validIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  const parts = keys
    .map((key) => {
      const propValue = value[key];
      if (propValue === undefined) return null; // Salta le proprietà undefined

      const keyStr = validIdentifierRegex.test(key) ? key : JSON.stringify(key);
      const valueStr = stringifyRecursive(propValue, nextIndent);

      // Gestisce la sintassi dei metodi come `myMethod() {}` dove la chiave è parte della stringa del valore
      if (
        typeof propValue === "function" &&
        !/^(function|\()/.test(propValue.toString())
      ) {
        return `${nextIndent}${valueStr}`;
      }

      return `${nextIndent}${keyStr}: ${valueStr}`;
    })
    .filter((part) => part !== null);

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

/**
 * Analizza il codice di uno script per determinare se è basato su FSM standard.
 * Questa funzione è un modo leggero per controllare il tipo di script senza
 * eseguire il merge completo di `compileAI`.
 * @param {string} code - Il codice sorgente dello script.
 * @returns {boolean} - True se lo script ha la proprietà `standardFSM: true`, altrimenti false.
 */
export const isStandardFSM = (code) => {
  if (!code || code.trim() === "") {
    return false;
  }

  try {
    const factory = new Function(`return (${code})`);
    const aiObject = factory();
    return !!(aiObject && aiObject.standardFSM === true);
  } catch (e) {
    // Se il codice non è parsabile, non è una FSM valida.
    return false;
  }
};

/**
 * Prepara il codice per l'editor. Se è una FSM standard,
 * rimuove le funzioni interne per mostrare solo la configurazione.
 * @param {string} fullScriptCode - Il codice completo dello script.
 * @returns {string} - Il codice "pulito" da mostrare nell'editor.
 */
export const prepareCodeForEditor = (codeString) => {
  if (!isStandardFSM(codeString)) {
    return codeString; // Se non è una FSM, non toccare nulla.
  }

  try {
    // Analizza il codice dell'utente in un oggetto.
    // Potrebbe contenere funzioni del motore da salvataggi precedenti.
    const userAiObject = new Function(`return (${codeString})`)();

    // Crea una copia per evitare di modificare l'oggetto originale.
    const objectToShow = { ...userAiObject };

    // Rimuove esplicitamente tutte le chiavi che fanno parte del motore FSM di base.
    // Questo garantisce che all'utente venga mostrato solo il suo codice di configurazione.
    for (const key in baseFSM) {
      delete objectToShow[key];
    }

    // Riconverte in stringa l'oggetto "ripulito" per l'editor.
    return stringifyAI(objectToShow);
  } catch (e) {
    console.error("Errore durante la preparazione del codice per l'editor:", e);
    return codeString; // In caso di errore, restituisce il codice originale.
  }
};

/**
 * Prepara il codice per il salvataggio. Se è una FSM standard,
 * fonde il codice parziale con il template base per creare uno script completo.
 * @param {string} editedScriptCode - Il codice (potenzialmente parziale) dall'editor.
 * @returns {string} - Il codice completo e funzionante da salvare.
 */
export const prepareCodeForSaving = (editedScriptCode) => {
  // Se non è una FSM standard, è uno script custom. Lo salviamo così com'è.
  if (!isStandardFSM(editedScriptCode)) {
    return editedScriptCode;
  }

  try {
    // `compileAI` è la nostra funzione di "merge". Riconosce un oggetto
    // con `states` ma senza `run` e lo fonde con DefaultAIBase.
    const fullAiObject = compileAI(editedScriptCode);

    // `stringifyAI` converte l'oggetto completo in una stringa di codice formattata.
    // A differenza di `prepareCodeForEditor`, qui passiamo l'oggetto completo
    // per includere anche il motore della FSM.
    return stringifyAI(fullAiObject);
  } catch (e) {
    console.error(
      "Errore durante la preparazione del codice per il salvataggio:",
      e
    );
    return editedScriptCode; // Fallback: salva il codice così com'è per non perdere il lavoro.
  }
};

import * as dagre from "dagre";

export const GLOBAL_TRANSITIONS_NODE_ID = "__global_transitions__";

export const generateAICodeFromVisualModel = (
  visualModel,
  originalCode = "({})"
) => {
  if (!visualModel || !visualModel.nodes) {
    return "({})";
  }

  // 1. Analizza il codice originale per ottenere l'oggetto base con tutte le proprietà personalizzate
  let originalAIObject;
  try {
    originalAIObject = new Function(`return (${originalCode})`)();
  } catch (e) {
    console.error(
      "Impossibile analizzare il codice AI originale, si riparte da zero.",
      e
    );
    originalAIObject = {};
  }

  const { nodes, edges } = visualModel;

  // 2. Inizia con l'oggetto originale per preservare le proprietà personalizzate (es. config, funzioni helper)
  const aiObject = { ...originalAIObject };

  // 3. Reimposta e ricostruisci le parti FSM dal modello visuale
  aiObject.standardFSM = true;
  aiObject.states = {};
  aiObject.emergencyTransitions = [];
  aiObject.tacticalTransitions = [];

  // Popola gli stati dall'array di nodi
  nodes.forEach((node) => {
    // Ignora il nodo speciale per le transizioni globali
    if (node.id === GLOBAL_TRANSITIONS_NODE_ID) {
      return;
    }

    // Estrae le proprietà che devono essere trattate come codice grezzo
    const { label, onEnter, onExecute, onExit, ...restOfStateData } = node.data;

    // Ricostruisce l'oggetto state, usando RawCode per le funzioni
    try {
      var stateString = `
      return {
        ${onEnter},
        ${onExecute},
        ${onExit}
      }`;
      var statesObj = new Function(stateString)();
    } catch (e) {
      console.error("Errore nel parsing delle funzioni di stato:", e);
      var statesObj = {};
    }

    aiObject.states[node.id] = {
      ...restOfStateData,
      ...statesObj,
      transitions: [], // Verrà popolato dopo
    };
  });

  // 2. Smista gli archi (edges) nei rispettivi array di transizioni
  edges.forEach((edge) => {
    // Separa le proprietà della UI (`type`) e le vecchie `name` e `to`
    // dal resto dei dati della transizione (es. `condition`).
    const {
      type,
      name: oldName,
      to: oldTo,
      target: oldTarget,
      condition,
      ...restOfEdgeData
    } = edge.data;

    const transitionObject = {
      ...restOfEdgeData,
      name: edge.label,
      target: edge.target,
      condition: new RawCode(condition), // Usa RawCode per la condizione
    };

    if (type === "emergency") {
      aiObject.emergencyTransitions.push(transitionObject);
    } else if (type === "tactical") {
      aiObject.tacticalTransitions.push(transitionObject);
    } else if (aiObject.states[edge.source]) {
      aiObject.states[edge.source].transitions.push(transitionObject);
    }
  });

  // 3. Usa la funzione esistente per convertire l'oggetto AI in una stringa di codice formattata
  return stringifyAI(aiObject);
};

export const generateVisualModelFromAIObject = (aiObject) => {
  if (!aiObject || !aiObject.states) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];
  const stateNames = Object.keys(aiObject.states);

  // Aggiunge un nodo "globale" se esistono transizioni di emergenza o tattiche.
  // Questo nodo funge da sorgente per gli archi che possono partire da qualsiasi stato.
  const hasGlobalTransitions =
    (aiObject.emergencyTransitions &&
      aiObject.emergencyTransitions.length > 0) ||
    (aiObject.tacticalTransitions && aiObject.tacticalTransitions.length > 0);

  if (hasGlobalTransitions) {
    nodes.push({
      id: GLOBAL_TRANSITIONS_NODE_ID,
      type: "globalNode", // Tipo di nodo custom per lo stile
      data: { label: "Da Qualsiasi Stato" },
      position: { x: 0, y: 0 }, // La posizione verrà calcolata da dagre
    });
  }

  // Aggiunge i nodi per ogni stato
  stateNames.forEach((stateName) => {
    const originalStateData = aiObject.states[stateName];
    // Separa esplicitamente le transizioni dal resto dei dati dello stato.
    // Questo è il passaggio chiave per evitare di "inquinare" i dati del nodo.
    const { transitions, ...stateLogic } = originalStateData;

    // Crea un oggetto "sicuro" per la UI, convertendo solo le funzioni di primo livello
    // (onEnter, onExecute, onExit) in stringhe di testo.
    // L'array `transitions` viene volutamente escluso e non finirà nei dati del nodo.
    const safeData = {
      ...stateLogic,
      onEnter: stateLogic.onEnter?.toString() || "",
      onExecute: stateLogic.onExecute?.toString() || "",
      onExit: stateLogic.onExit?.toString() || "",
    };

    nodes.push({
      id: stateName,
      type: "stateNode",
      // Assicura che `name` e `label` siano sempre presenti per risolvere i bug di rendering.
      data: { label: stateName, name: stateName, ...safeData },
      position: { x: 0, y: 0 },
    });
  });

  // Aggiunge gli archi per le transizioni standard (da stato a stato)
  stateNames.forEach((stateName) => {
    const stateData = aiObject.states[stateName];
    if (stateData.transitions) {
      stateData.transitions.forEach((transition, i) => {
        // Estrae la funzione `condition` e il resto delle proprietà
        const { condition, ...rest } = transition;
        edges.push({
          id: `e-${stateName}-${transition.target}-${i}`,
          source: stateName,
          target: transition.target,
          label: transition.name || transition.description,
          data: {
            ...rest,
            // Converte la funzione `condition` in una stringa
            condition: condition ? condition.toString() : "() => true",
            type: "standard",
          },
        });
      });
    }
  });

  // Aggiunge gli archi per le transizioni di EMERGENZA
  if (aiObject.emergencyTransitions) {
    aiObject.emergencyTransitions.forEach((transition, i) => {
      // Estrae la funzione `condition` e il resto delle proprietà
      const { condition, ...rest } = transition;
      edges.push({
        id: `e-emergency-${transition.target}-${i}`,
        source: GLOBAL_TRANSITIONS_NODE_ID,
        target: transition.target,
        label: transition.name || transition.description,
        data: {
          ...rest,
          // Converte la funzione `condition` in una stringa
          condition: condition ? condition.toString() : "() => true",
          type: "emergency",
        }, // Tipo per lo stile
      });
    });
  }

  // Aggiunge gli archi per le transizioni TATTICHE
  if (aiObject.tacticalTransitions) {
    aiObject.tacticalTransitions.forEach((transition, i) => {
      // Estrae la funzione `condition` e il resto delle proprietà
      const { condition, ...rest } = transition;
      edges.push({
        id: `e-tactical-${transition.target}-${i}`,
        source: GLOBAL_TRANSITIONS_NODE_ID,
        target: transition.target,
        label: transition.name || transition.description,
        data: {
          ...rest,
          // Converte la funzione `condition` in una stringa
          condition: condition ? condition.toString() : "() => true",
          type: "tactical",
        }, // Tipo per lo stile
      });
    });
  }

  // Layout automatico con Dagre
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 20, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { label: node.data.label, width: 180, height: 120 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    if (!nodeWithPosition) return node; // Nodo non trovato, forse un errore
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
