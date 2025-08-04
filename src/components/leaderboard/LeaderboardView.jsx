import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import FirestoreService from "../../services/FirestoreService";
import Toolbar from "../ui/Toolbar";
import Button from "../ui/Button";
import Card from "../ui/Card";
import CardHeader from "../ui/CardHeader";
import Spinner from "../ui/Spinner";
import Alert from "../ui/Alert";
import Table from "../ui/Table";

const LeaderboardView = ({ onNavigate }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const bots = await FirestoreService.getLeaderboard(20); // Prende i primi 20
        setLeaderboard(bots);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        if (err.code === "failed-precondition") {
          setError(
            "Errore di configurazione del database: è necessario un indice per la classifica. Controlla la console per i dettagli su come crearlo."
          );
          console.error(
            "L'errore 'failed-precondition' indica che è necessario un indice composito in Firestore per la classifica. Vai alla console di Firebase e crea un indice sulla collezione 'bots' con i campi: 'visibility' (crescente) e 'stats.online.wins' (decrescente)."
          );
        } else {
          setError("Impossibile caricare la classifica. Riprova più tardi.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Spinner size="large" />
          <span className="ml-4">Caricamento classifica...</span>
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    if (leaderboard.length === 0) {
      return (
        <div className="text-center text-gray-400 p-8">
          <p className="text-lg">La classifica è ancora vuota.</p>
          <p className="mt-2">
            Nessun bot pubblico ha ancora vinto una partita multiplayer.
          </p>
        </div>
      );
    }

    // Definisce le colonne per il componente Table, che si aspetta un array di oggetti.
    const columns = [
      { key: "rank", header: "#" },
      { key: "name", header: "Nome Bot" },
      { key: "wins", header: "Vittorie" },
      { key: "losses", header: "Sconfitte" },
      { key: "draws", header: "Pareggi" },
      { key: "winRate", header: "Win Rate (%)" },
    ];

    // Formatta i dati della classifica in un array di oggetti semplici,
    // come richiesto dal componente Table.
    const data = leaderboard.map((bot, index) => {
      const stats = bot.stats?.online || {
        wins: 0,
        losses: 0,
        draws: 0,
        totalMatches: 0,
      };
      const winRate =
        stats.totalMatches > 0
          ? ((stats.wins / stats.totalMatches) * 100).toFixed(1)
          : "0.0";
      return {
        id: bot.id, // Table usa l'id per la chiave della riga
        rank: index + 1,
        name: bot.name,
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
        winRate: winRate,
      };
    });

    return <Table columns={columns} data={data} />;
  };

  return (
    <div className="relative isolate min-h-screen p-4 pt-20 animate-fade-in overflow-hidden">
      {/* Sfondo e overlay */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center animate-ken-burns"
        style={{ backgroundImage: "url('/leader-board.png')" }}
      />
      <div className="absolute inset-0 -z-10 bg-black/60" />

      <Toolbar title="Classifica Multiplayer">
        <Button onClick={() => onNavigate("main-menu")} variant="secondary">
          Torna al Menu
        </Button>
      </Toolbar>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>Top Bots</CardHeader>
          <div className="p-4">{renderContent()}</div>
        </Card>
      </div>
    </div>
  );
};

LeaderboardView.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default LeaderboardView;
