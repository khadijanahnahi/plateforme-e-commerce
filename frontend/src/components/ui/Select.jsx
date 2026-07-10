import { forwardRef, useId } from "react";

const Select = forwardRef(function Select({
  children,
  className = "",
  error,
  fullWidth = false,
  helperText,
  id,
  label,
  options = [],
  placeholder,
  ...props
}, ref) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descriptionId = error || helperText ? `${selectId}-description` : undefined;

  return (
    <label className={`ui-field ${fullWidth ? "ui-field-full" : ""} ${error ? "ui-field-invalid" : ""} ${className}`} htmlFor={selectId}>
      {label ? <span className="ui-field-label">{label}</span> : null}
      <span className="ui-select-shell">
        <select ref={ref} id={selectId} aria-describedby={descriptionId} aria-invalid={Boolean(error)} {...props}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {children ?? options.map((option) => (
            <option disabled={option.disabled} key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </span>
      {error ? <span className="ui-field-message ui-field-error" id={descriptionId}>{error}</span> : helperText ? <span className="ui-field-message" id={descriptionId}>{helperText}</span> : null}
    </label>
  );
});

export default Select;
