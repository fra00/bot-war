# Tutorial: Creare un'IA con una Macchina a Stati (FSM)

Benvenuto nella guida alla creazione di un'intelligenza artificiale per il tuo bot! In questo tutorial, costruiremo un'IA efficace utilizzando un pattern di progettazione molto potente e comune nei giochi: la **Macchina a Stati Finiti** (Finite State Machine o FSM).

Una FSM è un modo per organizzare la logica di un'entità (in questo caso, il nostro bot) in diversi **stati** (come `SEARCHING`, `ATTACKING`, `EVADING`) e definire delle **transizioni**, ovvero le regole che determinano quando passare da uno stato all'altro.

---

## Passo 1: La Struttura di Base

Iniziamo con lo scheletro della nostra IA. Questo codice definisce un'architettura FSM avanzata. Copialo e incollalo nell'editor.

I concetti chiave sono:

- `constants`: Un posto dove mettere le costanti per una facile configurazione.
- `emergencyTransitions`: Hanno la **priorità assoluta** e servono per gestire eventi critici come essere colpiti. Vengono controllate ad ogni tick, prima di ogni altra cosa.
- `tacticalTransitions`: Gestiscono le **decisioni strategiche** come attaccare o ritirarsi. Hanno una priorità media.
- `states`: Qui definiamo i comportamenti specifici di ogni stato.

Il motore della FSM (`run` e `setCurrentState`) è già scritto per te e non va modificato. Il nostro compito sarà riempire le sezioni `constants`, le transizioni e gli stati.

```javascript
({
  // =================================================================
  // CONFIGURAZIONE
  // =================================================================
  constants: {
    patrolSpeed: 70,
    aimTolerance: 5,
    evasionGracePeriod: 120, // Tick di "invulnerabilità" dopo un'evasione
  },

  // =================================================================
  // TRANSIZIONI DI EMERGENZA (Priorità Massima)
  // =================================================================
  emergencyTransitions: [
    // Le riempiremo nel Passo 4
  ],

  // =================================================================
  // TRANSIZIONI TATTICHE (Priorità Media)
  // =================================================================
  tacticalTransitions: [
    // Le riempiremo nel Passo 2
  ],

  // =================================================================
  // DEFINIZIONE DEGLI STATI
  // =================================================================
  states: {
    // Li definiremo nei prossimi passi
  },

  // =================================================================
  // MOTORE FSM (NON MODIFICARE)
  // =================================================================
  _predictTargetPosition: function (enemy, api) {
    const projectileSpeed = 1000; // Velocità del proiettile in unità/secondo
    const distance = enemy.distance;
    const timeToImpact = distance / projectileSpeed;
    const predictedPos = {
      x: enemy.x + enemy.velocity.x * timeToImpact,
      y: enemy.y + enemy.velocity.y * timeToImpact,
    };
    return predictedPos;
  },

  setCurrentState: function (newState, api, context = {}) {
    const memory = api.getMemory();
    const oldState = memory.current;

    if (oldState !== newState) {
      if (oldState && this.states[oldState]?.onExit) {
        this.states[oldState].onExit.call(this, api, memory);
      }
      api.stop("STATE_TRANSITION");
      api.log(`Stato: ${oldState || "undefined"} -> ${newState}`);
      api.updateMemory({ current: newState, lastState: oldState });
      if (this.states[newState]?.onEnter) {
        this.states[newState].onEnter.call(this, api, memory, context);
      }
    }
  },

  run: function (api) {
    const memory = api.getMemory();

    if (typeof memory.current === "undefined") {
      api.updateMemory({
        evasionGraceTicks: 0,
        stateGraceTicks: 0,
      });
      this.setCurrentState("SEARCHING", api);
      return;
    }

    if (memory.evasionGraceTicks > 0) {
      api.updateMemory({ evasionGraceTicks: memory.evasionGraceTicks - 1 });
    }
    if (memory.stateGraceTicks > 0) {
      api.updateMemory({ stateGraceTicks: memory.stateGraceTicks - 1 });
    }

    const events = api.getEvents();
    const enemy = api.scan();
    const battery = api.getBatteryState();
    const batteryPercent = (battery.energy / battery.maxEnergy) * 100;
    const currentStateName = memory.current;
    const currentState = this.states[currentStateName];
    const context = {
      enemy,
      batteryPercent,
      constants: this.constants,
      currentStateName,
      currentState,
    };

    if (this.emergencyTransitions) {
      for (const transition of this.emergencyTransitions) {
        if (transition.condition.call(this, api, memory, context, events)) {
          this.setCurrentState(transition.target, api, context);
          return;
        }
      }
    }

    const canBeInterruptedBy = currentState?.interruptibleBy || null;

    if (this.tacticalTransitions) {
      for (const transition of this.tacticalTransitions) {
        if (
          (!canBeInterruptedBy ||
            canBeInterruptedBy.includes(transition.target)) &&
          transition.condition.call(this, api, memory, context, events)
        ) {
          this.setCurrentState(transition.target, api, context);
          return;
        }
      }
    }

    if (currentState?.transitions) {
      for (const transition of currentState.transitions) {
        if (transition.condition.call(this, api, memory, context, events)) {
          this.setCurrentState(transition.target, api, context);
          return;
        }
      }
    }

    if (currentState?.onExecute) {
      const nextStateName = currentState.onExecute.call(
        this,
        api,
        memory,
        events,
        context
      );
      if (nextStateName && nextStateName !== currentStateName) {
        this.setCurrentState(nextStateName, api, context);
      }
    }
  },
});
```

