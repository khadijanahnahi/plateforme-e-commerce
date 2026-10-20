export default function ProfileSectionCard({
  action,
  children,
  className = "",
  description,
  icon,
  title,
}) {
  return (
    <article className={`profile-hub-card ${className}`.trim()}>
      <header className="profile-hub-card-header">
        <div className="profile-hub-card-title">
          {icon ? <span className="profile-hub-card-icon">{icon}</span> : null}
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        {action ? <div className="profile-hub-card-action">{action}</div> : null}
      </header>
      {children}
    </article>
  );
}
