import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente per il rendering di un singolo bot (hover-tank).
 * @param {{ botData: object, isPlayer: boolean }} props
 */
const Bot = ({ botData, isPlayer }) => {
  const { x, y, angle, hullHp, maxHullHp } = botData;

  const bodyColor = isPlayer ? '#4A90E2' : '#C74343'; // Blu per il giocatore, Rosso per l'avversario
  const turretColor = isPlayer ? '#34495e' : '#562424';
  const cannonColor = '#bdc3c7';
  const trackColor = isPlayer ? '#2c3e50' : '#3d1a1a'; // Colore per i cingoli
  const trackDetailColor = isPlayer ? '#34495e' : '#4d2a2a';
  const healthPercentage = (hullHp / maxHullHp) * 100;
  let healthBarColor;
  if (healthPercentage > 60) {
    healthBarColor = '#2ecc71'; // Verde
  } else if (healthPercentage > 30) {
    healthBarColor = '#f1c40f'; // Giallo
  } else {
    healthBarColor = '#e74c3c'; // Rosso
  }

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Barra della vita */}
      <g transform="translate(-20, -30)">
        <rect x="0" y="0" width="40" height="5" fill="#333" rx="2" />
        <rect
          x="0"
          y="0"
          width={(40 * hullHp) / maxHullHp}
          height="5"
          fill={healthBarColor}
          rx="2"
          style={{ transition: 'width 0.2s ease-in-out' }}
        />
      </g>

      {/* Corpo del Bot (ruota con l'angolo) */}
      <g transform={`rotate(${angle})`}>
        {/* Cingoli (disegnati per primi, quindi sotto il corpo) */}
        <g className="left-track">
          <rect x="-24" y="-17" width="12" height="34" rx="4" fill={trackColor} />
          <line x1="-22" y1="-13" x2="-14" y2="-13" stroke={trackDetailColor} strokeWidth="2" />
          <line x1="-22" y1="13" x2="-14" y2="13" stroke={trackDetailColor} strokeWidth="2" />
        </g>
        <g className="right-track">
          <rect x="12" y="-17" width="12" height="34" rx="4" fill={trackColor} />
          <line x1="14" y1="-13" x2="22" y2="-13" stroke={trackDetailColor} strokeWidth="2" />
          <line x1="14" y1="13" x2="22" y2="13" stroke={trackDetailColor} strokeWidth="2" />
        </g>

        {/* Corpo principale (esagonale allungato) */}
        <polygon points="-12,-15 12,-15 20,0 12,15 -12,15 -20,0" fill={bodyColor} stroke="#1e272e" strokeWidth="1.5" />
        
        {/* Torretta */}
        <circle cx="0" cy="0" r="9" fill={turretColor} />
        
        {/* Cannone */}
        <rect x="8" y="-2" width="20" height="4" fill={cannonColor} rx="1" />
      </g>
    </g>
  );
};

Bot.propTypes = {
  botData: PropTypes.object.isRequired,
  isPlayer: PropTypes.bool.isRequired,
};

export default Bot;