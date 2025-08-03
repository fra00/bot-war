import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";
import FirestoreService from "../../services/FirestoreService";
import Button from "../ui/Button";
import Card from "../ui/Card";
import CardHeader from "../ui/CardHeader";
import Spinner from "../ui/Spinner";
import Toolbar from "../ui/Toolbar";
import * as components from "../../game/components.js";
import { useToast } from "../ui/toast/ToastProvider";

const MultiplayerLobby = ({ onNavigate }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [bots, setBots] = useState([]);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFindingMatch, setIsFindingMatch] = useState(false);

  useEffect(() => {
    if (!user) {
      // Salvaguardia: se l'utente non è loggato, torna al menu
      onNavigate("main-menu");
      return;
    }

    const fetchEligibleBots = async () => {
      setIsLoading(true);
      try {
        const userBots = await FirestoreService.getUserBots(user.uid);
        const eligibleBots = userBots.filter(
          (bot) => bot.isMultiplayerEligible
        );
        setBots(eligibleBots);
      } catch (error) {
        console.error("Error fetching multiplayer bots:", error);
        addToast("Impossibile caricare i bot per il multiplayer.", "danger");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEligibleBots();
  }, [user, onNavigate, addToast]);

  const handleFindMatch = async () => {
    if (!selectedBotId) {
      addToast("Seleziona un bot prima di cercare una partita.", "warning");
      return;
    }
    setIsFindingMatch(true);
    addToast("Ricerca di un avversario...", "info");

    try {
      const playerBot = bots.find((b) => b.id === selectedBotId);
      const opponentBot = await FirestoreService.findOpponent(playerBot);

      if (opponentBot) {
        addToast(
          `Avversario trovato: "${opponentBot.name}"! Preparazione della partita...`,
          "success"
        );
        // Naviga alla vista della partita, passando i dati dei due bot.
        onNavigate("multiplayer-match", { playerBot, opponentBot });
      } else {
        addToast("Nessun avversario adatto trovato. Riprova più tardi.", "warning");
      }
    } catch (error) {
      console.error("Errore durante il matchmaking:", error);
      // Controlla l'errore specifico di Firestore per un indice mancante
      if (error.code === 'failed-precondition') {
        addToast(
          "Errore di configurazione del database: indice mancante. Controlla la console per i dettagli.",
          "danger",
          { duration: 10000 } // Messaggio più lungo per dare tempo di leggerlo
        );
        // Logga un messaggio più utile per lo sviluppatore
        console.error("L'errore 'failed-precondition' indica che è necessario un indice composito in Firestore. Crea l'indice come suggerito nel messaggio di errore originale nella console del browser per risolvere il problema.");
      } else {
        addToast("Si è verificato un errore durante la ricerca della partita.", "danger");
      }
    } finally {
      setIsFindingMatch(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Spinner size="large" />
          <span className="ml-4">Caricamento dei tuoi bot...</span>
        </div>
      );
    }

    if (bots.length === 0) {
      return (
        <div className="text-center text-gray-400 p-8">
          <p className="text-lg">
            Nessun bot eleggibile per il multiplayer trovato.
          </p>
          <p className="mt-2">
            Vai nell'Editor AI, apri le impostazioni di un bot e abilitalo per
            il multiplayer.
          </p>
        </div>
      );
    }

    return (
      <ul className="space-y-3 p-4">
        {bots.map((bot) => (
          <li key={bot.id}>
            <Card
              className={`cursor-pointer transition-all duration-200 ${
                selectedBotId === bot.id
                  ? "border-blue-500 ring-2 ring-blue-500"
                  : "border-gray-700 hover:border-gray-500"
              }`}
              onClick={() => setSelectedBotId(bot.id)}
            >
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{bot.name}</h3>
                  <p className="text-sm text-gray-400">
                    {bot.description || "Nessuna descrizione"}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>
                    Vittorie Online:{" "}
                    <span className="font-semibold text-green-400">
                      {bot.stats?.online?.wins || 0}
                    </span>
                  </p>
                  <p>
                    Sconfitte Online:{" "}
                    <span className="font-semibold text-red-400">
                      {bot.stats?.online?.losses || 0}
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <Toolbar title="Lobby Multiplayer">
        <Button onClick={() => onNavigate("main-menu")} variant="secondary">
          Torna al Menu
        </Button>
      </Toolbar>
      <div className="p-4 pt-20 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>Seleziona il tuo Campione</CardHeader>
            {renderContent()}
          </Card>
          <div className="mt-6 text-center">
            <Button
              size="large"
              variant="primary"
              onClick={handleFindMatch}
              disabled={!selectedBotId || isLoading || isFindingMatch}
            >
              {isFindingMatch ? "Ricerca in corso..." : "Trova Partita"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

MultiplayerLobby.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default MultiplayerLobby;
