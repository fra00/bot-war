import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Toolbar from "../ui/Toolbar";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import Arena from "./Arena";
import GameInfoPanel from "./GameInfoPanel";
import AIEditorModal from "./AIEditorModal";
import LogDrawer from "./LogDrawer";
import OpponentSelectionModal from "./OpponentSelectionModal";
import GameOverModal from "./GameOverModal";

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
  onCreateNewScript,
  onSaveOnly,
  opponentScriptId,
  onOpponentModalOpen,
  isOpponentModalOpen,
  onOpponentModalClose,
  onConfirmOpponentSelection,
  onSelectOpponentScript,
  opponentCompileError,
  onClearOpponentCompileError,
}) => {
  // Effetto per aprire il modale di fine partita
  useEffect(() => {
    if (gameState.status === "finished") {
      onGameOver();
    }
  }, [gameState.status, onGameOver]);

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
        <Button onClick={onEditorOpen} variant="ghost">
          Editor AI
        </Button>
        <Button onClick={onOpponentModalOpen} variant="ghost">
          Seleziona Avversario
        </Button>
        <Button onClick={onApiDocsOpen} variant="ghost">
          API Docs
        </Button>
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
        <div className="col-span-8">
          <Arena gameState={gameState} />
        </div>
        {/* Colonna destra: Info Bots (occupa 1 colonna) */}
        <div className="col-span-4">
          <GameInfoPanel gameState={gameState} />
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
        compileError={compileError}
        onSelectScript={onSelectScript}
        onDeleteScript={onDeleteScript}
        onCreateNewScript={onCreateNewScript}
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
        onConfirm={onConfirmOpponentSelection}
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
  onCreateNewScript: PropTypes.func.isRequired,
  onSaveOnly: PropTypes.func.isRequired,
  opponentScriptId: PropTypes.string,
  onOpponentModalOpen: PropTypes.func.isRequired,
  isOpponentModalOpen: PropTypes.bool.isRequired,
  onOpponentModalClose: PropTypes.func.isRequired,
  onConfirmOpponentSelection: PropTypes.func.isRequired,
  onSelectOpponentScript: PropTypes.func.isRequired,
  opponentCompileError: PropTypes.string,
  onClearOpponentCompileError: PropTypes.func.isRequired,
};

export default GameUI;
