export default function EmptyState({ action, className = "", description, icon, title }) {
  return (
    <div className={`ui-state ui-empty-state ${className}`}>
      {icon ? <div className="ui-state-icon" aria-hidden="true">{icon}</div> : null}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="ui-state-action">{action}</div> : null}
    </div>
  );
}
