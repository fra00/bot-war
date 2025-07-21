import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import Game from "../../game/Game";

/**
 * Questo componente è il "cervello" dell'integrazione tra la logica di gioco e React.
 * - Crea e mantiene un'istanza della classe `Game`.
 * - Gestisce il game loop usando `requestAnimationFrame`.
 * - Mette a disposizione lo stato del gioco (`gameState`) e le funzioni di controllo
 *   (`controls`) ai suoi componenti figli tramite il pattern "render prop".
 */
const GameManager = ({ playerAI, defaultAI, children }) => {
  // Usiamo una ref per mantenere l'istanza della classe Game.
  // Questo evita che venga ricreata ad ogni render del componente.
  const gameRef = useRef(null);

  // Lo stato di React che contiene i dati del gioco per il rendering.
  // Quando questo stato cambia, i componenti che lo usano vengono ri-renderizzati.
  const [gameState, setGameState] = useState(null);

  // Ref per l'ID dell'animazione, per poterla cancellare.
  const animationFrameId = useRef(null);

  // Inizializza l'istanza del gioco solo la prima volta.
  if (!gameRef.current) {
    gameRef.current = new Game(playerAI, defaultAI);
  }

  // La funzione del game loop, ottimizzata con useCallback.
  const gameLoop = useCallback(() => {
    // Prosegui solo se il gioco è in esecuzione
    if (gameRef.current.status !== "running") {
      return;
    }

    // 1. Esegui un tick della simulazione
    gameRef.current.tick();
    // 2. Aggiorna lo stato di React con i nuovi dati dal gioco
    //    Creiamo una copia per garantire che React rilevi il cambiamento.
    setGameState({ ...gameRef.current.getGameState() });

    // 3. Richiedi il prossimo frame di animazione
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, []); // La funzione non ha dipendenze, quindi viene creata una sola volta.

  // Questo Effect gestisce l'avvio e l'arresto del game loop.
  useEffect(() => {
    if (gameState?.status === "running") {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }

    // Funzione di cleanup: assicura che il loop non continui a girare in background.
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState?.status, gameLoop]);

  // Inizializza lo stato del gioco al primo render.
  useEffect(() => {
    setGameState(gameRef.current.getGameState());
  }, []);

  // Funzioni di controllo da passare ai componenti figli.
  const controls = {
    start: () => {
      gameRef.current.start();
      setGameState({ ...gameRef.current.getGameState() });
    },
    reset: () => {
      gameRef.current = new Game(playerAI, defaultAI);
      setGameState(gameRef.current.getGameState());
    },
  };

  if (!gameState) {
    return null;
  }

  // Utilizza il pattern "render prop" per passare stato e controlli ai figli.
  return children({ gameState, controls });
};

GameManager.propTypes = {
  /** L'intelligenza artificiale per il robot del giocatore. */
  playerAI: PropTypes.object.isRequired,
  /** L'intelligenza artificiale per il robot avversario. */
  defaultAI: PropTypes.object.isRequired,
  /** Funzione che riceve gameState e controls e restituisce l'UI da renderizzare. */
  children: PropTypes.func.isRequired,
};

export default GameManager;
