import { NavLink } from "react-router-dom";

export default function MegaMenuLink({ description, label, onNavigate, to }) {
  return (
    <NavLink className="client-mega-link" onClick={onNavigate} to={to}>
      <span>{label}</span>
      {description ? <small>{description}</small> : null}
      <span className="client-mega-link-arrow" aria-hidden="true">→</span>
    </NavLink>
  );
}