---

## Passo 2: Implementare lo Stato `SEARCHING`

Il nostro bot deve pattugliare l'arena quando non vede un nemico.

1.  **Transizione Tattica**: Aggiungiamo una regola in `tacticalTransitions` per passare allo stato `ATTACKING` non appena `api.scan()` rileva un nemico.
2.  **Logica di Stato**: Nello stato `SEARCHING`, se il bot è inattivo (`api.isQueueEmpty()`), avvia un pattugliamento verso un punto casuale e raggiungibile usando `api.getRandomPoint()`.

Aggiungi questo codice nelle sezioni appropriate del tuo scheletro.

```javascript
// Inserisci questa transizione nell'array `tacticalTransitions`
{
  target: 'ATTACKING',
  condition: function (api, readOnlyMemory, context) {
    return context.enemy;
  },
  description: "Nemico rilevato, ingaggiare l'attacco.",
},

// Inserisci questo stato nell'oggetto `states`
SEARCHING: {
  onEnter: (api, readOnlyMemory) => {
    api.log("Inizio pattugliamento...");
  },
  onExecute: function (api, readOnlyMemory, events) {
    if (api.isQueueEmpty()) {
      const randomPoint = api.getRandomPoint();
      if (randomPoint) {
        api.moveTo(randomPoint.x, randomPoint.y, this.constants.patrolSpeed);
      }
    }
  },
},
```

---

## Passo 3: Implementare lo Stato `ATTACKING`

Quando il bot vede un nemico, entra in `ATTACKING`. La sua logica è:

1.  **Mira Predittiva**: Invece di mirare alla posizione attuale del nemico, usiamo la funzione `_predictTargetPosition` per calcolare dove si troverà quando il nostro proiettile arriverà. Questo aumenta drasticamente la precisione.
2.  **Fuoco**: Se la mira è allineata (entro la `aimTolerance`) e la linea di tiro è libera, spara.
3.  **Transizione Locale**: Se il nemico non è più visibile (`!context.enemy`), definiamo una transizione locale per tornare a `SEARCHING`.

Aggiungi questo oggetto all'interno della mappa `states`:

```javascript
// Inserisci questo stato nell'oggetto `states`
ATTACKING: {
  onExecute: function (api, readOnlyMemory, events, context) {
    const { enemy } = context;
    if (!enemy) return;

    const predictedPos = this._predictTargetPosition(enemy, api);
    api.aimAt(predictedPos.x, predictedPos.y);

    if (
      Math.abs(enemy.angle) < this.constants.aimTolerance &&
      api.isLineOfSightClear(enemy)
    ) {
      api.fire();
    }
  },
  transitions: [
    {
      target: 'SEARCHING',
      condition: function (api, readOnlyMemory, context) {
        return !context.enemy;
      },
      description: "Passa a cercare se il nemico non è più visibile."
    }
  ]
},
```

