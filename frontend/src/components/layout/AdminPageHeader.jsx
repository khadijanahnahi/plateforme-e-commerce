export default function AdminPageHeader({ actionLabel, description, kicker, onAction, title }) {
  return (
    <div className="admin-hero">
      <div>
        {kicker ? <span className="section-kicker">{kicker}</span> : null}
        <h1 className="title-lg">{title}</h1>
        {description ? <p className="text-description">{description}</p> : null}
      </div>
      {actionLabel ? (
        <button className="button button-primary" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
