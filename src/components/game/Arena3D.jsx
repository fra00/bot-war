import React, {
  Fragment,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
import Button from "../ui/Button";

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
 * Componente che gestisce la logica della camera,
 * passando dalla modalità Orbitale a quella in Prima Persona (FPV).
 * @param {object} props
 * @param {string} props.viewMode - La modalità di visualizzazione ('3D' o 'FPV').
 * @param {object} props.playerBot - I dati del bot del giocatore.
 * @param {function} props.to3D - Funzione per convertire coordinate.
 */
function CameraRig({ viewMode, playerBot, to3D }) {
  const { camera } = useThree();
  // Usiamo un ref per il target interpolato, per rendere la rotazione più fluida
  const interpolatedTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (viewMode !== "FPV" || !playerBot || playerBot.hullHp <= 0) {
      return;
    }

    // Fattore di interpolazione per rendere il movimento più "morbido".
    const lerpFactor = delta * 10;

    // Posizione della camera: leggermente sopra e all'interno del centro del bot
    const cameraPosition = new THREE.Vector3(
      ...to3D(playerBot.x, playerBot.y, 8)
    );

    // Calcola la direzione frontale del bot basata sulla sua rotazione
    const angleRad = -playerBot.rotation * (Math.PI / 180);
    // CORREZIONE: L'asse Z in Three.js è opposto a quello che ci si aspetterebbe
    // dalla matematica standard (destrorso, Y in alto).
    // Per una rotazione attorno a Y, la nuova Z è -sin(angolo).
    const direction = new THREE.Vector3(
      Math.cos(angleRad),
      0,
      -Math.sin(angleRad)
    );

    // Punto di mira: un punto di fronte al bot nella direzione del cannone
    const lookAtPosition = new THREE.Vector3()
      .copy(cameraPosition)
      .add(direction.multiplyScalar(100)); // Guarda 100 unità in avanti

    // Interpola dolcemente la posizione della camera per evitare scatti
    camera.position.lerp(cameraPosition, lerpFactor);

    // Interpola dolcemente anche il punto di mira per una rotazione fluida
    interpolatedTarget.current.lerp(lookAtPosition, lerpFactor);

    // Punta la camera verso il target interpolato
    camera.lookAt(interpolatedTarget.current);
  });

  // Imposta la posizione iniziale della camera e del target quando si entra in FPV
  useEffect(() => {
    if (viewMode === "FPV" && playerBot) {
      const cameraPosition = new THREE.Vector3(
        ...to3D(playerBot.x, playerBot.y, 8)
      );
      camera.position.copy(cameraPosition);

      // Imposta anche il target iniziale per evitare uno scatto al primo frame
      const angleRad = -playerBot.rotation * (Math.PI / 180);
      const direction = new THREE.Vector3(
        Math.cos(angleRad),
        0,
        -Math.sin(angleRad)
      );
      const lookAtPosition = new THREE.Vector3()
        .copy(cameraPosition)
        .add(direction.multiplyScalar(100));
      interpolatedTarget.current.copy(lookAtPosition);
      camera.lookAt(interpolatedTarget.current);
    }
  }, [viewMode, playerBot, camera, to3D]);

  return null; // Questo componente non renderizza nulla
}

CameraRig.propTypes = {
  viewMode: PropTypes.string.isRequired,
  playerBot: PropTypes.object,
  to3D: PropTypes.func.isRequired,
};

/**
 * Componente helper che gestisce le posizioni della camera non-FPV (Prospettiva, Dall'alto).
 * Viene renderizzato all'interno della Canvas per avere accesso alla camera e ai controlli.
 */
function CameraControlsHelper({
  viewMode,
  cameraStyle,
  initialCameraPosition,
  height,
}) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (viewMode === "3D" && controls) {
      if (cameraStyle === "perspective") {
        camera.position.set(...initialCameraPosition);
        controls.target.set(0, 0, 0);
      } else if (cameraStyle === "top-down") {
        // Posiziona la camera direttamente sopra, con un piccolo offset per evitare clipping
        camera.position.set(0, height * 1.5, 0.1);
        controls.target.set(0, 0, 0);
      }
      // Aggiorna i controlli per applicare le modifiche
      controls.update();
    }
  }, [viewMode, cameraStyle, initialCameraPosition, height, camera, controls]);

  return null;
}

