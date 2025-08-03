import React from "react";
import PropTypes from "prop-types";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import Toolbar from "../ui/Toolbar";
import useDisclosure from "../ui/useDisclosure";
import Modal from "../ui/Modal";
import Tooltip from "../ui/Tooltip";
import CardFooter from "../ui/CardFooter";

const MainMenu = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      <Toolbar title="Bot War" showThemeSwitcher={true}>
        {user ? (
          <Button onClick={onOpen} variant="ghost">
            Account ({user.email})
          </Button>
        ) : (
          <Button onClick={() => onNavigate("auth")} variant="ghost">
            Login
          </Button>
        )}
      </Toolbar>

      <div className="p-4 pt-20 animate-fade-in text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-12">
            Menu Principale
          </h1>
          {/* Contenitore per i pulsanti con larghezza fissa e centrato */}
          <div className="flex flex-col gap-4 max-w-xs mx-auto">
            <Button
              onClick={() => onNavigate("game")}
              size="large"
              variant="primary"
              className="w-full"
            >
              Editor & Arena
            </Button>
            <Button
              onClick={() => onNavigate("leaderboard")}
              size="large"
              className="w-full"
            >
              Classifica
            </Button>
            <Tooltip
              content="Devi effettuare il login per accedere al multiplayer."
              disabled={!!user}
            >
              {/* Il div wrapper è necessario per il corretto funzionamento del Tooltip su un elemento disabilitato */}
              <div className="w-full">
                <Button
                  onClick={() => onNavigate("multiplayer-lobby")}
                  size="large"
                  variant="secondary"
                  disabled={!user}
                  className="w-full"
                >
                  Multiplayer
                </Button>
              </div>
            </Tooltip>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={onClose} title="Account">
        <div className="p-4">
          <p className="text-center mb-4">Sei loggato come {user?.email}</p>
        </div>
        <CardFooter>
          <Button onClick={onClose} variant="secondary">
            Chiudi
          </Button>
          <Button onClick={handleLogout} variant="danger">
            Logout
          </Button>
        </CardFooter>
      </Modal>
    </>
  );
};

export default MainMenu;
