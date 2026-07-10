import { forwardRef, useId } from "react";

const Input = forwardRef(function Input({
  className = "",
  error,
  fullWidth = false,
  helperText,
  iconLeft,
  id,
  label,
  ...props
}, ref) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error || helperText ? `${inputId}-description` : undefined;

  return (
    <label className={`ui-field ${fullWidth ? "ui-field-full" : ""} ${error ? "ui-field-invalid" : ""} ${className}`} htmlFor={inputId}>
      {label ? <span className="ui-field-label">{label}</span> : null}
      <span className="ui-input-shell">
        {iconLeft ? <span className="ui-field-icon">{iconLeft}</span> : null}
        <input ref={ref} id={inputId} className={iconLeft ? "ui-input-with-icon" : ""} aria-describedby={descriptionId} aria-invalid={Boolean(error)} {...props} />
      </span>
      {error ? <span className="ui-field-message ui-field-error" id={descriptionId}>{error}</span> : helperText ? <span className="ui-field-message" id={descriptionId}>{helperText}</span> : null}
    </label>
  );
});

export default Input;
