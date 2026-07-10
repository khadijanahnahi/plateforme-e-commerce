import { useId } from "react";

export default function Switch({ checked, className = "", disabled = false, id, label, name, onChange }) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  return (
    <label className={`ui-switch ${disabled ? "ui-switch-disabled" : ""} ${className}`} htmlFor={switchId}>
      <input checked={checked} disabled={disabled} id={switchId} name={name} role="switch" type="checkbox" onChange={onChange} />
      <span className="ui-switch-control" aria-hidden="true" />
      {label ? <span className="ui-switch-label">{label}</span> : null}
    </label>
  );
}
