import React from "react";
import PropTypes from "prop-types";
import Arena from "./Arena";
import Arena3D from "./Arena3D";

/**
 * Componente che gestisce la visualizzazione del gioco,
 * permettendo di passare dalla vista 2D a quella 3D.
 * @param {object} props
 * @param {import('../../game/Game.js').GameState} props.gameState - Lo stato attuale del gioco.
 * @param {string} props.viewMode - La modalità di visualizzazione ('2D', '3D', 'FPV').
 */
function GameView({ gameState, viewMode, onViewModeChange }) {
  // Se gameState non è pronto, renderizza un placeholder per mantenere il layout
  if (!gameState || !gameState.arena) {
    return (
      <div
        className="relative bg-gray-800 border-2 border-gray-600"
        style={{ width: 800, height: 600 }} // Valori di default per il layout
      />
    );
  }

  const { width, height } = gameState.arena;

  return (
    <div className="flex flex-col h-full items-center justify-center">
      {/* Contenitore con dimensioni fisse per l'arena.
          Sia la vista 2D (che imposta la sua dimensione) che quella 3D (che usa h-full)
          si adatteranno a queste dimensioni, garantendo coerenza. */}
      <div className="relative" style={{ width, height }}>
        {viewMode === "2D" ? (
          <Arena gameState={gameState} />
        ) : (
          <Arena3D
            gameState={gameState}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        )}
      </div>
    </div>
  );
}

GameView.propTypes = {
  gameState: PropTypes.object,
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func,
};

export default GameView;
