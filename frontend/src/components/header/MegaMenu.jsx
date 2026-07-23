export default function MegaMenu({ children, id, label, open }) {
  if (!open) return null;

  return (
    <div
      aria-label={label}
      className="client-mega-menu"
      id={`client-mega-${id}`}
      role="region"
    >
      <div className="client-mega-shell">{children}</div>
    </div>
  );
}

