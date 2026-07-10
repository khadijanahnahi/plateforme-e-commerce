import { forwardRef, useId } from "react";

const Textarea = forwardRef(function Textarea({
  className = "",
  error,
  fullWidth = false,
  helperText,
  id,
  label,
  ...props
}, ref) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const descriptionId = error || helperText ? `${textareaId}-description` : undefined;

  return (
    <label className={`ui-field ${fullWidth ? "ui-field-full" : ""} ${error ? "ui-field-invalid" : ""} ${className}`} htmlFor={textareaId}>
      {label ? <span className="ui-field-label">{label}</span> : null}
      <textarea ref={ref} id={textareaId} aria-describedby={descriptionId} aria-invalid={Boolean(error)} {...props} />
      {error ? <span className="ui-field-message ui-field-error" id={descriptionId}>{error}</span> : helperText ? <span className="ui-field-message" id={descriptionId}>{helperText}</span> : null}
    </label>
  );
});

export default Textarea;
