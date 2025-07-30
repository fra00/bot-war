import React, { useState, useCallback, useEffect } from "react";
import GameManager from "./components/game/GameManager";
import AIScriptService from "./services/AIScriptService";
import DefaultAI from "./game/ai/DefaultAI";
import Arena from "./components/game/Arena";
import Button from "./components/ui/Button";
import Drawer from "./components/ui/Drawer"; // Mantenuto per il log
import useDisclosure from "./components/ui/useDisclosure";
import CardHeader from "./components/ui/CardHeader";
import GameInfoPanel from "./components/game/GameInfoPanel";
import CardFooter from "./components/ui/CardFooter";
import AIEditorPanel from "./components/game/AIEditorPanel";
import Toolbar from "./components/ui/Toolbar";
import GameOverModal from "./components/game/GameOverModal";
import { compileAI } from "./game/ai/compiler";
import Modal from "./components/ui/Modal";
import ApiDocsModal from "./components/docs/ApiDocsModal";
import { useAIScripts } from "./hooks/useAIScripts";

// Questo componente UI è stato estratto per risolvere una violazione delle "Rules of Hooks".
// L'hook `useEffect` non può essere chiamato all'interno della render prop di GameManager.
// Spostandolo in un componente figlio dedicato, ci assicuriamo che venga chiamato
// al livello superiore del componente in ogni render.
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
}) => {
  // Effetto per aprire il modale di fine partita
  useEffect(() => {
    if (gameState.status === "finished") {
      onGameOver();
    }
  }, [gameState.status, onGameOver]);

  return (
    <>
      <Toolbar title="Bot War" showThemeSwitcher={true}>
        <Button onClick={controls.start} disabled={gameState.status !== "idle"}>
          Avvia
        </Button>
        <Button onClick={controls.reset} variant="secondary">
          Reset
        </Button>
        <Button onClick={onEditorOpen} variant="ghost">
          Editor AI
        </Button>
        <Button onClick={onApiDocsOpen} variant="ghost">
          API Docs
        </Button>
      </Toolbar>
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

      {/* Dialog a schermo intero per l'editor AI.
          Utilizziamo un div con posizionamento fisso invece del componente Modal
          per avere il controllo completo sulle dimensioni e ottenere un layout a schermo intero. */}
      <Modal
        isOpen={isEditorOpen}
        onClose={onEditorClose}
        title="AI Editor"
        fullscreen={true}
      >
        <div className="flex flex-col" style={{ height: "75vh" }}>
          <AIEditorPanel
            scripts={scripts}
            activeScript={activeScript}
            code={playerCode}
            onCodeChange={onCodeChange}
            compileError={compileError}
            onSelectScript={onSelectScript}
            onDeleteScript={onDeleteScript}
            onCreateNewScript={onCreateNewScript}
          />
          <CardFooter>
            <Button onClick={onSaveOnly} variant="secondary">
              Salva Modifiche
            </Button>
            <Button
              onClick={onUpdate}
              disabled={gameState.status === "running"}
              className="bg-green-600 hover:bg-green-700"
            >
              {activeScript
                ? `Applica "${activeScript.name}" e Riavvia`
                : "Applica e Riavvia"}
            </Button>
            {gameState.status === "running" && (
              <span className="text-sm text-yellow-400 ml-4">
                (La partita in corso verrà terminata per applicare le modifiche)
              </span>
            )}
          </CardFooter>
        </div>
      </Modal>

      {/* Drawer per i log a destra (con maniglia) */}
      <Drawer
        isOpen={isLogOpen}
        onOpen={onLogOpen}
        onClose={onLogClose}
        position="right"
      >
        <CardHeader>Game State Log</CardHeader>
        <div className="p-4 overflow-auto h-full">
          <pre className="bg-gray-800 p-2 rounded text-xs">
            {JSON.stringify(gameState, null, 2)}
          </pre>
        </div>
      </Drawer>

      <GameOverModal
        isOpen={isGameOver}
        winner={gameState.winner}
        onRestart={onRestart}
        onClose={onGameOverClose}
      />
    </>
  );
};

function App() {
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
    onOpen: onGameOver,
    onClose: onGameOverClose,
  } = useDisclosure();
  const {
    isOpen: isApiDocsOpen,
    onOpen: onApiDocsOpen,
    onClose: onApiDocsClose,
  } = useDisclosure();
  const [gameKey, setGameKey] = useState(0);

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
  } = useAIScripts();

  const handleApplyAIChanges = useCallback(() => {
    const { success } = handleUpdateAI();
    if (success) {
      setGameKey((k) => k + 1);
    }
  }, [handleUpdateAI]);

  const handleRestart = useCallback(() => {
    onGameOverClose();
    setGameKey((k) => k + 1);
  }, [onGameOverClose]);

  return (
    <div className="p-4 pt-20">
      <GameManager
        key={gameKey}
        playerAI={playerAI || DefaultAI}
        defaultAI={DefaultAI}
      >
        {({ gameState, controls }) => (
          <GameUI
            gameState={gameState}
            controls={controls}
            onEditorOpen={onEditorOpen}
            isEditorOpen={isEditorOpen}
            onEditorClose={onEditorClose}
            playerCode={playerCode}
            onCodeChange={setPlayerCode}
            onUpdate={handleApplyAIChanges}
            compileError={compileError}
            isLogOpen={isLogOpen}
            onLogOpen={onLogOpen}
            onLogClose={onLogClose}
            isGameOver={isGameOver}
            onGameOver={onGameOver}
            onGameOverClose={onGameOverClose}
            onRestart={handleRestart}
            onApiDocsOpen={onApiDocsOpen}
            scripts={scripts}
            activeScript={activeScript}
            onSelectScript={handleSelectScript}
            onDeleteScript={handleDeleteScript}
            onCreateNewScript={handleCreateNewScript}
            onSaveOnly={handleSaveOnly}
          />
        )}
      </GameManager>
      <ApiDocsModal isOpen={isApiDocsOpen} onClose={onApiDocsClose} />
    </div>
  );
}

export default App;
