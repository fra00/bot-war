import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Box,
  Cylinder,
  Sphere,
  Ring,
  Line,
  Circle,
} from "@react-three/drei";
import * as THREE from "three";

/**
 * Un semplice componente per rappresentare un bot in 3D.
 * @param {object} props
 * @param {object} props.botData - I dati del bot dallo stato del gioco.
 * @param {boolean} props.isPlayer - Se il bot è il giocatore.
 */
function Bot3D({ botData, isPlayer }) {
  const botColor = isPlayer ? "#4A90E2" : "#C74343";
  const cannonColor = "#bdc3c7";

  // La rotazione del bot è attorno all'asse Y.
  // L'angolo in gameState è in gradi, lo convertiamo in radianti.
  // Il segno negativo è per allineare la rotazione con la vista 2D.
  const rotationY = -botData.rotation * (Math.PI / 180);

  return (
    <group rotation={[0, rotationY, 0]}>
      {/* Corpo del bot (Cilindro) */}
      <Cylinder args={[15, 15, 10, 32]} castShadow>
        <meshStandardMaterial color={botColor} />
      </Cylinder>
      {/* Cannone del bot (Box) */}
      <Box args={[30, 4, 4]} position={[15, 0, 0]} castShadow>
        <meshStandardMaterial color={cannonColor} />
      </Box>
    </group>
  );
}

Bot3D.propTypes = {
  botData: PropTypes.object.isRequired,
  isPlayer: PropTypes.bool.isRequired,
};

/**
 * Componente per visualizzare un'esplosione quando un bot viene sconfitto.
 */
function Explosion3D() {
  return (
    <group>
      <Sphere args={[15, 32, 32]}>
        <meshStandardMaterial
          color="#ffc40f" // Giallo/Arancio
          emissive="#ffc40f"
          emissiveIntensity={5}
          transparent
          opacity={0.7}
        />
      </Sphere>
      <Sphere args={[25, 32, 32]}>
        <meshStandardMaterial
          color="#e74c3c" // Rosso
          emissive="#e74c3c"
          emissiveIntensity={3}
          transparent
          opacity={0.4}
        />
      </Sphere>
    </group>
  );
}

/**
 * Componente che renderizza l'arena di gioco in 3D.
 * @param {object} props
 * @param {import('../../game/Game.js').GameState} props.gameState - Lo stato attuale del gioco.
 */
function Arena3D({ gameState }) {
  const { width, height, obstacles } = gameState.arena;
  const { robots, projectiles } = gameState;

  // Imposta una posizione iniziale della camera per avere una buona visuale
  const cameraPosition = [0, height * 0.75, height];

  // Funzione per convertire le coordinate 2D del gioco in posizioni 3D
  // L'origine 2D è in alto a sinistra, quella 3D è al centro.
  // L'asse Y del gioco diventa l'asse Z in 3D.
  const to3D = (x, y, y_offset = 0) => [
    x - width / 2,
    y_offset,
    y - height / 2,
  ];

  return (
    <div className="w-full h-full bg-gray-900">
      <Canvas
        shadows // Abilita le ombre nella scena
        camera={{ position: cameraPosition, fov: 60 }}
      >
        {/* Controlli per la camera (zoom, pan, rotate con il mouse) */}
        <OrbitControls />

        {/* Luci */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[100, 200, 150]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-width}
          shadow-camera-right={width}
          shadow-camera-top={height}
          shadow-camera-bottom={-height}
        />

        {/* Pavimento dell'arena */}
        <mesh
          // Il pavimento è nel piano XZ, quindi lo ruotiamo
          rotation={[-Math.PI / 2, 0, 0]}
          // Lo posizioniamo leggermente sotto l'origine per evitare z-fighting con la griglia
          position={[0, -0.5, 0]}
          receiveShadow // Il pavimento riceve le ombre
        >
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial color="#334155" />
        </mesh>

        {/* Griglia sul pavimento per dare un senso di scala */}
        <Grid
          args={[width, width / 40, "#64748b", "#64748b"]}
          position={[0, -0.49, 0]}
        />

        {/* Renderizza gli ostacoli */}
        {obstacles.map((obstacle) => {
          // La posizione di un oggetto 3D è il suo centro.
          const pos = to3D(
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height / 2,
            obstacle.height / 2 - 0.5
          );
          return (
            <Box
              key={obstacle.id}
              args={[obstacle.width, obstacle.height, obstacle.height]}
              position={pos}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color="#475569" />
            </Box>
          );
        })}

        {/* Renderizza i bot e gli elementi visivi associati */}
        {robots.map((robot) => {
          const isPlayer = robot.id === "player";
          const botColor = isPlayer ? "#61dafb" : "#e06c75";

          // Se il bot è sconfitto, mostra un'esplosione invece del modello.
          // Questo previene anche errori di rendering che bloccavano la UI.
          if (robot.hullHp <= 0) {
            return (
              <group key={robot.id} position={to3D(robot.x, robot.y, 10)}>
                <Explosion3D />
              </group>
            );
          }

          return (
            <Fragment key={robot.id}>
              {/* Modello 3D del Bot */}
              <group position={to3D(robot.x, robot.y, 5)}>
                <Bot3D botData={robot} isPlayer={isPlayer} />
              </group>

              {/* Raggio Radar */}
              <group position={to3D(robot.x, robot.y, 0)}>
                <Circle
                  args={[robot.radarRange, 64]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <meshStandardMaterial
                    color={botColor}
                    transparent
                    opacity={0.05}
                    side={THREE.DoubleSide}
                  />
                </Circle>
                <Ring
                  args={[robot.radarRange - 1, robot.radarRange, 64]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <meshStandardMaterial
                    color={botColor}
                    transparent
                    opacity={0.2}
                    side={THREE.DoubleSide}
                  />
                </Ring>
              </group>

              {/* Percorso Pianificato */}
              {robot.path && robot.path.length > 1 && (
                <Line
                  points={robot.path.map((p) => to3D(p.x, p.y, 0.2))}
                  color={botColor}
                  lineWidth={1.5}
                  dashed
                  dashSize={2}
                  gapSize={4}
                  transparent
                  opacity={0.5}
                />
              )}

              {/* Marcatore di Destinazione */}
              {robot.destination && (
                <group
                  position={to3D(robot.destination.x, robot.destination.y, 0.1)}
                >
                  <Ring args={[9, 10, 32]} rotation={[-Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial
                      color={botColor}
                      emissive={botColor}
                      emissiveIntensity={0.5}
                      transparent
                      opacity={0.7}
                    />
                  </Ring>
                  <Box args={[14, 0.5, 1.5]}>
                    <meshStandardMaterial
                      color={botColor}
                      transparent
                      opacity={0.7}
                    />
                  </Box>
                  <Box args={[1.5, 0.5, 14]}>
                    <meshStandardMaterial
                      color={botColor}
                      transparent
                      opacity={0.7}
                    />
                  </Box>
                </group>
              )}
            </Fragment>
          );
        })}

        {/* Renderizza i proiettili */}
        {projectiles.map((p) => (
          <Sphere key={p.id} args={[4, 16, 16]} position={to3D(p.x, p.y, 5)}>
            <meshStandardMaterial
              color="#ffef99"
              emissive="#ffef99"
              emissiveIntensity={2}
            />
          </Sphere>
        ))}
      </Canvas>
    </div>
  );
}

Arena3D.propTypes = {
  gameState: PropTypes.object,
};

export default Arena3D;
