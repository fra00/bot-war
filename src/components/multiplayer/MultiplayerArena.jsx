import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";
import { compileAI } from "../../game/ai/compiler";
import FirestoreService from "../../services/FirestoreService";
import GameManager from "../game/GameManager";
import Toolbar from "../ui/Toolbar";
import Button from "../ui/Button";
import Arena from "../game/Arena";
import GameInfoPanel from "../game/GameInfoPanel";
import GameOverModal from "../game/GameOverModal";
import useDisclosure from "../ui/useDisclosure";
import Spinner from "../ui/Spinner";
import Alert from "../ui/Alert";
import { useToast } from "../ui/toast/ToastProvider";

const MultiplayerArena = ({ matchData, onNavigate }) => {
  const [playerAI, setPlayerAI] = useState(null);
  const [opponentAI, setOpponentAI] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSavingStats, setIsSavingStats] = useState(false);

  const { user } = useAuth();
  const {
    isOpen: isGameOver,
    onOpen: onGameOverOpen,
    onClose: onGameOverClose,
  } = useDisclosure();
  const statsUpdatedRef = useRef(false);
  const { addToast } = useToast();

  // Compila le IA al montaggio del componente
  useEffect(() => {
    if (!matchData || !matchData.playerBot || !matchData.opponentBot) {
      setError("Dati della partita non validi. Ritorno alla lobby...");
      setTimeout(() => onNavigate("multiplayer-lobby"), 3000);
      return;
    }

    try {
      // Il giocatore usa il suo script completo per il debug
      const compiledPlayerAI = compileAI(matchData.playerBot.script);
      // L'avversario usa lo script minificato per proteggere la sua logica
      const compiledOpponentAI = compileAI(
        matchData.opponentBot.multiplayerScript
      );

      setPlayerAI(() => compiledPlayerAI);
      setOpponentAI(() => compiledOpponentAI);
    } catch (e) {
      setError(`Errore nella preparazione della partita: ${e.message}`);
      console.error("Multiplayer AI compilation error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [matchData, onNavigate]);

  const handleAcknowledgeEnd = useCallback(() => {
    onGameOverClose();
    // La navigazione ora è gestita da un effetto dopo il salvataggio
  }, [onGameOverClose]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        <Spinner size="large" />
        <span className="ml-4">Preparazione della partita...</span>
      </div>
    );
  }

  if (error || !playerAI || !opponentAI) {
    return (
      <div className="p-4 pt-20">
        <Alert variant="danger">
          {error || "Impossibile caricare le IA per la partita."}
        </Alert>
      </div>
    );
  }

  return (
    <>
      <Toolbar title="Partita Multiplayer">
        <Button onClick={() => onNavigate("main-menu")} variant="secondary">
          Abbandona Partita
        </Button>
      </Toolbar>
      <div className="relative isolate min-h-screen p-4 pt-20 animate-fade-in">
        {/* Sfondo e overlay */}
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: "url('/multi-background.png')" }}
        />
        <div className="absolute inset-0 -z-10 bg-black/60" />

        <GameManager playerAI={playerAI} defaultAI={opponentAI}>
          {({ gameState, controls }) => {
            // Effetto per avviare la partita automaticamente una volta che tutto è pronto.
            useEffect(() => {
              // Assicurati che lo stato sia 'idle' e che i controlli siano disponibili
              // prima di avviare la partita per evitare avvii multipli.
              if (gameState && gameState.status === "idle" && controls) {
                controls.start();
              }
            }, [gameState, controls]);

            // Effetto per la navigazione automatica dopo il salvataggio delle statistiche
            useEffect(() => {
              // Naviga solo quando la partita è finita, il salvataggio non è in corso e le statistiche sono state aggiornate
              if (gameState?.status === 'finished' && !isSavingStats && statsUpdatedRef.current) {
                // Aggiungiamo un piccolo ritardo per dare tempo all'utente di leggere il toast di successo
                setTimeout(() => onNavigate("multiplayer-lobby"), 1500);
              }
            }, [gameState?.status, isSavingStats, onNavigate]);

            useEffect(() => {
              // Estrai gli ID per stabilizzare le dipendenze dell'effetto
              const playerBotId = matchData?.playerBot?.id;
              const opponentBotId = matchData?.opponentBot?.id;              
              
              const updateStats = async () => {
                if (gameState?.status !== "finished" || !user || statsUpdatedRef.current) {
                  return;
                }
                statsUpdatedRef.current = true; // Segna come avviato
                setIsSavingStats(true);

                try {
                  const winnerId = gameState.winner; // 'player', 'opponent', o null
                  const matchType = "online";

                  let playerResult, opponentResult;
                  if (winnerId === "player") {
                    [playerResult, opponentResult] = ["win", "loss"];
                  } else if (winnerId === "opponent") {
                    [playerResult, opponentResult] = ["loss", "win"];
                  } else {
                    [playerResult, opponentResult] = ["draw", "draw"];
                  }

                  // Esegui entrambi gli aggiornamenti in parallelo
                  await Promise.all([
                    FirestoreService.updateBotStats(playerBotId, playerResult, matchType),
                    FirestoreService.updateBotStats(opponentBotId, opponentResult, matchType)
                  ]);

                  addToast("Statistiche della partita salvate!", "success");

                } catch (err) {
                  console.error("Failed to update match stats:", err);
                  addToast("Errore nel salvataggio delle statistiche.", "danger");
                } finally {
                  setIsSavingStats(false);
                }
              };

              updateStats();

            }, [
              gameState?.status, 
              user, 
              matchData?.playerBot?.id, 
              matchData?.opponentBot?.id, 
              gameState?.winner,
              addToast
            ]);

            // Effetto per aprire la modale di fine partita
            useEffect(() => {
              if (gameState && gameState.status === "finished") onGameOverOpen();
            }, [gameState, onGameOverOpen]);

            if (!gameState) {
              return (
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8">
                    <Arena gameState={null} />
                  </div>
                  <div className="col-span-4">
                    <GameInfoPanel gameState={{}} />
                  </div>
                </div>
              );
            }

            // Arricchisce lo stato del gioco con i nomi dei bot per la UI
            const enrichedGameState = { ...gameState };
            if (enrichedGameState.robots) {
              enrichedGameState.bots = gameState.robots.map((bot) => ({
                ...bot,
                name: bot.id === "player" ? matchData.playerBot.name : matchData.opponentBot.name,
              }));
            }
            if (enrichedGameState.status === "finished" && enrichedGameState.bots) {
              enrichedGameState.winner = enrichedGameState.bots.find((bot) => bot.hullHp > 0) || null;
            }

            return (
              <>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8">
                    <Arena gameState={enrichedGameState} />
                  </div>
                  <div className="col-span-4">
                    <GameInfoPanel gameState={enrichedGameState} />
                  </div>
                </div>
                <GameOverModal
                  isOpen={isGameOver}
                  gameState={enrichedGameState}
                  onRestart={handleAcknowledgeEnd} // Entrambi i pulsanti ora chiudono solo la modale
                  onClose={handleAcknowledgeEnd}
                  isSaving={isSavingStats}
                />
              </>
            );
          }}
        </GameManager>
      </div>
    </>
  );
};

MultiplayerArena.propTypes = {
  matchData: PropTypes.shape({
    playerBot: PropTypes.object.isRequired,
    opponentBot: PropTypes.object.isRequired,
  }).isRequired,
  onNavigate: PropTypes.func.isRequired,
};

export default MultiplayerArena;