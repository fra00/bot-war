import React, { useState, useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import GameManager from "../game/GameManager";
import DefaultAI from "../../game/ai/DefaultAIBase";
import useDisclosure from "../ui/useDisclosure";
import ApiDocsModal from "../docs/ApiDocsModal";
import TutorialModal from "../docs/TutorialModal";
import { compileAI } from "../../game/ai/compiler";
import { useAIScripts } from "../../hooks/useAIScripts";
import { useTutorial } from "../../hooks/useTutorial";
import InteractiveTutorial from "../tutorial/InteractiveTutorial";
import { tutorialSteps } from "../../config/tutorialSteps";
import { useAuth } from "../../context/AuthContext";
import FirestoreService from "../../services/FirestoreService";
import Arena from "../game/Arena";
import GameInfoPanel from "../game/GameInfoPanel";
import GameUI from "../game/GameUI";

const EditorAndArena = ({ onNavigateBack }) => {
  const {
    isOpen: isEditorOpen,
    onOpen: onEditorOpen,
    onClose: onEditorClose,
  } = useDisclosure();
  const {
    isOpen: isLogOpen,
    onOpen: onLogOpen,
    onClose: onLogClose,
  } = useDisclosure();
  const {
    isOpen: isGameOver,
    onOpen: onGameOverOpen,
    onClose: onGameOverClose,
  } = useDisclosure();
  const {
    isOpen: isApiDocsOpen,
    onOpen: onApiDocsOpen,
    onClose: onApiDocsClose,
  } = useDisclosure();
  const {
    isOpen: isTutorialModalOpen,
    onOpen: onTutorialModalOpen,
    onClose: onTutorialModalClose,
  } = useDisclosure();
  const {
    isOpen: isSettingsModalOpen,
    onOpen: onSettingsModalOpen,
    onClose: onSettingsModalClose,
  } = useDisclosure();
  const {
    isOpen: isLogoutModalOpen,
    onOpen: onLogoutModalOpen,
    onClose: onLogoutModalClose,
  } = useDisclosure();
  const {
    isOpen: isOpponentModalOpen,
    onOpen: onOpponentModalOpen,
    onClose: onOpponentModalClose,
  } = useDisclosure();
  const [gameKey, setGameKey] = useState(0);
  // ID definitivo dello script avversario, usato per la logica di gioco
  const [opponentScriptId, setOpponentScriptId] = useState(null);
  // ID temporaneo dello script avversario, usato nella modale di selezione
  const [tempOpponentScriptId, setTempOpponentScriptId] = useState(null);
  const [opponentAI, setOpponentAI] = useState(() => DefaultAI);
  const [opponentCompileError, setOpponentCompileError] = useState(null);

  const { user, logout } = useAuth();
  const {
    scripts,
    activeScript,
    playerCode,
    playerAI,
    compileError,
    setPlayerCode,
    handleSelectScript,
    handleDeleteScript,
    handleCreateNewScript,
    handleUpdateAI,
    handleSaveOnly,
    handleUpdateBotSettings,
  } = useAIScripts();
  const { isLoading } = useAIScripts();

  const {
    isTutorialActive,
    currentStep,
    currentStepIndex,
    nextStep,
    skipTutorial,
    completeTutorial,
  } = useTutorial();

  // Ref per assicurarsi che le statistiche vengano aggiornate una sola volta per partita
  const statsUpdatedRef = useRef(false);
  useEffect(() => {
    // Resetta il flag ogni volta che il gioco viene riavviato (cambia la chiave)
    statsUpdatedRef.current = false;
  }, [gameKey]);

  // Gestori di eventi "wrappati" per il tutorial
  const handleCreateNewScriptWithTutorial = useCallback(
    (name, code) => {
      if (typeof name === "string") {
        // L'utente ha confermato il nome, quindi creiamo lo script.
        handleCreateNewScript(name, code);
        // Il tutorial è al passo 1 ("Dai un nome..."), quindi avanziamo.
        if (isTutorialActive && currentStepIndex === 3) {
          nextStep();
        }
      } else {
        // L'utente ha solo iniziato la creazione, non passiamo argomenti.
        // Il pannello dell'editor mostrerà l'input.
        // Il tutorial è al passo 0 ("Crea..."), quindi avanziamo.
        if (isTutorialActive && currentStepIndex === 2) {
          nextStep();
        }
      }
    },
    [handleCreateNewScript, isTutorialActive, currentStepIndex, nextStep]
  );

  const handleApplyAIChanges = useCallback(() => {
    const result = handleUpdateAI();
    if (result.success) {
      setGameKey((k) => k + 1);
    }
    return result;
  }, [handleUpdateAI, setGameKey]);

  const handleApplyAIChangesWithTutorial = useCallback(() => {
    const result = handleApplyAIChanges();
    if (isTutorialActive && currentStepIndex === 8) {
      nextStep();
    }
    return result;
  }, [handleApplyAIChanges, isTutorialActive, currentStepIndex, nextStep]);

  const handleBotSettingsOpenWithTutorial = useCallback(() => {
    // Avanza quando l'utente clicca su "Impostazioni Bot" (step 5)
    if (isTutorialActive && currentStepIndex === 5) {
      nextStep();
    }
  }, [isTutorialActive, currentStepIndex, nextStep]);

  const handleSettingsModalOpenWithTutorial = useCallback(() => {
    onSettingsModalOpen();
    // Avanza quando l'utente clicca su "Impostazioni Partita" (step 0)
    if (isTutorialActive && currentStepIndex === 0) {
      nextStep();
    }
  }, [onSettingsModalOpen, isTutorialActive, currentStepIndex, nextStep]);

  const handleUpdateBotSettingsWithTutorial = useCallback(
    (...args) => {
      handleUpdateBotSettings(...args);
      // Avanza dopo aver salvato le impostazioni del bot (step 7)
      if (isTutorialActive && currentStepIndex === 7) {
        nextStep();
      }
    },
    [handleUpdateBotSettings, isTutorialActive, currentStepIndex, nextStep]
  );

  // Effetto per far avanzare il tutorial in base alle azioni dell'utente
  useEffect(() => {
    // Avanza dopo aver attivato il multiplayer (step 6)
    if (
      isTutorialActive &&
      currentStepIndex === 6 &&
      activeScript?.isMultiplayerEligible
    ) {
      nextStep();
    }
  }, [
    activeScript?.isMultiplayerEligible,
    isTutorialActive,
    currentStepIndex,
    nextStep,
  ]);

  const handleRestart = useCallback(() => {
    onGameOverClose();
    setGameKey((k) => k + 1);
  }, [onGameOverClose]);

  const handleLogout = () => {
    logout();
    onLogoutModalClose();
    onNavigateBack(); // Torna al menu principale dopo il logout
  };

  // Apre la modale e sincronizza lo stato temporaneo con quello attuale
  const handleOpponentModalOpen = useCallback(() => {
    setTempOpponentScriptId(opponentScriptId);
    onOpponentModalOpen();
  }, [opponentScriptId, onOpponentModalOpen]);

  // Conferma la selezione, compila la nuova AI e riavvia il gioco
  const handleConfirmOpponentSelection = useCallback(() => {
    const scriptId = tempOpponentScriptId;
    setOpponentScriptId(scriptId); // Applica la selezione temporanea a quella definitiva
    setOpponentCompileError(null); // Pulisce errori precedenti

    if (!scriptId) {
      setOpponentAI(() => DefaultAI);
    } else {
      const script = scripts.find((s) => s.id === scriptId);
      if (script) {
        try {
          // La funzione compileAI restituisce l'oggetto AI o lancia un'eccezione.
          const compiledAI = compileAI(script.code);
          setOpponentAI(() => compiledAI);
        } catch (error) {
          const errorMessage = `Errore di compilazione per l'IA "${script.name}": ${error.message}`;
          setOpponentCompileError(errorMessage);
          console.error(
            `Errore durante la compilazione dell'IA avversaria "${script.name}":`,
            error
          );
          // In caso di errore, torna alla AI di default e resetta la selezione.
          setOpponentAI(() => DefaultAI);
          setOpponentScriptId(null);
        }
      }
    }
    setGameKey((k) => k + 1); // Riavvia il gioco con il nuovo avversario
    onOpponentModalClose();
  }, [tempOpponentScriptId, scripts, onOpponentModalClose]);

  return (
    <div className="relative isolate min-h-screen p-4 pt-20 animate-fade-in">
      {/* Div per lo sfondo, posizionato dietro al contenuto */}
      <div
        className="absolute inset-0 -z-20"
        style={{ backgroundImage: "url('/arena-background.png')" }}
      />
      {/* Overlay scuro per migliorare la leggibilità */}
      <div className="absolute inset-0 -z-10 bg-black/50" />

      {isLoading && (
        <div className="flex items-center justify-center h-full text-lg text-white">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Caricamento script...</span>
        </div>
      )}
      {!isLoading && (
        <GameManager
          key={gameKey}
          playerAI={playerAI || DefaultAI}
          defaultAI={opponentAI}
        >
          {({ gameState, controls }) => {
            // Gli Hook devono essere chiamati incondizionatamente.
            // La logica che dipende da gameState viene eseguita solo quando non è null.

            // Effetto per aggiornare le statistiche a fine partita
            useEffect(() => {
              // Esegui solo se la partita è finita, l'utente è loggato e le stats non sono già state aggiornate
              if (
                gameState &&
                gameState.status === "finished" &&
                user &&
                !statsUpdatedRef.current
              ) {
                statsUpdatedRef.current = true; // Impedisce aggiornamenti multipli

                const playerBotId = activeScript?.id;
                const opponentBotId = opponentScriptId;
                const winnerId = gameState.winner; // 'player', 'opponent', o null
                const matchType = "offline"; // Per ora, tutte le partite sono offline

                if (!playerBotId) return;

                let playerResult;
                let opponentResult;

                if (winnerId === "player") {
                  playerResult = "win";
                  opponentResult = "loss";
                } else if (winnerId === "opponent") {
                  playerResult = "loss";
                  opponentResult = "win";
                } else {
                  playerResult = "draw";
                  opponentResult = "draw";
                }

                // Aggiorna le statistiche per il bot del giocatore
                FirestoreService.updateBotStats(
                  playerBotId,
                  playerResult,
                  matchType
                ).catch((err) =>
                  console.error("Failed to update player stats:", err)
                );

                // Aggiorna le statistiche per l'avversario, se è un bot custom
                if (opponentBotId) {
                  FirestoreService.updateBotStats(
                    opponentBotId,
                    opponentResult,
                    matchType
                  ).catch((err) =>
                    console.error("Failed to update opponent stats:", err)
                  );
                }
              }
            }, [gameState, user, activeScript?.id, opponentScriptId]);

            // Se gameState non è ancora pronto, mostra un placeholder.
            // Questo risolve l'errore degli Hook, perché gli Hook sopra
            // vengono chiamati incondizionatamente ad ogni render.
            if (!gameState) {
              return (
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8">
                    <Arena gameState={null} />
                  </div>
                  <div className="col-span-4">
                    <GameInfoPanel gameState={{}} />
                  </div>
                </div>
              );
            }
            // Il GameManager non conosce il nome dello script AI del giocatore,
            // quindi lo aggiungiamo qui prima di passarlo alla UI.
            // Questo risolve il bug nella modale di fine partita e assicura
            // che i nomi siano corretti in tutta l'interfaccia.
            const enrichedGameState = { ...gameState };

            const opponentScriptName =
              scripts.find((s) => s.id === opponentScriptId)?.name ||
              "Opponent";

            // Il GameManager produce un array `robots`. Lo trasformiamo in `bots`
            // per la UI, arricchendolo con i nomi corretti. Questo risolve il bug
            // per cui le statistiche non si aggiornavano.
            if (gameState.robots) {
              enrichedGameState.bots = gameState.robots.map((bot) => ({
                ...bot,
                name:
                  bot.id === "player"
                    ? activeScript?.name || "Player Bot"
                    : opponentScriptName,
                isCustomAI: bot.id === "opponent" && !!opponentScriptId,
              }));
            }

            // Se la partita è finita, determiniamo il vincitore in modo robusto
            // basandoci sulla salute dei bot, poiché l'oggetto `gameState.winner`
            // originale potrebbe non contenere tutte le informazioni necessarie (come il nome).
            if (gameState.status === "finished" && enrichedGameState.bots) {
              // Il vincitore è l'unico bot rimasto con salute > 0.
              // Se nessuno ha salute, è un pareggio (winner rimane null).
              const winningBot = enrichedGameState.bots.find(
                (bot) => bot.hullHp > 0
              );
              enrichedGameState.winner = winningBot || null;
            }

            return (
              <GameUI
                gameState={enrichedGameState}
                controls={controls}
                onEditorOpen={() => {
                  onEditorOpen();
                  if (isTutorialActive && currentStepIndex === 1) {
                    nextStep();
                  }
                }}
                isEditorOpen={isEditorOpen}
                onEditorClose={onEditorClose}
                playerCode={playerCode}
                onCodeChange={setPlayerCode}
                onUpdate={handleApplyAIChangesWithTutorial}
                compileError={compileError}
                isLogOpen={isLogOpen}
                onLogOpen={onLogOpen}
                onLogClose={onLogClose}
                isGameOver={isGameOver}
                onGameOver={onGameOverOpen}
                onGameOverClose={onGameOverClose}
                onRestart={handleRestart}
                onApiDocsOpen={onApiDocsOpen}
                scripts={scripts}
                activeScript={activeScript}
                onSelectScript={handleSelectScript}
                onDeleteScript={handleDeleteScript}
                onCreateNewScript={handleCreateNewScriptWithTutorial}
                onSaveOnly={handleSaveOnly}
                onUpdateSettings={handleUpdateBotSettingsWithTutorial}
                // Props per la nuova modale di selezione avversario
                isOpponentModalOpen={isOpponentModalOpen}
                onOpponentModalOpen={handleOpponentModalOpen}
                onOpponentModalClose={onOpponentModalClose}
                onConfirmOpponentSelection={handleConfirmOpponentSelection}
                // Passa l'ID temporaneo e la funzione per aggiornarlo alla modale
                opponentScriptId={tempOpponentScriptId}
                onSelectOpponentScript={setTempOpponentScriptId}
                opponentCompileError={opponentCompileError}
                onClearOpponentCompileError={() =>
                  setOpponentCompileError(null)
                }
                user={user}
                onLogout={handleLogout}
                isLogoutModalOpen={isLogoutModalOpen}
                onLogoutModalOpen={onLogoutModalOpen}
                onLogoutModalClose={onLogoutModalClose}
                isSettingsModalOpen={isSettingsModalOpen}
                onSettingsModalOpen={handleSettingsModalOpenWithTutorial}
                onSettingsModalClose={onSettingsModalClose}
                onTutorialModalOpen={onTutorialModalOpen}
                onBotSettingsOpen={handleBotSettingsOpenWithTutorial}
                onNavigateBack={onNavigateBack}
              />
            );
          }}
        </GameManager>
      )}
      <ApiDocsModal isOpen={isApiDocsOpen} onClose={onApiDocsClose} />
      <TutorialModal
        isOpen={isTutorialModalOpen}
        onClose={onTutorialModalClose}
      />
      {isTutorialActive && (
        <InteractiveTutorial
          step={currentStep}
          onNext={nextStep}
          onSkip={skipTutorial}
          stepIndex={currentStepIndex}
          totalSteps={tutorialSteps.length}
        />
      )}
    </div>
  );
};

EditorAndArena.propTypes = {
  /** Funzione per tornare al menu principale. */
  onNavigateBack: PropTypes.func.isRequired,
};

export default EditorAndArena;