---

## Passo 4: Implementare lo Stato `EVADING`

Reagire ai danni è un'emergenza.

1.  **Transizione di Emergenza**: Aggiungiamo una regola in `emergencyTransitions` per passare a `EVADING` quando il bot viene colpito e non è in un "periodo di grazia".
2.  **Logica di Stato**: All'ingresso in `EVADING`, usiamo il comando `api.strafe()` per una schivata rapida e impostiamo un `evasionGraceTicks` per evitare di essere interrotti subito da un altro colpo.
3.  **Transizione Locale**: Una volta finita la manovra (`api.isQueueEmpty()`), torniamo a `SEARCHING`.

Aggiungi questo codice nelle sezioni appropriate:

```javascript
// Inserisci questa transizione nell'array `emergencyTransitions`
{
  target: "EVADING",
  condition: function (api, readOnlyMemory, context, events) {
    return (
      events.some((e) => e.type === "HIT_BY_PROJECTILE") &&
      readOnlyMemory.evasionGraceTicks <= 0
    );
  },
  description: "Colpiti da un proiettile, evasione ha la priorità.",
},

// Inserisci questo stato nell'oggetto `states`
EVADING: {
  onEnter: function (api, readOnlyMemory) {
    api.log("Colpito! Eseguo manovra evasiva con strafe...");
    api.updateMemory({ evasionGraceTicks: this.constants.evasionGracePeriod });
    api.strafe(Math.random() < 0.5 ? 'left' : 'right');
  },
  transitions: [
    {
      target: 'SEARCHING',
      condition: function (api) {
        return api.isQueueEmpty();
      },
      description: "Torna a cercare dopo aver completato la manovra evasiva."
    }
  ]
},
```

---

## Passo 5: Ritirata Strategica con `interruptibleBy`

A volte, un bot deve dare priorità alla sopravvivenza piuttosto che all'attacco. Se la batteria è quasi scarica, continuare a combattere potrebbe essere un suicidio.

Qui entra in gioco `interruptibleBy`. È una proprietà che possiamo aggiungere a uno stato per definire _esattamente_ quali transizioni tattiche possono interromperlo. Se non lo definiamo, qualsiasi transizione tattica può interrompere lo stato. Se lo impostiamo a un array vuoto (`[]`), nessuna transizione tattica potrà interromperlo.

1.  **Configurazione**: Aggiungiamo una soglia per la batteria scarica.
2.  **Transizioni Tattiche Riorganizzate**: Dobbiamo dare la priorità alla fuga. Sostituiamo l'intero array `tacticalTransitions` con uno nuovo che controlla prima la batteria e solo dopo la presenza di un nemico.
3.  **Stato `FLEEING`**: In questo stato, il bot si muove verso un angolo per ricaricarsi. Usiamo `interruptibleBy: []` per assicurarci che, una volta iniziata la fuga, non si distragga per attaccare un nemico, anche se ne vede uno.

Modifica il tuo codice con questi frammenti:

```javascript
// Inserisci questo in `constants`
lowBatteryThreshold: 30, // Percentuale sotto cui considerare la batteria scarica

// SOSTITUISCI l'intero array `tacticalTransitions` con questo
tacticalTransitions: [
  {
    target: "FLEEING",
    condition: function (api, readOnlyMemory, context) {
      return context.batteryPercent < context.constants.lowBatteryThreshold;
    },
    description: "Batteria scarica, ritirata strategica.",
  },
  {
    target: "ATTACKING",
    condition: function (api, readOnlyMemory, context) {
      return context.enemy &&
        context.batteryPercent >= context.constants.lowBatteryThreshold;
    },
    description: "Nemico rilevato e batteria sufficiente, ingaggiare l'attacco.",
  },
],

// Aggiungi questo nuovo stato all'oggetto `states`
FLEEING: {
  interruptibleBy: [], // Non può essere interrotto da transizioni tattiche
  onEnter: function (api) {
    api.log("Batteria scarica! Inizio la ritirata verso un angolo.");
    const corner = api.getCorner();
    if (corner) {
      api.moveTo(corner.x, corner.y);
    }
  },
  onExecute: function (api, readOnlyMemory, events, context) {
    // Se durante la fuga la batteria si ricarica, possiamo tornare a cercare
    if (context.batteryPercent > context.constants.lowBatteryThreshold + 10) {
      return "SEARCHING";
    }
  },
  transitions: [
    {
      target: "SEARCHING",
      condition: function (api) {
        return api.isQueueEmpty();
      },
      description: "Angolo raggiunto, inizio a ricaricare e a guardarmi intorno.",
    },
  ],
},
```

