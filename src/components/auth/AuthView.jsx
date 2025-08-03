import React, { useState } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext";
import AuthForm from "./AuthForm";

const AuthView = ({ onNavigate }) => {
  const { login, register } = useAuth();
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const handleAuthAction = async (authFn, email, password) => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await authFn(email, password);
      onNavigate("main-menu"); // Torna al menu in caso di successo
    } catch (error) {
      // Semplifica il messaggio di errore di Firebase
      const friendlyError = error.message.replace("Firebase: ", "");
      setAuthError(friendlyError);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="p-4 pt-20 animate-fade-in">
      <AuthForm
        onLogin={(email, password) => handleAuthAction(login, email, password)}
        onRegister={(email, password) =>
          handleAuthAction(register, email, password)
        }
        loading={authLoading}
        error={authError}
        onBack={() => onNavigate("main-menu")} // Utilizza la prop onBack per tornare indietro
      />
    </div>
  );
};

AuthView.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default AuthView;