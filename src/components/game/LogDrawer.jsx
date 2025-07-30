import React from "react";
import PropTypes from "prop-types";
import Drawer from "../ui/Drawer";
import CardHeader from "../ui/CardHeader";

const LogDrawer = ({ isOpen, onOpen, onClose, gameState }) => {
  return (
    <Drawer isOpen={isOpen} onOpen={onOpen} onClose={onClose} position="right">
      <CardHeader>Game State Log</CardHeader>
      <div className="p-4 overflow-auto h-full">
        <pre className="bg-gray-800 p-2 rounded text-xs">
          {JSON.stringify(gameState, null, 2)}
        </pre>
      </div>
    </Drawer>
  );
};

LogDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onOpen: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  gameState: PropTypes.object.isRequired,
};

export default LogDrawer;
