import React, { useState, useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import GameManager from "../game/GameManager";
import useDisclosure from "../ui/useDisclosure";
import ApiDocsModal from "../docs/ApiDocsModal";
import TutorialModal from "../docs/TutorialModal";
import VisualEditorGuideModal from "../docs/VisualEditorGuideModal";
import LLMGuideModal from "../docs/LLMGuideModal";
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
    isOpen: isLLMGuideOpen,
    onOpen: onLLMGuideOpen,
    onClose: onLLMGuideClose,
  } = useDisclosure();
  const {
    isOpen: isVisualEditorGuideOpen,
    onOpen: onVisualEditorGuideOpen,
    onClose: onVisualEditorGuideClose,
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

  const { user, logout } = useAuth();
  const {
    scripts,
    activeScript,
    playerCode,
    visualModel,
    blocklyModel,
    playerAI,
    compileError,
    opponentScriptId,
    opponentAI,
    opponentCompileError,
    handleSelectOpponentScript,
    handleClearOpponentCompileError,
    isLoading,
    setPlayerCode,
    setVisualModel,
    setBlocklyModel,
    handleSelectScript,
    handleDeleteScript,
    handleCreateNewScript,
    handleUpdateAI,
    handleSaveOnly,
    handleUpdateBotSettings,
    handleClearBlocklyModel,
  } = useAIScripts();

  const {
    isTutorialActive,
    currentStep,
    currentStepIndex,
    nextStep,
    skipTutorial,
    completeTutorial,
  } = useTutorial();

  // Ref per evitare che l'effetto di riavvio del gioco venga eseguito al montaggio iniziale.
  const isInitialMountRef = useRef(true);

  // Questo effetto risolve la race condition.
  // Si attiva SOLO quando `playerAI` cambia (dopo un "Applica e Riavvia" andato a buon fine).
  // In questo modo, siamo sicuri che il GameManager venga ricreato con la NUOVA AI.
  useEffect(() => {
    // Salta il primo render per evitare un riavvio non necessario all'avvio.
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Riavvia il gioco cambiando la chiave del GameManager.
    setGameKey((k) => k + 1);
  }, [playerAI, opponentAI]); // La dipendenza è `playerAI` e `opponentAI`.

  // Gestori di eventi "wrappati" per il tutorial
  const handleCreateNewScriptWithTutorial = useCallback(
    (name, code, visualModel) => {
      if (typeof name === "string") {
        // L'utente ha confermato il nome, quindi creiamo lo script.
        handleCreateNewScript(name, code, visualModel);
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

  const handleApplyAIChanges = useCallback(
    async (activeView) => {
      // Ora questa funzione si occupa solo di aggiornare l'IA.
      // Il riavvio del gioco è gestito dall'useEffect che osserva `playerAI`.
      const result = await handleUpdateAI(activeView);
      return result;
    },
    [handleUpdateAI]
  );

  const handleApplyAIChangesWithTutorial = useCallback(
    async (activeView) => {
      const result = await handleApplyAIChanges(activeView);
      if (isTutorialActive && currentStepIndex === 8) {
        nextStep();
      }
      return result;
    },
    [handleApplyAIChanges, isTutorialActive, currentStepIndex, nextStep]
  );

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

  // Ref per assicurarsi che le statistiche vengano aggiornate una sola volta per partita
  const statsUpdatedRef = useRef(false);
  useEffect(() => {
    // Resetta il flag ogni volta che il gioco viene riavviato (cambia la chiave)
    statsUpdatedRef.current = false;
  }, [gameKey]);

  const handleRestart = useCallback(() => {
    onGameOverClose();
    setGameKey((k) => k + 1);
  }, [onGameOverClose]);

  const handleLogout = () => {
    logout();
    onLogoutModalClose();
    onNavigateBack(); // Torna al menu principale dopo il logout
  };

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
        <GameManager key={gameKey} playerAI={playerAI} defaultAI={opponentAI}>
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
                visualModel={visualModel}
                blocklyModel={blocklyModel}
                onBlocklyModelChange={setBlocklyModel}
                onVisualModelChange={setVisualModel}
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
                onClearBlocklyModel={handleClearBlocklyModel}
                isOpponentModalOpen={isOpponentModalOpen}
                onOpponentModalOpen={onOpponentModalOpen}
                onOpponentModalClose={onOpponentModalClose}
                opponentScriptId={opponentScriptId}
                isLoading={isLoading}
                onSelectOpponentScript={handleSelectOpponentScript}
                opponentCompileError={opponentCompileError}
                onClearOpponentCompileError={handleClearOpponentCompileError}
                user={user}
                onLogout={handleLogout}
                isLogoutModalOpen={isLogoutModalOpen}
                onLogoutModalOpen={onLogoutModalOpen}
                onLogoutModalClose={onLogoutModalClose}
                isSettingsModalOpen={isSettingsModalOpen}
                onSettingsModalOpen={handleSettingsModalOpenWithTutorial}
                onSettingsModalClose={onSettingsModalClose}
                onTutorialModalOpen={onTutorialModalOpen}
                onLLMGuideOpen={onLLMGuideOpen}
                // Guida Editor Visuale
                onVisualEditorGuideOpen={onVisualEditorGuideOpen}
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
      <LLMGuideModal isOpen={isLLMGuideOpen} onClose={onLLMGuideClose} />
      <VisualEditorGuideModal
        isOpen={isVisualEditorGuideOpen}
        onClose={onVisualEditorGuideClose}
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
