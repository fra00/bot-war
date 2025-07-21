import React from "react";
import PropTypes from "prop-types";

const RobotShape = ({ robot }) => {
  const color = robot.id === "player" ? "cyan" : "tomato";
  const cannonColor = robot.id === "player" ? "#00ffff" : "#ff6347";

  return (
    <g
      transform={`translate(${robot.x}, ${robot.y}) rotate(${robot.rotation})`}
    >
      {/* Corpo del robot */}
      <circle
        cx="0"
        cy="0"
        r="15"
        fill={color}
        stroke="black"
        strokeWidth="1"
      />
      {/* Cannone del robot */}
      <rect x="10" y="-2.5" width="15" height="5" fill={cannonColor} />
      {/* "Occhio" o sensore */}
      <circle cx="5" cy="0" r="3" fill="white" />
      <circle cx="5" cy="0" r="1.5" fill="black" />
    </g>
  );
};

RobotShape.propTypes = {
  robot: PropTypes.shape({
    id: PropTypes.string.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    rotation: PropTypes.number.isRequired,
  }).isRequired,
};

const ProjectileShape = ({ projectile }) => (
  <circle cx={projectile.x} cy={projectile.y} r="3" fill="orange" />
);

ProjectileShape.propTypes = {
  projectile: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
};

const ObstacleShape = ({ obstacle }) => (
  <rect
    x={obstacle.x}
    y={obstacle.y}
    width={obstacle.width}
    height={obstacle.height}
    fill="#555"
    stroke="#333"
    strokeWidth="2"
    rx="4" // Angoli arrotondati
  />
);

ObstacleShape.propTypes = {
  obstacle: PropTypes.object.isRequired,
};

const Arena = ({ gameState }) => {
  if (!gameState) {
    return null;
  }

  const { arena, robots, projectiles } = gameState;

  return (
    <div className="relative">
      {/* Arena di gioco SVG */}
      <svg
        width={arena.width}
        height={arena.height}
        style={{
          backgroundColor: "#282c34",
          border: "2px solid #444",
          borderRadius: "8px",
        }}
      >
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#444"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Renderizza gli ostacoli */}
        {arena.obstacles.map((obstacle, index) => (
          <ObstacleShape key={`obs-${index}`} obstacle={obstacle} />
        ))}

        {/* Renderizza i proiettili */}
        {projectiles.map((p) => (
          <ProjectileShape key={p.id} projectile={p} />
        ))}

        {/* Renderizza i robot */}
        {robots.map((robot) => (
          <RobotShape key={robot.id} robot={robot} />
        ))}
      </svg>
    </div>
  );
};

Arena.propTypes = {
  gameState: PropTypes.shape({
    arena: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      obstacles: PropTypes.array,
    }).isRequired,
    robots: PropTypes.array.isRequired,
    projectiles: PropTypes.array.isRequired,
    status: PropTypes.string,
  }).isRequired,
};

export default Arena;
