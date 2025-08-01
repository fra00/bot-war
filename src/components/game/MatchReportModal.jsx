import React from "react";
import PropTypes from "prop-types";
import Card from "../ui/Card";
import CardHeader from "../ui/CardHeader";

const StatRow = ({ label, valuePlayer, valueOpponent }) => (
  <tr className="border-b border-gray-700 last:border-b-0">
    <td className="py-2 px-4 font-semibold text-sm text-gray-300">{label}</td>
    <td className="py-2 px-4 text-center font-mono text-lg text-blue-400">
      {valuePlayer}
    </td>
    <td className="py-2 px-4 text-center font-mono text-lg text-red-400">
      {valueOpponent}
    </td>
  </tr>
);

StatRow.propTypes = {
  label: PropTypes.string.isRequired,
  valuePlayer: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  valueOpponent: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
};

const MatchReportModal = ({ stats }) => {
  if (!stats || stats.length < 2) {
    return null;
  }

  const playerStats = stats.find((s) => s.id === "player");
  const opponentStats = stats.find((s) => s.id === "opponent");

  if (!playerStats || !opponentStats) {
    return <p>Dati statistici non disponibili.</p>;
  }

  return (
    <Card className="mt-6 bg-gray-800/50">
      <CardHeader>Report Partita</CardHeader>
      <div className="p-2">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-600">
              <th className="py-2 px-4 text-left text-xs uppercase tracking-wider text-gray-400">
                Metrica
              </th>
              <th className="py-2 px-4 text-center text-xs uppercase tracking-wider text-blue-400">
                {playerStats.name}
              </th>
              <th className="py-2 px-4 text-center text-xs uppercase tracking-wider text-red-400">
                {opponentStats.name}
              </th>
            </tr>
          </thead>
          <tbody>
            <StatRow
              label="Danno Inflitto"
              valuePlayer={playerStats.damageDealt}
              valueOpponent={opponentStats.damageDealt}
            />
            <StatRow
              label="Danno Subito"
              valuePlayer={playerStats.damageTaken}
              valueOpponent={opponentStats.damageTaken}
            />
            <StatRow
              label="Precisione"
              valuePlayer={`${playerStats.accuracy}%`}
              valueOpponent={`${opponentStats.accuracy}%`}
            />
            <StatRow
              label="Colpi Sparati"
              valuePlayer={playerStats.shotsFired}
              valueOpponent={opponentStats.shotsFired}
            />
            <StatRow
              label="Colpi a Segno"
              valuePlayer={playerStats.shotsHit}
              valueOpponent={opponentStats.shotsHit}
            />
            <StatRow
              label="DPS"
              valuePlayer={playerStats.dps}
              valueOpponent={opponentStats.dps}
            />
            <StatRow
              label="Salute Residua"
              valuePlayer={`${playerStats.healthRemaining}%`}
              valueOpponent={`${opponentStats.healthRemaining}%`}
            />
            <StatRow
              label="Punteggio Totale"
              valuePlayer={playerStats.totalScore}
              valueOpponent={opponentStats.totalScore}
            />
          </tbody>
        </table>
      </div>
    </Card>
  );
};

MatchReportModal.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default MatchReportModal;
