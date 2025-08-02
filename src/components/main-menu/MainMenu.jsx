import React from "react";
import PropTypes from "prop-types";
import Button from "../ui/Button";

const MainMenu = ({ onNavigate }) => {
  return (
    <div className="p-4 pt-20 animate-fade-in text-center">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-12">
          Menu Principale
        </h1>
        <div className="flex justify-center">
          <Button
            onClick={() => onNavigate("game")}
            size="large"
            variant="primary"
          >
            Editor & Arena
          </Button>
        </div>
      </div>
    </div>
  );
};

MainMenu.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default MainMenu;
