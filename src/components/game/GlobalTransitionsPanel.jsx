import React from "react";
import PropTypes from "prop-types";
import Card from "../ui/Card";
import CardHeader from "../ui/CardHeader";
import Button from "../ui/Button";

const GlobalTransitionsPanel = ({
  title,
  transitions,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="flex flex-col h-full w-80 flex-shrink-0">
      <CardHeader>{title}</CardHeader>
      <div className="flex-grow overflow-y-auto p-2 space-y-2">
        {transitions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center p-4">
            Nessuna transizione globale definita.
          </p>
        ) : (
          transitions.map((t) => (
            <div
              key={t.id}
              className="bg-gray-700 p-2 rounded-md flex justify-between items-center"
            >
              <div className="truncate mr-2">
                <p className="font-semibold text-sm">
                  {t.label || "Senza etichetta"}
                </p>
                <p className="text-xs text-gray-400">
                  → {t.target || "Nessuna destinazione"}
                </p>
              </div>
              <div className="flex-shrink-0 flex gap-1">
                <Button size="small" onClick={() => onEdit(t)}>
                  Mod.
                </Button>
                <Button
                  size="small"
                  variant="danger"
                  onClick={() => onDelete(t.id)}
                >
                  X
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-2 border-t border-gray-700">
        <Button onClick={onAdd} className="w-full">
          Aggiungi Transizione
        </Button>
      </div>
    </Card>
  );
};

GlobalTransitionsPanel.propTypes = {
  title: PropTypes.string.isRequired,
  transitions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default GlobalTransitionsPanel;