CameraControlsHelper.propTypes = {
  viewMode: PropTypes.string.isRequired,
  cameraStyle: PropTypes.string.isRequired,
  initialCameraPosition: PropTypes.array.isRequired,
  height: PropTypes.number.isRequired,
};

/**
 * Componente che renderizza l'arena di gioco in 3D.
 * @param {object} props
 * @param {import('../../game/Game.js').GameState} props.gameState - Lo stato attuale del gioco.
 * @param {string} props.viewMode - La modalità di visualizzazione ('3D' o 'FPV').
 * @param {function} props.onViewModeChange - Funzione per cambiare la modalità di visualizzazione.
 */
function Arena3D({ gameState, viewMode, onViewModeChange }) {
  const { width, height, obstacles } = gameState.arena;
  const { robots, projectiles } = gameState;
  const [cameraStyle, setCameraStyle] = useState("perspective"); // 'perspective' | 'top-down'

  // Trova il bot del giocatore
  const playerBot = robots.find((r) => r.id === "player");

  // Imposta una posizione iniziale della camera per la vista 3D orbitale
  const initialCameraPosition = [0, height * 0.75, height];

  // Funzione per convertire le coordinate 2D del gioco in posizioni 3D
  // L'origine 2D è in alto a sinistra, quella 3D è al centro.
  // L'asse Y del gioco diventa l'asse Z in 3D.
  const to3D = (x, y, y_offset = 0) => [
    x - width / 2,
    y_offset,
    y - height / 2,
  ];
  const handleToggleFPV = () => {
    if (viewMode === "FPV") {
      onViewModeChange("3D");
      // Quando si esce da FPV, si torna sempre alla vista prospettica
      setCameraStyle("perspective");
    } else {
      onViewModeChange("FPV");
    }
  };

  // Non mostrare il pulsante FPV se il giocatore non c'è o è sconfitto
  const canEnterFPV = playerBot && playerBot.hullHp > 0;

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <Canvas
        shadows // Abilita le ombre nella scena
        camera={{ position: initialCameraPosition, fov: 60 }}
      >
        {/* Controlli per la camera (zoom, pan, rotate con il mouse) */}
        {/* Vengono disabilitati in modalità FPV per non entrare in conflitto con la nostra logica */}
        <OrbitControls enabled={viewMode !== "FPV"} />

        {/* Componente per la gestione della logica della camera */}
        <CameraRig viewMode={viewMode} playerBot={playerBot} to3D={to3D} />
        <CameraControlsHelper
          viewMode={viewMode}
          cameraStyle={cameraStyle}
          initialCameraPosition={initialCameraPosition}
          height={height}
        />

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
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        {/* Controlli di vista 3D (visibili solo in modalità 3D) */}
        {viewMode === "3D" && (
          <>
            <Button
              onClick={() => setCameraStyle("top-down")}
              variant={cameraStyle === "top-down" ? "primary" : "secondary"}
              title="Visuale dall'alto"
              className="p-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </Button>
            <Button
              onClick={() => setCameraStyle("perspective")}
              variant={cameraStyle === "perspective" ? "primary" : "secondary"}
              title="Visuale in prospettiva"
              className="p-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12.792V6.208a2.25 2.25 0 00-2.25-2.25h-5.582a2.25 2.25 0 01-1.591-.659l-.622-.621a2.25 2.25 0 00-3.182 0l-.622.621A2.25 2.25 0 015.832 3.958H3.25A2.25 2.25 0 001 6.208v6.584A2.25 2.25 0 003.25 21h17.5A2.25 2.25 0 0023 18.75V15M13 12h4m-4 4h4m-4-8h4m-4-4h4"
                />
              </svg>
            </Button>
          </>
        )}

        {/* Pulsante FPV (visibile se il giocatore è attivo) */}
        {canEnterFPV && (
          <div className="bg-gray-800/50 rounded-md">
            <Button
              onClick={handleToggleFPV}
              variant={viewMode === "FPV" ? "primary" : "secondary"}
              title={
                viewMode === "FPV"
                  ? "Passa a visuale 3D"
                  : "Passa a visuale in prima persona (FPV)"
              }
              className="p-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

Arena3D.propTypes = {
  gameState: PropTypes.object,
  viewMode: PropTypes.string.isRequired,
  onViewModeChange: PropTypes.func.isRequired,
};

export default Arena3D;
