import { forwardRef } from "react";

const Button = forwardRef(function Button({
  children,
  className = "",
  disabled = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  loading = false,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}, ref) {
  const classes = [
    "ui-button",
    `ui-button-${variant}`,
    `ui-button-${size}`,
    fullWidth ? "ui-button-full" : "",
    loading ? "ui-button-loading" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} type={type} {...props}>
      {loading ? <span className="ui-button-spinner" aria-hidden="true" /> : iconLeft ? <span className="ui-button-icon">{iconLeft}</span> : null}
      <span>{children}</span>
      {!loading && iconRight ? <span className="ui-button-icon">{iconRight}</span> : null}
    </button>
  );
});

export default Button;
