import React from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import Card from "../ui/Card";

const StateNode = ({ data, isConnectable }) => {
  return (
    <Card className="w-64 border-2 border-blue-500/50 shadow-lg bg-gray-800 text-white">
      <div className="bg-gray-700 px-3 py-1 font-bold text-center rounded-t-md">
        {data.name || "Stato senza nome"}
      </div>
      <div className="p-3 text-sm text-gray-300 space-y-1">
        <p>
          <strong>onEnter:</strong> {data.onEnter ? "..." : "(vuoto)"}
        </p>
        <p>
          <strong>onExecute:</strong> {data.onExecute ? "..." : "(vuoto)"}
        </p>
        <p>
          <strong>onExit:</strong> {data.onExit ? "..." : "(vuoto)"}
        </p>
        <div className="border-t border-gray-700/50 my-2" />
        <p>
          <strong>Transizioni:</strong> {data.outDegree ?? 0} in uscita
        </p>
      </div>

      {/* Maniglie per le connessioni (transizioni) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!bg-teal-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!bg-amber-500"
      />
    </Card>
  );
};

StateNode.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.string,
    onEnter: PropTypes.string,
    onExecute: PropTypes.string,
    outDegree: PropTypes.number,
  }).isRequired,
  isConnectable: PropTypes.bool.isRequired,
};

export default StateNode;