---

## Passo 6: Conclusione e Codice Completo

Congratulazioni! Hai costruito un'IA competente con una struttura robusta che sa quando combattere, quando schivare e quando ritirarsi. Ora puoi sperimentare aggiungendo nuovi stati o migliorando le strategie esistenti.

Ecco il codice completo che puoi copiare e incollare direttamente nell'editor per vederlo in azione.

```javascript
({
  // =================================================================
  // CONFIGURAZIONE
  // =================================================================
  constants: {
    patrolSpeed: 70,
    aimTolerance: 5,
    evasionGracePeriod: 120, // Tick di "invulnerabilità" dopo un'evasione
    lowBatteryThreshold: 30, // Percentuale sotto cui considerare la batteria scarica
  },

  // =================================================================
  // TRANSIZIONI DI EMERGENZA (Priorità Massima)
  // =================================================================
  emergencyTransitions: [
    {
      target: "EVADING",
      condition: function (api, readOnlyMemory, context, events) {
        return (
          events.some((e) => e.type === "HIT_BY_PROJECTILE") &&
          readOnlyMemory.evasionGraceTicks <= 0
        );
      },
      description: "Colpiti da un proiettile, evasione ha la priorità.",
    },
  ],

  // =================================================================
  // TRANSIZIONI TATTICHE (Priorità Media)
  // =================================================================
  tacticalTransitions: [
    {
      target: "FLEEING",
      condition: function (api, readOnlyMemory, context) {
        return context.batteryPercent < context.constants.lowBatteryThreshold;
      },
      description: "Batteria scarica, ritirata strategica.",
    },
    {
      target: "ATTACKING",
      condition: function (api, readOnlyMemory, context) {
        return (
          context.enemy &&
          context.batteryPercent >= context.constants.lowBatteryThreshold
        );
      },
      description:
        "Nemico rilevato e batteria sufficiente, ingaggiare l'attacco.",
    },
  ],

  // =================================================================
  // DEFINIZIONE DEGLI STATI
  // =================================================================
  states: {
    SEARCHING: {
      onEnter: (api, readOnlyMemory) => {
        api.log("Inizio pattugliamento...");
      },
      onExecute: function (api, readOnlyMemory, events) {
        if (api.isQueueEmpty()) {
          const randomPoint = api.getRandomPoint();
          if (randomPoint) {
            api.moveTo(
              randomPoint.x,
              randomPoint.y,
              this.constants.patrolSpeed
            );
          }
        }
      },
    },
    ATTACKING: {
      onExecute: function (api, readOnlyMemory, events, context) {
        const { enemy } = context;
        if (!enemy) return;

        const predictedPos = this._predictTargetPosition(enemy, api);
        api.aimAt(predictedPos.x, predictedPos.y);

        if (
          Math.abs(enemy.angle) < this.constants.aimTolerance &&
          api.isLineOfSightClear(enemy)
        ) {
          api.fire();
        }
      },
      transitions: [
        {
          target: "SEARCHING",
          condition: function (api, readOnlyMemory, context) {
            return !context.enemy;
          },
          description: "Passa a cercare se il nemico non è più visibile.",
        },
      ],
    },
    FLEEING: {
      interruptibleBy: [], // Non può essere interrotto da transizioni tattiche
      onEnter: function (api) {
        api.log("Batteria scarica! Inizio la ritirata verso un angolo.");
        const corner = api.getCorner();
        if (corner) {
          api.moveTo(corner.x, corner.y);
        }
      },
      onExecute: function (api, readOnlyMemory, events, context) {
        // Se durante la fuga la batteria si ricarica, possiamo tornare a cercare
        if (
          context.batteryPercent >
          context.constants.lowBatteryThreshold + 10
        ) {
          return "SEARCHING";
        }
      },
      transitions: [
        {
          target: "SEARCHING",
          condition: function (api) {
            return api.isQueueEmpty();
          },
          description:
            "Angolo raggiunto, inizio a ricaricare e a guardarmi intorno.",
        },
      ],
    },
    EVADING: {
      onEnter: function (api, readOnlyMemory) {
        api.log("Colpito! Eseguo manovra evasiva con strafe...");
        api.updateMemory({
          evasionGraceTicks: this.constants.evasionGracePeriod,
        });
        api.strafe(Math.random() < 0.5 ? "left" : "right");
      },
      transitions: [
        {
          target: "SEARCHING",
          condition: function (api) {
            return api.isQueueEmpty();
          },
          description:
            "Torna a cercare dopo aver completato la manovra evasiva.",
        },
      ],
    },
  },

  // =================================================================
  // MOTORE FSM (NON MODIFICARE)
  // =================================================================
  _predictTargetPosition: function (enemy, api) {
    const projectileSpeed = 1000; // Velocità del proiettile in unità/secondo
    const distance = enemy.distance;
    const timeToImpact = distance / projectileSpeed;
    const predictedPos = {
      x: enemy.x + enemy.velocity.x * timeToImpact,
      y: enemy.y + enemy.velocity.y * timeToImpact,
    };
    return predictedPos;
  },

  setCurrentState: function (newState, api, context = {}) {
    const memory = api.getMemory();
    const oldState = memory.current;

    if (oldState !== newState) {
      if (oldState && this.states[oldState]?.onExit) {
        this.states[oldState].onExit.call(this, api, memory);
      }
      api.stop("STATE_TRANSITION");
      api.log(`Stato: ${oldState || "undefined"} -> ${newState}`);
      api.updateMemory({ current: newState, lastState: oldState });
      if (this.states[newState]?.onEnter) {
        this.states[newState].onEnter.call(this, api, memory, context);
      }
    }
  },

  run: function (api) {
    const memory = api.getMemory();

    if (typeof memory.current === "undefined") {
      api.updateMemory({
        evasionGraceTicks: 0,
        stateGraceTicks: 0,
      });
      this.setCurrentState("SEARCHING", api);
      return;
    }

    if (memory.evasionGraceTicks > 0) {
      api.updateMemory({ evasionGraceTicks: memory.evasionGraceTicks - 1 });
    }
    if (memory.stateGraceTicks > 0) {
      api.updateMemory({ stateGraceTicks: memory.stateGraceTicks - 1 });
    }

    const events = api.getEvents();
    const enemy = api.scan();
    const battery = api.getBatteryState();
    const batteryPercent = (battery.energy / battery.maxEnergy) * 100;
    const currentStateName = memory.current;
    const currentState = this.states[currentStateName];
    const context = {
      enemy,
      batteryPercent,
      constants: this.constants,
      currentStateName,
      currentState,
    };

    if (this.emergencyTransitions) {
      for (const transition of this.emergencyTransitions) {
        if (transition.condition.call(this, api, memory, context, events)) {
          this.setCurrentState(transition.target, api, context);
          return;
        }
      }
    }

    const canBeInterruptedBy = currentState?.interruptibleBy || null;

    if (this.tacticalTransitions) {
      for (const transition of this.tacticalTransitions) {
        if (
          (!canBeInterruptedBy ||
            canBeInterruptedBy.includes(transition.target)) &&
          transition.condition.call(this, api, memory, context, events)
        ) {
          this.setCurrentState(transition.target, api, context);
          return;
        }
      }
    }

    if (currentState?.transitions) {
      for (const transition of currentState.transitions) {
        if (transition.condition.call(this, api, memory, context, events)) {
          this.setCurrentState(transition.target, api, context);
          return;
        }
      }
    }

    if (currentState?.onExecute) {
      const nextStateName = currentState.onExecute.call(
        this,
        api,
        memory,
        events,
        context
      );
      if (nextStateName && nextStateName !== currentStateName) {
        this.setCurrentState(nextStateName, api, context);
      }
    }
  },
});
```
