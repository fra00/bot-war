/**
 * Genera una stringa di dichiarazione TypeScript per l'autocompletamento
 * nell'editor Monaco, basata sui parametri richiesti.
 * @param {Array<'api' | 'memory' | 'context' | 'events'>} params - I parametri da includere.
 * @returns {string} La stringa di dichiarazione dei tipi.
 */
export const generateAITypings = (params = []) => {
  const typings = {
    api: `
      /**
       * L'interfaccia di programmazione per controllare il tuo bot.
       */
      declare const api: {
        /** Registra un messaggio o un oggetto nel pannello di log del bot. */
        log: (...args: any[]) => void;

        /** Accoda un'azione di movimento per una distanza specifica. */
        move: (distance: number, speedPercentage?: number) => void;

        /** Calcola un percorso e accoda i comandi per raggiungere una destinazione. */
        moveTo: (targetX: number, targetY: number, speedPercentage?: number) => boolean;

        /** Accoda un'azione di rotazione di un angolo specifico. */
        rotate: (angle: number, speedPercentage?: number) => void;

        /** Comando "continuo" per mirare a una destinazione. */
        aimAt: (targetX: number, targetY: number, speedPercentage?: number) => void;

        /** Interrompe immediatamente il comando in esecuzione e svuota la coda. */
        stop: (source?: string) => void;

        /** Accoda una serie di comandi personalizzati da eseguire in sequenza. */
        sequence: (actions: Array<{ type: string, payload: any }>) => void;

        /** Spara un proiettile nella direzione attuale. Azione istantanea. */
        fire: () => void;

        /** Restituisce il risultato dell'ultima scansione radar. */
        scan: () => { id: string, x: number, y: number, distance: number, angle: number } | null;

        /** Restituisce una lista di ostacoli nel raggio del radar. */
        scanObstacles: () => Array<{id: string, x: number, y: number, width: number, height: number, distance: number}>;

        /** Restituisce lo stato attuale e istantaneo del tuo robot. */
        getState: () => { x: number, y: number, rotation: number, hp: number, energy: number };

        /** Restituisce lo stato attuale della batteria del robot. */
        getBatteryState: () => { energy: number, maxEnergy: number };

        /** Restituisce lo stato attuale dell'armatura del robot. */
        getArmorState: () => { hp: number, maxHp: number };

        /** Restituisce lo stato attuale dello scafo del robot. */
        getHullState: () => { hp: number, maxHp: number };

        /** Restituisce le dimensioni e gli ostacoli dell'arena. */
        getArenaDimensions: () => { width: number, height: number, obstacles: any[] };

        /** Controlla se la coda di comandi del robot è vuota. */
        isQueueEmpty: () => boolean;

        /** Verifica se c'è una linea di tiro libera da ostacoli tra il tuo robot e una posizione. */
        isLineOfSightClear: (targetPosition: { x: number, y: number }) => boolean;

        /** Controlla se una data coordinata è una posizione valida. */
        isPositionValid: (position: { x: number, y: number }) => boolean;

        /** Restituisce l'oggetto di memoria persistente del robot. */
        getMemory: () => any;

        /** Aggiorna o aggiunge proprietà all'oggetto di memoria del robot. */
        updateMemory: (propertiesToUpdate: object) => any;

        /** Restituisce un array di eventi accaduti nell'ultimo tick. */
        getEvents: () => Array<any>;

        /** Controlla la presenza di un ostacolo molto vicino nella direzione di movimento attuale. */
        isObstacleAhead: (probeDistance?: number) => boolean;

        /** Genera un punto casuale valido all'interno dell'arena o di un'area specificata. */
        getRandomPoint: (bounds?: { x: number, y: number, endX: number, endY: number }) => { x: number, y: number } | null;
      };
    `,
    memory: `
      /**
       * Un oggetto persistente che puoi usare per memorizzare informazioni tra un tick e l'altro.
       * La sua struttura è definita da te.
       * Esempio: memory.lastKnownEnemyPosition = {x: 100, y: 200};
       */
      declare const memory: any;
    `,
    context: `
      /**
       * Un oggetto che contiene informazioni calcolate e utili per il tick corrente.
       */
      declare const context: {
        /** Risultato di api.scan(). Contiene i dati del nemico se visibile, altrimenti null. */
        enemy: { id: string, x: number, y: number, distance: number, angle: number } | null;
        /** La percentuale di batteria rimanente (da 0 a 100). */
        batteryPercent: number;
        /** L'oggetto 'config' definito all'inizio della tua IA. */
        config: any;
      };
    `,
    events: `
      /**
       * Un array che contiene tutti gli eventi accaduti nell'ultimo tick.
       * Esempi: { type: 'HIT_BY_PROJECTILE' }, { type: 'SEQUENCE_COMPLETED' }
       */
      declare const events: Array<{ type: string, [key: string]: any }>;
    `,
  };

  return params.map((param) => typings[param]).join("\n");
};
