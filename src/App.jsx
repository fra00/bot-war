import React, { useState, useCallback } from "react";
import { ToastProvider } from "./components/ui/toast/ToastProvider";
import LandingPage from "./components/landing/LandingPage";
import MainMenu from "./components/main-menu/MainMenu";
import EditorAndArena from "./components/editor-arena/EditorAndArena";
import MultiplayerLobby from "./components/multiplayer/MultiplayerLobby";
import MultiplayerArena from "./components/multiplayer/MultiplayerArena";
import LeaderboardView from "./components/leaderboard/LeaderboardView";
import { AuthProvider } from "./context/AuthContext";
import AuthView from "./components/auth/AuthView";

function App() {
  // Lo stato della vista ora è un oggetto per poter passare dati tra le viste
  const [currentView, setCurrentView] = useState({
    name: "landing",
    data: null,
  });

  const handleStartGame = useCallback(() => {
    setCurrentView({ name: "fading", data: null });
    setTimeout(() => {
      setCurrentView({ name: "main-menu", data: null });
    }, 500); // Corrisponde alla durata dell'animazione di fade-out
  }, []);

  const handleNavigate = useCallback((destination, data = null) => {
    setCurrentView({ name: destination, data });
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        {(currentView.name === "landing" || currentView.name === "fading") && (
          <div
            className={currentView.name === "fading" ? "animate-fade-out" : ""}
          >
            <LandingPage onStartGame={handleStartGame} />
          </div>
        )}

        {currentView.name === "main-menu" && (
          <MainMenu onNavigate={handleNavigate} />
        )}

        {currentView.name === "multiplayer-lobby" && (
          <MultiplayerLobby onNavigate={handleNavigate} />
        )}

        {currentView.name === "multiplayer-match" && (
          <MultiplayerArena
            matchData={currentView.data}
            onNavigate={handleNavigate}
          />
        )}

        {currentView.name === "leaderboard" && (
          <LeaderboardView onNavigate={handleNavigate} />
        )}

        {currentView.name === "auth" && <AuthView onNavigate={handleNavigate} />}

        {currentView.name === "game" && (
          <EditorAndArena onNavigateBack={() => handleNavigate("main-menu")} />
        )}
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
