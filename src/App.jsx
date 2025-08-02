import React, { useState, useCallback } from "react";
import { ToastProvider } from "./components/ui/toast/ToastProvider";
import LandingPage from "./components/landing/LandingPage";
import MainMenu from "./components/main-menu/MainMenu";
import EditorAndArena from "./components/editor-arena/EditorAndArena";

function App() {
  const [currentView, setCurrentView] = useState("landing"); // 'landing', 'fading', 'main-menu', 'game'

  const handleStartGame = useCallback(() => {
    setCurrentView("fading");
    setTimeout(() => {
      setCurrentView("main-menu");
    }, 500); // Corrisponde alla durata dell'animazione di fade-out
  }, []);

  const handleNavigate = useCallback((destination) => {
    setCurrentView(destination);
  }, []);

  return (
    <ToastProvider>
      {(currentView === "landing" || currentView === "fading") && (
        <div className={currentView === "fading" ? "animate-fade-out" : ""}>
          <LandingPage onStartGame={handleStartGame} />
        </div>
      )}

      {currentView === "main-menu" && <MainMenu onNavigate={handleNavigate} />}

      {currentView === "game" && (
        <EditorAndArena onNavigateBack={() => handleNavigate("main-menu")} />
      )}
    </ToastProvider>
  );
}

export default App;
