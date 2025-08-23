import React from "react";
import { Handle, Position } from "reactflow";

const GlobalNode = ({ data }) => {
  return (
    <>
      <div className="px-4 py-2 shadow-md rounded-md bg-sky-700 text-white border-2 border-sky-500 font-semibold">
        {data.label}
      </div>
      {/* 
        [FIX] Questo Handle è il punto di connessione per le transizioni globali.
        React Flow ha bisogno di un <Handle type="source"> per sapere da dove far partire l'arco.
        Lo rendiamo invisibile perché l'arco di default si aggancerà al centro del nodo.
      */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "transparent", border: "none" }}
      />
    </>
  );
};

export default GlobalNode;
