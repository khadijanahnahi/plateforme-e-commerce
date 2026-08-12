import { forwardRef, useId } from "react";
import DateTimeInput from "./DateTimeInput";

const Input = forwardRef(function Input({
  className = "",
  error,
  fullWidth = false,
  helperText,
  iconLeft,
  id,
  label,
  type = "text",
  ...props
}, ref) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error || helperText ? `${inputId}-description` : undefined;

  if (type === "date" || type === "datetime-local") {
    return (
      <DateTimeInput
        {...props}
        className={className}
        error={error}
        fullWidth={fullWidth}
        helperText={helperText}
        id={inputId}
        label={label}
        ref={ref}
        type={type}
      />
    );
  }

  return (
    <label className={`ui-field ${fullWidth ? "ui-field-full" : ""} ${error ? "ui-field-invalid" : ""} ${className}`} htmlFor={inputId}>
      {label ? <span className="ui-field-label">{label}</span> : null}
      <span className="ui-input-shell">
        {iconLeft ? <span className="ui-field-icon">{iconLeft}</span> : null}
        <input ref={ref} id={inputId} type={type} className={iconLeft ? "ui-input-with-icon" : ""} aria-describedby={descriptionId} aria-invalid={Boolean(error)} {...props} />
      </span>
      {error ? <span className="ui-field-message ui-field-error" id={descriptionId}>{error}</span> : helperText ? <span className="ui-field-message" id={descriptionId}>{helperText}</span> : null}
    </label>
  );
});

export default Input;
