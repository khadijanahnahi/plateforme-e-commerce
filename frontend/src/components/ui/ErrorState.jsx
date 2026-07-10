import Button from "./Button";

export default function ErrorState({ className = "", description, onRetry, title = "Une erreur est survenue" }) {
  return (
    <div className={`ui-state ui-error-state ${className}`} role="alert">
      <div className="ui-state-icon" aria-hidden="true">!</div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {onRetry ? <div className="ui-state-action"><Button variant="outline" onClick={onRetry}>Réessayer</Button></div> : null}
    </div>
  );
}
