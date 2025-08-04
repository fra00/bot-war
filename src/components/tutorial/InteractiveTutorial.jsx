import React, { useState, useLayoutEffect, useRef } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import Button from "../ui/Button";
import "./InteractiveTutorial.css";

/**
 * Calcola la posizione del popover, assicurandosi che non esca dai bordi della finestra.
 * @param {DOMRect} highlightRect - Rettangolo dell'elemento evidenziato.
 * @param {DOMRect} popoverRect - Rettangolo del popover stesso.
 * @param {string} placement - Posizione preferita ('top', 'bottom', 'left', 'right', 'center').
 * @returns {object} Stili CSS per il posizionamento finale.
 */
const getPopoverPosition = (highlightRect, popoverRect, placement) => {
  if (!highlightRect || !popoverRect || !popoverRect.width)
    return { opacity: 0 }; // Nascondi se non ancora misurato

  const popoverOffset = 16; // Spazio tra l'highlight e il popover
  const viewportPadding = 10; // Spazio minimo dai bordi della finestra

  let top, left;

  switch (placement) {
    case "center":
      top = window.innerHeight / 2 - popoverRect.height / 2;
      left = window.innerWidth / 2 - popoverRect.width / 2;
      break;
    case "top":
      top = highlightRect.top - popoverRect.height - popoverOffset;
      left = highlightRect.left + highlightRect.width / 2 - popoverRect.width / 2;
      break;
    case "bottom":
      top = highlightRect.bottom + popoverOffset;
      left = highlightRect.left + highlightRect.width / 2 - popoverRect.width / 2;
      break;
    case "left":
      top =
        highlightRect.top + highlightRect.height / 2 - popoverRect.height / 2;
      left = highlightRect.left - popoverRect.width - popoverOffset;
      break;
    case "right":
      top =
        highlightRect.top + highlightRect.height / 2 - popoverRect.height / 2;
      left = highlightRect.right + popoverOffset;
      break;
    default:
      // fallback to bottom
      top = highlightRect.bottom + popoverOffset;
      left = highlightRect.left + highlightRect.width / 2 - popoverRect.width / 2;
  }

  // Correzione per non uscire dai bordi
  // Orizzontale
  if (left < viewportPadding) {
    left = viewportPadding;
  } else if (left + popoverRect.width > window.innerWidth - viewportPadding) {
    left = window.innerWidth - popoverRect.width - viewportPadding;
  }

  // Verticale
  if (top < viewportPadding) {
    top = viewportPadding;
  } else if (top + popoverRect.height > window.innerHeight - viewportPadding) {
    top = window.innerHeight - popoverRect.height - viewportPadding;
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
  };
};

const InteractiveTutorial = ({
  step,
  onNext,
  onSkip,
  stepIndex,
  totalSteps,
}) => {
  const [highlightRect, setHighlightRect] = useState(null);
  const [popoverRect, setPopoverRect] = useState(null);
  const popoverRef = useRef(null);

  // useLayoutEffect per evitare "flickering" durante il calcolo della posizione
  useLayoutEffect(() => {
    if (step?.elementSelector) {
      const element = document.querySelector(step.elementSelector);
      if (element) {
        setHighlightRect(element.getBoundingClientRect());
      } else {
        console.warn(
          `Tutorial: Elemento non trovato per il selettore "${step.elementSelector}"`
        );
        setHighlightRect(null);
      }
    } else {
      // For steps without a selector, center a 0-size rect
      setHighlightRect({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        width: 0,
        height: 0,
        right: window.innerWidth / 2,
        bottom: window.innerHeight / 2,
      });
    }
  }, [step]);

  // Misura la dimensione del popover quando il suo contenuto cambia
  useLayoutEffect(() => {
    if (popoverRef.current) {
      setPopoverRect(popoverRef.current.getBoundingClientRect());
    }
  }, [step]);

  if (!step || !highlightRect) {
    return null;
  }

  const popoverStyle = getPopoverPosition(highlightRect, popoverRect, step.placement);

  return createPortal(
    <div className="tutorial-overlay">
      <div
        className="tutorial-highlight"
        style={{
          top: `${highlightRect.top}px`,
          left: `${highlightRect.left}px`,
          width: `${highlightRect.width}px`,
          height: `${highlightRect.height}px`,
        }}
      />
      <div ref={popoverRef} className="tutorial-popover" style={popoverStyle}>
        <h3>{step.title}</h3>
        <p>{step.content}</p>
        <div className="tutorial-popover-footer">
          <Button onClick={onSkip} variant="ghost" size="small">
            Salta Tutorial
          </Button>
          <span className="tutorial-step-counter">
            {stepIndex + 1} / {totalSteps}
          </span>
          {!step.waitForUserAction && (
            <Button onClick={onNext} variant="primary" size="small">
              Avanti
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

InteractiveTutorial.propTypes = {
  step: PropTypes.shape({
    elementSelector: PropTypes.string,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    placement: PropTypes.oneOf(["top", "bottom", "left", "right", "center"]),
    waitForUserAction: PropTypes.bool,
  }),
  onNext: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  stepIndex: PropTypes.number.isRequired,
  totalSteps: PropTypes.number.isRequired,
};

export default InteractiveTutorial;
