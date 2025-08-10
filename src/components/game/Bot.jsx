import React, { useState, useEffect, useRef, memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente per il rendering di un singolo bot (hover-tank) con uno stile sci-fi/cyberpunk.
 * @param {{ botData: object, isPlayer: boolean }} props
 */
const Bot = ({ botData, isPlayer, onDeathAnimationEnd }) => {
  const {
    x,
    y,
    angle,
    hullHp,
    maxHullHp,
    armorHp,
    maxArmorHp,
    energy,
    maxEnergy,
  } = botData;

  // --- Stato e Logica per l'effetto danno ---
  const [isTakingDamage, setIsTakingDamage] = useState(false);
  // Usiamo un ref per memorizzare il valore precedente di HP totali e confrontarlo
  const totalHpRef = useRef(hullHp + armorHp);

  // --- Stato e Logica per l'effetto di propulsione ---
  const [isMoving, setIsMoving] = useState(false);
  const positionRef = useRef({ x, y });
  const moveTimeoutRef = useRef(null);

  // --- Stato per l'effetto di esplosione ---
  const [isDestroyed, setIsDestroyed] = useState(false);

  // Effetto per gestire l'inizio dell'animazione di morte
  useEffect(() => {
    if (hullHp <= 0 && !isDestroyed) {
      setIsDestroyed(true);
      // Dopo la durata dell'animazione, chiama il callback per rimuovere il bot
      const animationDuration = 600; // Leggermente più lungo dell'animazione CSS
      setTimeout(() => {
        onDeathAnimationEnd(botData.id);
      }, animationDuration);
    }
  }, [hullHp, isDestroyed, botData.id, onDeathAnimationEnd]);

  // Effetto per resettare lo stato 'isDestroyed' quando il bot viene "rianimato" (es. dopo un reset del gioco)
  useEffect(() => {
    // Se il bot era marcato come distrutto ma ora ha di nuovo vita,
    // significa che il gioco è stato resettato e dobbiamo renderlo di nuovo visibile.
    if (isDestroyed && hullHp > 0) {
      setIsDestroyed(false);
    }
  }, [hullHp, isDestroyed]);

  useEffect(() => {
    const prevPos = positionRef.current;
    // Rileva se il bot si è mosso (con una piccola soglia per evitare sfarfallio)
    if (Math.abs(x - prevPos.x) > 0.1 || Math.abs(y - prevPos.y) > 0.1) {
      if (!isMoving) setIsMoving(true);

      // Resetta il timer ogni volta che il bot si muove
      clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = setTimeout(() => {
        setIsMoving(false);
      }, 100); // Considera il bot fermo se non ci sono aggiornamenti per 100ms
    }
    positionRef.current = { x, y };

    return () => clearTimeout(moveTimeoutRef.current);
  }, [x, y, isMoving]);

  useEffect(() => {
    const currentTotalHp = hullHp + armorHp;
    // Controlla se gli HP totali sono diminuiti rispetto al render precedente
    if (currentTotalHp < totalHpRef.current) {
      setIsTakingDamage(true);
      const timer = setTimeout(() => {
        setIsTakingDamage(false);
      }, 150); // Durata del "flash" in millisecondi

      // Pulisce il timer se il componente viene smontato o se subisce di nuovo danni rapidamente
      return () => clearTimeout(timer);
    }
    // Aggiorna il ref con il nuovo valore di HP per il prossimo confronto
    totalHpRef.current = currentTotalHp;
  }, [hullHp, armorHp]);

  // Se il bot è distrutto, renderizza l'esplosione e nient'altro.
  if (isDestroyed) {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Ondate di esplosione con colori e ritardi diversi */}
        <circle className="bot-explosion-circle" r="30" stroke="#FFFFFF" strokeWidth="3" style={{ animationDelay: '0ms' }} />
        <circle className="bot-explosion-circle" r="60" stroke="#f1c40f" strokeWidth="5" style={{ animationDelay: '100ms' }} />
        <circle
          className="bot-explosion-circle"
          r="90"
          stroke="#e74c3c"
          strokeWidth="2"
          style={{ animationDelay: '150ms' }}
        />
      </g>
    );
  }

  // --- Palette di colori futuristica ---
  const palette = {
    player: {
      base: '#2c3e50', // Blu scuro metallico
      primary: '#4A90E2', // Blu acceso
      accent: '#00FFFF', // Cyan neon
      turret: '#34495e',
    },
    enemy: {
      base: '#4d1a1a', // Rosso scuro metallico
      primary: '#C74343', // Rosso acceso
      accent: '#FF00FF', // Magenta neon
      turret: '#562424',
    },
    common: {
      cannon: '#bdc3c7',
      darkMetal: '#1e272e',
    },
  };

  const colors = isPlayer ? palette.player : palette.enemy;

  // --- Logica per le barre di stato ---
  const healthPercentage = (hullHp / maxHullHp) * 100;
  let healthBarColor;
  if (healthPercentage > 60) {
    healthBarColor = '#2ecc71'; // Verde
  } else if (healthPercentage > 30) {
    healthBarColor = '#f1c40f'; // Giallo
  } else {
    healthBarColor = '#e74c3c'; // Rosso
  }
  const armorBarColor = '#0abde3'; // Blu-ciano per l'armatura/scudo
  const energyBarColor = '#f39c12'; // Arancione per l'energia

  // ID unici per i gradienti e filtri per evitare conflitti se ci sono più bot
  const botId = `bot-${botData.id || Math.random().toString(36).substr(2, 9)}`;
  const bodyGradientId = `grad-body-${botId}`;
  const hoverGlowId = `grad-hover-${botId}`;
  const shadowFilterId = `filter-shadow-${botId}`;
  const blurFilterId = `filter-blur-${botId}`;
  const damageFlashFilterId = `filter-flash-${botId}`;
  const propulsionGradientId = `grad-propulsion-${botId}`;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Definizioni SVG (gradienti, filtri) */}
      <defs>
        {/* Gradiente per il corpo del tank */}
        <linearGradient id={bodyGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: colors.primary, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: colors.base, stopOpacity: 1 }} />
        </linearGradient>

        {/* Gradiente per il bagliore a terra */}
        <radialGradient id={hoverGlowId}>
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.7" />
          <stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
        </radialGradient>

        {/* Gradiente per la scia del propulsore */}
        <linearGradient id={propulsionGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="1" />
          <stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
        </linearGradient>

        {/* Filtro per l'ombra del tank */}
        <filter id={shadowFilterId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
        </filter>

        {/* Filtro per la sfocatura del bagliore */}
        <filter id={blurFilterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>

        {/* Filtro per l'effetto "flash" quando si subisce danno */}
        <filter id={damageFlashFilterId}>
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 1
                    0 1 0 0 1
                    0 0 1 0 1
                    0 0 0 1 0"
          />
        </filter>
      </defs>

      {/* Effetto Hover (bagliore a terra) */}
      <ellipse cx="0" cy="20" rx="25" ry="10" fill={`url(#${hoverGlowId})`} filter={`url(#${blurFilterId})`} />

      {/* Corpo del Bot (ruota con l'angolo) */}
      <g transform={`rotate(${angle})`}>
        <g
          filter={isTakingDamage ? `url(#${shadowFilterId}) url(#${damageFlashFilterId})` : `url(#${shadowFilterId})`}
          style={{ transition: 'filter 0.05s ease-in-out' }}
        >
          {/* Propulsore/Scia (visibile solo quando il bot è in movimento) */}
          {isMoving && (
            <polygon
              className="bot-thruster"
              points="-18,-6 -30,0 -18,6"
              fill={`url(#${propulsionGradientId})`}
              transform="translate(-2, 0)"
            />
          )}

          {/* Spessore/Ombra del corpo */}
          <polygon points="-12,-13 12,-13 20,2 12,17 -12,17 -20,2" fill={palette.common.darkMetal} />

          {/* Corpo principale (esagonale allungato con gradiente) */}
          <polygon points="-12,-15 12,-15 20,0 12,15 -12,15 -20,0" fill={`url(#${bodyGradientId})`} stroke={palette.common.darkMetal} strokeWidth="1" />
          
          {/* Dettagli e Luci sul corpo */}
          <line x1="-15" y1="-10" x2="-10" y2="-10" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="10" y1="10" x2="15" y2="10" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="0" r="1.5" fill={colors.accent} />

          {/* Torretta */}
          <circle cx="0" cy="0" r="9" fill={colors.turret} stroke={palette.common.darkMetal} strokeWidth="1" />
          <circle cx="0" cy="0" r="7" fill={colors.base} />
          
          {/* Cannone */}
          <g>
            <rect x="7" y="-2" width="22" height="4" fill={palette.common.cannon} rx="1" />
            {/* Bagliore alla bocca del cannone (da attivare con JS) */}
            <rect x="29" y="-3" width="4" height="6" fill={colors.accent} rx="2" opacity="0" id={`fire-effect-${botId}`} />
          </g>
        </g>
      </g>

      {/* Pannello Barre di stato */}
      <g transform="translate(-25, -50)">
        {/* Sfondo semi-trasparente per il pannello */}
        <rect x="0" y="0" width="50" height="15" fill="rgba(20, 20, 20, 0.6)" rx="3" />

        {/* Barra della vita (Scafo) */}
        <rect
          x="2"
          y="2"
          width={(46 * hullHp) / (maxHullHp || 1)}
          height="3"
          fill={healthBarColor}
          rx="1.5"
          style={{ transition: 'width 0.2s ease-in-out' }}
        />

        {/* Barra dell'armatura (Scudo) */}
        <rect
          x="2"
          y="6"
          width={(46 * armorHp) / (maxArmorHp || 1)}
          height="3"
          fill={armorBarColor}
          rx="1.5"
          style={{ transition: 'width 0.2s ease-in-out' }}
        />

        {/* Barra dell'energia (Batteria) */}
        <rect
          x="2"
          y="12"
          width={(46 * energy) / (maxEnergy || 1)}
          height="3"
          fill={energyBarColor}
          rx="1.5"
          style={{ transition: 'width 0.2s ease-in-out' }}
        />
      </g>
    </g>
  );
};

Bot.propTypes = {
  botData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    angle: PropTypes.number.isRequired,
    hullHp: PropTypes.number.isRequired,
    maxHullHp: PropTypes.number.isRequired,
    armorHp: PropTypes.number.isRequired,
    maxArmorHp: PropTypes.number.isRequired,
    energy: PropTypes.number.isRequired,
    maxEnergy: PropTypes.number.isRequired,
  }).isRequired,
  isPlayer: PropTypes.bool.isRequired,
  onDeathAnimationEnd: PropTypes.func,
};

Bot.defaultProps = {
  onDeathAnimationEnd: () => {},
};

/**
 * Funzione di confronto personalizzata per React.memo.
 * Impedisce il re-rendering del componente Bot se le sue proprietà visive non sono cambiate.
 * Questo è cruciale per le performance, dato che il componente viene aggiornato ad ogni frame.
 * @param {object} prevProps
 * @param {object} nextProps
 * @returns {boolean}
 */
const areBotsEqual = (prevProps, nextProps) => {
  const p = prevProps.botData;
  const n = nextProps.botData;

  // Confronta solo le proprietà che influenzano la resa grafica.
  // Se nessuna di queste cambia, il componente non verrà ri-renderizzato.
  return p.x === n.x && p.y === n.y && p.angle === n.angle && p.hullHp === n.hullHp && p.armorHp === n.armorHp && p.energy === n.energy && prevProps.isPlayer === nextProps.isPlayer;
};

export default memo(Bot, areBotsEqual);