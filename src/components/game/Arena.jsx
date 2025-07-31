import React from "react";

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
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Renderizza gli ostacoli */}
        {obstacles.map((obstacle) => (
          <rect
            key={obstacle.id}
            x={obstacle.x}
            y={obstacle.y}
            width={obstacle.width}
            height={obstacle.height}
            fill="#666"
            stroke="#444"
            strokeWidth="2"
          />
        ))}

        {/* Renderizza i robot e il loro raggio radar */}
        {robots.map((robot) => {
          const angleRad = (robot.rotation * Math.PI) / 180;
          const lineEndX = robot.x + 20 * Math.cos(angleRad);
          const lineEndY = robot.y + 20 * Math.sin(angleRad);
          const isPlayer = robot.id === "player";

          return (
            <g key={robot.id}>
              {/* Cerchio del raggio del radar */}
              <circle
                cx={robot.x}
                cy={robot.y}
                r={robot.radarRange}
                fill={isPlayer ? "rgba(97, 218, 251, 0.05)" : "rgba(224, 108, 117, 0.05)"}
                stroke={isPlayer ? "rgba(97, 218, 251, 0.2)" : "rgba(224, 108, 117, 0.2)"}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              {/* Corpo del robot */}
              <circle cx={robot.x} cy={robot.y} r={15} fill={isPlayer ? "#61dafb" : "#e06c75"} stroke="#fff" strokeWidth="2" style={{ filter: "url(#glow)" }} />
              {/* Linea di direzione */}
              <line x1={robot.x} y1={robot.y} x2={lineEndX} y2={lineEndY} stroke="#fff" strokeWidth="3" />
            </g>
          );
        })}

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
          <circle key={p.id} cx={p.x} cy={p.y} r={3} fill="#f9c74f" style={{ filter: "url(#glow)" }} />
        ))}
      </svg>
    </div>
  );
}

export default Arena;