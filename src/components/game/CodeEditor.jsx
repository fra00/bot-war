import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useTheme } from "../ui/context/ThemeContext";
import Spinner from "../ui/Spinner";

/**
 * Un wrapper per Monaco Editor che si integra con il sistema di temi dell'app.
 */
const CodeEditor = ({
  value,
  onChange,
  height = "100%",
  readOnly = false,
  extraLibs = [],
}) => {
  const { theme } = useTheme();
  const monaco = useMonaco();
  const libRef = useRef([]);

  useEffect(() => {
    if (monaco) {
      // Rimuovi le vecchie librerie per evitare duplicati
      libRef.current.forEach((lib) => lib.dispose());
      libRef.current = [];

      // Aggiungi le nuove librerie per l'autocompletamento
      libRef.current = extraLibs.map((lib) =>
        monaco.languages.typescript.javascriptDefaults.addExtraLib(
          lib.content,
          lib.filePath
        )
      );
    }
  }, [monaco, extraLibs]);

  return (
    <Editor
      height={height}
      language="javascript"
      theme={theme === "dark" ? "vs-dark" : "light"}
      value={value}
      onChange={onChange}
      loading={<Spinner />}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: "on",
        scrollBeyondLastLine: true,
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
  /** Se l'editor deve essere di sola lettura. */
  readOnly: PropTypes.bool,
  /** Un array di librerie extra da fornire a Monaco per l'autocompletamento. */
  extraLibs: PropTypes.arrayOf(
    PropTypes.shape({
      content: PropTypes.string.isRequired,
      filePath: PropTypes.string,
    })
  ),
};

export default CodeEditor;
