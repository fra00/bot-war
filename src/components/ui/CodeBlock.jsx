import React, { useState } from "react";
import PropTypes from "prop-types";
import "./CodeBlock.css";

/**
 * Un componente per visualizzare blocchi di codice formattati, con un pulsante per copiare.
 */
const CodeBlock = ({ code, className = "" }) => {
  const [copyText, setCopyText] = useState("Copia");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopyText("Copiato!");
      setTimeout(() => setCopyText("Copia"), 2000);
    } catch (err) {
      console.error("Errore durante la copia del codice:", err);
      setCopyText("Errore");
      setTimeout(() => setCopyText("Copia"), 2000);
    }
  };

  const classNames = ["code-block", className].filter(Boolean).join(" ");

  return (
    <div className={classNames}>
      <button className="copy-button" onClick={handleCopy}>
        {copyText}
      </button>
      <pre>
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};

CodeBlock.propTypes = {
  /**
   * La stringa di codice da visualizzare.
   */
  code: PropTypes.string.isRequired,
  /**
   * Classi CSS aggiuntive da applicare al contenitore.
   */
  className: PropTypes.string,
};

export default CodeBlock;
