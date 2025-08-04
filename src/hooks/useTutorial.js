import { useState, useCallback, useEffect } from "react";
import { tutorialSteps } from "../config/tutorialSteps";

const TUTORIAL_STORAGE_KEY = "bot-war-tutorial-completed";

/**
 * Hook per gestire la logica del tutorial interattivo.
 *
 * @returns {object} L'API per controllare il tutorial.
 * @property {boolean} isTutorialActive - Indica se il tutorial è attualmente attivo.
 * @property {object|null} currentStep - L'oggetto di configurazione del passo corrente.
 * @property {number} currentStepIndex - L'indice del passo corrente.
 * @property {function} startTutorial - Funzione per forzare l'avvio del tutorial.
 * @property {function} nextStep - Funzione per avanzare al passo successivo.
 * @property {function} skipTutorial - Funzione per saltare e disabilitare il tutorial.
 * @property {function} completeTutorial - Funzione per completare e disabilitare il tutorial.
 */
export const useTutorial = () => {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const completeTutorial = useCallback(() => {
    setIsTutorialActive(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  }, []);

  // Controlla al montaggio se il tutorial deve partire automaticamente.
  useEffect(() => {
    const hasCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!hasCompleted) {
      // Avvia il tutorial per i nuovi utenti dopo un breve ritardo per far caricare la UI.
      const timer = setTimeout(() => setIsTutorialActive(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTutorial = useCallback(() => {
    setCurrentStepIndex(0);
    setIsTutorialActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < tutorialSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      completeTutorial();
    }
  }, [currentStepIndex, completeTutorial]);

  const skipTutorial = useCallback(() => {
    setIsTutorialActive(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  }, []);

  return {
    isTutorialActive,
    currentStep: isTutorialActive ? tutorialSteps[currentStepIndex] : null,
    currentStepIndex,
    startTutorial,
    nextStep,
    skipTutorial,
    completeTutorial,
  };
};