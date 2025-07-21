import React from "react";
import PropTypes from "prop-types";
import "./ToggleSwitch.css";

/**
 * Un componente Toggle Switch, un'alternativa moderna al checkbox, con animazione.
 */
const ToggleSwitch = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  className = "",
  ...rest
}) => {
  const wrapperClasses = ["toggle-switch-wrapper", className]
    .filter(Boolean)
    .join(" ");

  return (
    <label htmlFor={id} className={wrapperClasses}>
      {label && <span className="toggle-switch-label">{label}</span>}
      <div className="toggle-switch">
        <input
          id={id}
          type="checkbox"
          className="toggle-switch-checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          {...rest}
        />
        <span className="toggle-switch-slider"></span>
      </div>
    </label>
  );
};

ToggleSwitch.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default ToggleSwitch;
