import React, { useState, useCallback } from "react";
import GameManager from "./components/game/GameManager";
import DefaultAI from "./game/ai/DefaultAI";
import Arena from "./components/game/Arena";
import initialPlayerCode from "./game/ai/PlayerAI";
import Button from "./components/ui/Button";
import Drawer from "./components/ui/Drawer";
import useDisclosure from "./components/ui/useDisclosure";
import CardHeader from "./components/ui/CardHeader";
import GameInfoPanel from "./components/game/GameInfoPanel";
import AIEditorPanel from "./components/game/AIEditorPanel";
import Toolbar from "./components/ui/Toolbar";
import { compileAI } from "./game/ai/compiler";

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

  return (
    <div className="p-4">
      <GameManager key={gameKey} playerAI={playerAI} defaultAI={DefaultAI}>
        {({ gameState, controls }) => (
          <>
            <Toolbar title="Bot War" showThemeSwitcher={true} className="mb-4">
              <Button
                onClick={controls.start}
                disabled={gameState.status !== "idle"}
              >
                Avvia
              </Button>
              <Button onClick={controls.reset} variant="secondary">
                Reset
              </Button>
              <Button onClick={onEditorOpen} variant="ghost">
                Editor AI
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

            {/* Drawer per l'editor AI a sinistra */}
            <Drawer
              isOpen={isEditorOpen}
              onClose={onEditorClose}
              position="left"
            >
              <AIEditorPanel
                code={playerCode}
                onCodeChange={setPlayerCode}
                onUpdate={handleUpdateAI}
                compileError={compileError}
                isGameRunning={gameState.status === "running"}
              />
            </Drawer>

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
          </>
        )}
      </GameManager>
    </div>
  );
}

export default App;
