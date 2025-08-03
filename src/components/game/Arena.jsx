import React from "react";
import PropTypes from "prop-types";
import Bot from "./Bot";

/**
 * Componente che renderizza l'arena di gioco, i robot, i proiettili e gli ostacoli.
 * @param {object} props
 * @param {import('../../game/Game.js').GameState} props.gameState - Lo stato attuale del gioco.
 */
function Arena({ gameState }) {
  if (!gameState || !gameState.arena) {
    return null; // Non renderizzare nulla se lo stato non è pronto
  }

  const { width, height, obstacles } = gameState.arena;
  const { robots, projectiles } = gameState;

  return (
    <div
      className="relative bg-gray-800 border-2 border-gray-600"
      style={{ width, height }}
    >
      <svg width={width} height={height} className="absolute top-0 left-0">
        <defs>
          {/* Filtro per un bagliore più intenso */}
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pattern per la griglia di sfondo */}
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(100, 116, 139, 0.2)"
              strokeWidth="1"
            />
          </pattern>

          {/* Gradienti per un look metallico */}
          <radialGradient id="player-gradient">
            <stop offset="0%" stopColor="#a1eafb" />
            <stop offset="100%" stopColor="#61dafb" />
          </radialGradient>
          <radialGradient id="enemy-gradient">
            <stop offset="0%" stopColor="#f08c95" />
            <stop offset="100%" stopColor="#e06c75" />
          </radialGradient>
        </defs>

        {/* Sfondo con griglia */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Renderizza gli ostacoli */}
        {obstacles.map((obstacle) => (
          <rect
            key={obstacle.id}
            x={obstacle.x}
            y={obstacle.y}
            width={obstacle.width}
            height={obstacle.height}
            fill="rgba(100, 116, 139, 0.5)"
            stroke="rgba(150, 166, 189, 0.7)"
            strokeWidth="2"
          />
        ))}

        {/* Renderizza il raggio radar dei robot */}
        {robots.map((robot) => (
          <circle
            key={`${robot.id}-radar`}
            cx={robot.x}
            cy={robot.y}
            r={robot.radarRange}
            fill={
              robot.id === "player"
                ? "rgba(97, 218, 251, 0.05)"
                : "rgba(224, 108, 117, 0.05)"
            }
            stroke={
              robot.id === "player"
                ? "rgba(97, 218, 251, 0.2)"
                : "rgba(224, 108, 117, 0.2)"
            }
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Renderizza i bot */}
        {robots.map((robot) => (
          <Bot
            key={robot.id}
            botData={{ ...robot, angle: robot.rotation }}
            isPlayer={robot.id === "player"}
          />
        ))}

        {/* Renderizza i percorsi dei bot */}
        {robots.map((robot) =>
          robot.path && robot.path.length > 1 ? (
            <polyline
              key={`${robot.id}-path`}
              points={robot.path.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={robot.id === "player" ? "#61dafb" : "#e06c75"}
              strokeWidth="1"
              strokeDasharray="2 4"
              opacity="0.5"
              style={{ pointerEvents: "none" }}
            />
          ) : null
        )}

        {/* Renderizza i marcatori di destinazione */}
        {robots.map((robot) =>
          robot.destination ? (
            <g
              key={`${robot.id}-destination`}
              style={{ pointerEvents: "none" }}
              transform={`translate(${robot.destination.x}, ${robot.destination.y})`}
              opacity="0.7"
            >
              <circle
                r="10"
                stroke={robot.id === "player" ? "#61dafb" : "#e06c75"}
                strokeWidth="1.5"
                strokeDasharray="3 3"
                fill="none"
              />
              <line
                x1="-7"
                y1="0"
                x2="7"
                y2="0"
                stroke={robot.id === "player" ? "#61dafb" : "#e06c75"}
                strokeWidth="1.5"
              />
              <line
                x1="0"
                y1="-7"
                x2="0"
                y2="7"
                stroke={robot.id === "player" ? "#61dafb" : "#e06c75"}
                strokeWidth="1.5"
              />
            </g>
          ) : null
        )}

        {/* Renderizza i proiettili */}
        {projectiles.map((p) => (
          <g key={p.id} style={{ filter: "url(#glow)" }}>
            <circle cx={p.x} cy={p.y} r={4} fill="#ffef99" opacity="0.7" />
            <circle cx={p.x} cy={p.y} r={2} fill="#fff" />
          </g>
        ))}
      </svg>
    </div>
  );
}

Arena.propTypes = {
  gameState: PropTypes.object,
};

export default Arena;
