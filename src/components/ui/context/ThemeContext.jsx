import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import PropTypes from "prop-types";

// 1. Creazione del Context
const ThemeContext = createContext();

/**
 * Provider che gestisce lo stato del tema (light/dark) per l'intera applicazione.
 * Applica l'attributo `data-theme` all'elemento <html> e persiste la scelta
 * nel localStorage.
 */
export const ThemeProvider = ({ children }) => {
  // Stato per il tema, con fallback a 'dark' e lettura da localStorage
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "dark";
  });

  // Effetto per applicare il tema al DOM e salvarlo in localStorage
  useEffect(() => {
    const root = document.documentElement; // Corrisponde a :root in CSS
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Funzione per cambiare il tema
  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }, []);

  // Funzione per impostare un tema specifico (API)
  const setTheme = useCallback((themeName) => {
    if (themeName === 'light' || themeName === 'dark') {
      setThemeState(themeName);
    }
  }, []);

  const value = { theme, toggleTheme, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// 3. Custom Hook per un facile accesso al context
export const useTheme = () => useContext(ThemeContext);
