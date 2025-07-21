import React from "react";
import PropTypes from "prop-types";
import Editor from "@monaco-editor/react";
import { useTheme } from "../ui/context/ThemeContext";
import Spinner from "../ui/Spinner";

/**
 * Un wrapper per Monaco Editor che si integra con il sistema di temi dell'app.
 */
const CodeEditor = ({ value, onChange, height = "100%" }) => {
  const { theme } = useTheme();

  return (
    <Editor
      height={height}
      language="javascript"
      theme={theme === "dark" ? "vs-dark" : "light"}
      value={value}
      onChange={onChange}
      loading={<Spinner />}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
};

CodeEditor.propTypes = {
  /** Il codice sorgente da mostrare nell'editor. */
  value: PropTypes.string.isRequired,
  /** Funzione chiamata quando il contenuto dell'editor cambia. */
  onChange: PropTypes.func.isRequired,
  /** L'altezza dell'editor. Può essere un numero (pixel) o una stringa (es. "100%"). */
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default CodeEditor;
