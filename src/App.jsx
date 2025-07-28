import React, { useState, useCallback, useEffect } from "react";
import GameManager from "./components/game/GameManager";
import DefaultAI from "./game/ai/DefaultAI";
import Arena from "./components/game/Arena";
import initialPlayerCode from "./game/ai/PlayerAI";
import Button from "./components/ui/Button";
import Drawer from "./components/ui/Drawer"; // Mantenuto per il log
import useDisclosure from "./components/ui/useDisclosure";
import CardHeader from "./components/ui/CardHeader";
import GameInfoPanel from "./components/game/GameInfoPanel";
import AIEditorPanel from "./components/game/AIEditorPanel";
import Toolbar from "./components/ui/Toolbar";
import GameOverModal from "./components/game/GameOverModal";
import { compileAI } from "./game/ai/compiler";
import ApiDocsModal from "./components/docs/ApiDocsModal";

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
}) => {
  // Effetto per aprire il modale di fine partita
  useEffect(() => {
    if (gameState.status === "finished") {
      onGameOver();
    }
  }, [gameState.status, onGameOver]);

  return (
    <>
      <Toolbar title="Bot War" showThemeSwitcher={true} className="mb-4">
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
      <div className="grid grid-cols-4 gap-4 mt-4">
        {/* Colonna sinistra: Arena (occupa sempre 3 colonne) */}
        <div className="col-span-3">
          <Arena gameState={gameState} />
        </div>
        {/* Colonna destra: Info Bots (occupa sempre 1 colonna) */}
        <div className="col-span-1">
          <GameInfoPanel gameState={gameState} />
        </div>
      </div>

      {/* Dialog a schermo intero per l'editor AI.
          Utilizziamo un div con posizionamento fisso invece del componente Modal
          per avere il controllo completo sulle dimensioni e ottenere un layout a schermo intero. */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-background-primary p-4">
          <AIEditorPanel
            code={playerCode}
            onCodeChange={onCodeChange}
            onUpdate={onUpdate}
            compileError={compileError}
            isGameRunning={gameState.status === "running"}
            onClose={onEditorClose}
          />
        </div>
      )}

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
  const [playerCode, setPlayerCode] = useState(initialPlayerCode);
  const [playerAI, setPlayerAI] = useState(() => compileAI(initialPlayerCode));
  const [compileError, setCompileError] = useState(null);

  const handleUpdateAI = useCallback(() => {
    try {
      const newAI = compileAI(playerCode);
      setPlayerAI(() => newAI);
      setCompileError(null);
      // Forziamo il re-mount del GameManager per usare la nuova IA.
      // Questo è un pattern pulito per resettare completamente lo stato del gioco.
      setGameKey((k) => k + 1);
    } catch (error) {
      setCompileError(`Error: ${error.message}`);
    }
  }, [playerCode]);

  const handleRestart = useCallback(() => {
    onGameOverClose();
    setGameKey((k) => k + 1);
  }, [onGameOverClose]);

  return (
    <div className="p-4">
      <GameManager key={gameKey} playerAI={playerAI} defaultAI={DefaultAI}>
        {({ gameState, controls }) => (
          <GameUI
            gameState={gameState}
            controls={controls}
            onEditorOpen={onEditorOpen}
            isEditorOpen={isEditorOpen}
            onEditorClose={onEditorClose}
            playerCode={playerCode}
            onCodeChange={setPlayerCode}
            onUpdate={handleUpdateAI}
            compileError={compileError}
            isLogOpen={isLogOpen}
            onLogOpen={onLogOpen}
            onLogClose={onLogClose}
            isGameOver={isGameOver}
            onGameOver={onGameOver}
            onGameOverClose={onGameOverClose}
            onRestart={handleRestart}
            onApiDocsOpen={onApiDocsOpen}
          />
        )}
      </GameManager>
      <ApiDocsModal isOpen={isApiDocsOpen} onClose={onApiDocsClose} />
    </div>
  );
}

export default App;
