import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Toolbar from "../ui/Toolbar";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import GameInfoPanel from "./GameInfoPanel";
import GameView from "./GameView";
import AIEditorModal from "./AIEditorModal";
import LogDrawer from "./LogDrawer";
import OpponentSelectionModal from "./OpponentSelectionModal";
import GameOverModal from "./GameOverModal";
import Modal from "../ui/Modal";
import CardFooter from "../ui/CardFooter";

/**
 * Componente principale dell'interfaccia di gioco.
 * Gestisce il layout, la toolbar, l'arena e i modali/drawer.
 */
const GameUI = ({
  gameState,
  controls,
  onEditorOpen,
  isEditorOpen,
  onEditorClose,
  playerCode,
  onCodeChange,
  onUpdate,
  compileError,
  isLogOpen,
  onLogOpen,
  onLogClose,
  isGameOver,
  onGameOver,
  onGameOverClose,
  onRestart,
  onApiDocsOpen,
  scripts,
  activeScript,
  onSelectScript,
  onDeleteScript,
  visualModel,
  blocklyModel,
  onBlocklyModelChange,
  onVisualModelChange,
  onCreateNewScript,
  onSaveOnly,
  opponentScriptId,
  onOpponentModalOpen,
  isOpponentModalOpen,
  onOpponentModalClose,
  onSelectOpponentScript,
  opponentCompileError,
  onClearOpponentCompileError,
  onUpdateSettings,
  isLoading,
  onNavigateBack,
  onClearBlocklyModel,
  user,
  onLogout,
  isLogoutModalOpen,
  onLogoutModalOpen,
  onLogoutModalClose,
  isSettingsModalOpen,
  onSettingsModalOpen,
  onSettingsModalClose,
  onTutorialModalOpen,
  onLLMGuideOpen,
  onVisualEditorGuideOpen,
  onBotSettingsOpen,
}) => {
  const [viewMode, setViewMode] = useState("2D"); // '2D', '3D' o 'FPV'

  // Effetto per aprire il modale di fine partita
  useEffect(() => {
    if (gameState.status === "finished") {
      onGameOver();
    }
  }, [gameState.status, onGameOver]);

  const isMultiplayer = !!opponentScriptId;

  const formatTime = (ms) => {
    if (typeof ms !== "number" || ms < 0) {
      return "00:00";
    }
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <>
      <Toolbar title="Bot War" showThemeSwitcher={true}>
        <div className="flex items-center gap-2 mr-4">
          <span className="text-sm font-medium text-gray-300">Visuale:</span>
          <Button
            onClick={() => setViewMode("2D")}
            variant={viewMode === "2D" ? "primary" : "secondary"}
          >
            2D
          </Button>
          <Button
            onClick={() => setViewMode("3D")}
            variant={viewMode === "3D" ? "primary" : "secondary"}
          >
            3D
          </Button>
        </div>
        {(gameState.status === "running" ||
          gameState.status === "paused" ||
          gameState.status === "finished") && (
          <span className="mr-4 text-lg font-mono tracking-wider text-gray-300">
            {formatTime(gameState.elapsedTime)}
          </span>
        )}
        <Button onClick={controls.start} disabled={gameState.status !== "idle"}>
          Avvia
        </Button>
        <Button
          onClick={() =>
            gameState.status === "running"
              ? controls.pause()
              : controls.resume()
          }
          disabled={
            gameState.status !== "running" && gameState.status !== "paused"
          }
          variant="secondary"
        >
          {gameState.status === "paused" ? "Riprendi" : "Pausa"}
        </Button>
        <Button onClick={controls.reset} variant="secondary">
          Reset
        </Button>
        <Button
          data-tutorial-id="game-settings-button"
          onClick={onSettingsModalOpen}
          variant="ghost"
        >
          Impostazioni
        </Button>
        <Button onClick={onNavigateBack} variant="secondary">
          Torna al Menu
        </Button>
        {user ? (
          <Button onClick={onLogoutModalOpen} variant="ghost">
            Account ({user.email})
          </Button>
        ) : (
          <Button onClick={onNavigateBack} variant="ghost">
            Login
          </Button>
        )}
      </Toolbar>

      {opponentCompileError && (
        <div className="my-4">
          <Alert variant="danger" onClose={onClearOpponentCompileError}>
            {opponentCompileError}
          </Alert>
        </div>
      )}
      {/* Layout principale a due colonne (fisso) con grid di Tailwind */}
      <div className="grid grid-cols-12 gap-4">
        {/* Colonna sinistra: Arena (occupa 3 colonne) */}
        <div className="col-span-3">
          <GameInfoPanel
            gameState={gameState}
            index={0}
            isMultiplayer={isMultiplayer}
          />
        </div>
        <div className="col-span-6">
          <GameView
            gameState={gameState}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
        {/* Colonna destra: Info Bots (occupa 1 colonna) */}
        <div className="col-span-3">
          <GameInfoPanel
            gameState={gameState}
            index={1}
            isMultiplayer={isMultiplayer}
          />
        </div>
      </div>

      <AIEditorModal
        isOpen={isEditorOpen}
        onClose={onEditorClose}
        onUpdate={onUpdate}
        onSaveOnly={onSaveOnly}
        gameStateStatus={gameState.status}
        scripts={scripts}
        activeScript={activeScript}
        code={playerCode}
        onCodeChange={onCodeChange}
        visualModel={visualModel}
        blocklyModel={blocklyModel}
        onBlocklyModelChange={onBlocklyModelChange}
        onVisualModelChange={onVisualModelChange}
        compileError={compileError}
        onSelectScript={onSelectScript}
        onDeleteScript={onDeleteScript}
        onCreateNewScript={onCreateNewScript}
        onUpdateSettings={onUpdateSettings}
        isLoading={isLoading}
        onClearBlocklyModel={onClearBlocklyModel}
        onBotSettingsOpen={onBotSettingsOpen}
        onVisualEditorGuideOpen={onVisualEditorGuideOpen}
      />

      <LogDrawer
        isOpen={isLogOpen}
        onOpen={onLogOpen}
        onClose={onLogClose}
        gameState={gameState}
      />

      <OpponentSelectionModal
        isOpen={isOpponentModalOpen}
        onClose={onOpponentModalClose}
        scripts={scripts}
        selectedOpponentId={opponentScriptId}
        onSelectOpponent={onSelectOpponentScript}
      />

      <GameOverModal
        isOpen={isGameOver}
        gameState={gameState}
        onRestart={onRestart}
        onClose={onGameOverClose}
      />

      {/* Modale per le impostazioni di gioco */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={onSettingsModalClose}
        title="Impostazioni Partita"
      >
        <div className="p-4 flex flex-col gap-4">
          <Button
            data-tutorial-id="open-editor-button"
            onClick={() => {
              onEditorOpen();
              onSettingsModalClose();
            }}
            className="w-full"
            size="large"
          >
            Editor AI
          </Button>
          <Button
            onClick={() => {
              onOpponentModalOpen();
              onSettingsModalClose();
            }}
            className="w-full"
            size="large"
          >
            Seleziona Avversario
          </Button>
          <Button
            onClick={() => {
              onApiDocsOpen();
              onSettingsModalClose();
            }}
            className="w-full"
            size="large"
          >
            API Docs
          </Button>
          <Button
            onClick={() => {
              onTutorialModalOpen();
              onSettingsModalClose();
            }}
            className="w-full"
            size="large"
            variant="secondary"
          >
            Tutorial
          </Button>
          <Button
            onClick={() => {
              onLLMGuideOpen();
              onSettingsModalClose();
            }}
            className="w-full"
            size="large"
          >
            Prompt Pronto per il tuo LLM!
          </Button>
          <Button
            onClick={() => {
              onVisualEditorGuideOpen();
              onSettingsModalClose();
            }}
            className="w-full"
            size="large"
            variant="secondary"
          >
            Guida Editor Visuale
          </Button>
        </div>
        <CardFooter>
          <Button
            onClick={onSettingsModalClose}
            variant="secondary"
            className="w-full"
          >
            Chiudi
          </Button>
        </CardFooter>
      </Modal>

      {/* Modale per il logout */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={onLogoutModalClose}
        title="Account"
      >
        <div className="p-4">
          <p className="text-center mb-4">Sei loggato come {user?.email}</p>
        </div>
        <CardFooter>
          <Button onClick={onLogoutModalClose} variant="secondary">
            Chiudi
          </Button>
          <Button onClick={onLogout} variant="danger">
            Logout
          </Button>
        </CardFooter>
      </Modal>
    </>
  );
};

GameUI.propTypes = {
  gameState: PropTypes.object.isRequired,
  controls: PropTypes.object.isRequired,
  onEditorOpen: PropTypes.func.isRequired,
  isEditorOpen: PropTypes.bool.isRequired,
  onEditorClose: PropTypes.func.isRequired,
  playerCode: PropTypes.string.isRequired,
  onCodeChange: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  compileError: PropTypes.string,
  isLogOpen: PropTypes.bool.isRequired,
  onLogOpen: PropTypes.func.isRequired,
  onLogClose: PropTypes.func.isRequired,
  isGameOver: PropTypes.bool.isRequired,
  onGameOver: PropTypes.func.isRequired,
  onGameOverClose: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
  onApiDocsOpen: PropTypes.func.isRequired,
  scripts: PropTypes.array.isRequired,
  activeScript: PropTypes.object,
  onSelectScript: PropTypes.func.isRequired,
  onDeleteScript: PropTypes.func.isRequired,
  visualModel: PropTypes.object,
  blocklyModel: PropTypes.object,
  onBlocklyModelChange: PropTypes.func,
  onVisualModelChange: PropTypes.func,
  onCreateNewScript: PropTypes.func.isRequired,
  onSaveOnly: PropTypes.func.isRequired,
  opponentScriptId: PropTypes.string,
  onOpponentModalOpen: PropTypes.func.isRequired,
  isOpponentModalOpen: PropTypes.bool.isRequired,
  onOpponentModalClose: PropTypes.func.isRequired,
  onSelectOpponentScript: PropTypes.func.isRequired,
  opponentCompileError: PropTypes.string,
  onClearOpponentCompileError: PropTypes.func.isRequired,
  onUpdateSettings: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  onClearBlocklyModel: PropTypes.func.isRequired,
  /** Funzione per tornare al menu principale. */
  onNavigateBack: PropTypes.func.isRequired,
  /** L'oggetto utente autenticato. */
  user: PropTypes.object,
  /** Funzione per eseguire il logout. */
  onLogout: PropTypes.func.isRequired,
  isLogoutModalOpen: PropTypes.bool.isRequired,
  onLogoutModalOpen: PropTypes.func.isRequired,
  onLogoutModalClose: PropTypes.func.isRequired,
  isSettingsModalOpen: PropTypes.bool.isRequired,
  onSettingsModalOpen: PropTypes.func.isRequired,
  onSettingsModalClose: PropTypes.func.isRequired,
  /** Funzione per aprire la modale del tutorial. */
  onTutorialModalOpen: PropTypes.func.isRequired,
  /** Funzione per aprire la modale della guida LLM. */
  onLLMGuideOpen: PropTypes.func.isRequired,
  onVisualEditorGuideOpen: PropTypes.func,
  onBotSettingsOpen: PropTypes.func,
};

export default GameUI;
