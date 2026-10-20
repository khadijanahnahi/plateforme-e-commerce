import { Link } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <section className="page not-found-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">401</span>
          <h1>Accès non autorisé</h1>
          <p>Vous devez vous connecter avec un compte autorisé pour accéder à cette page.</p>
        </div>
        <div className="banner-actions">
          <Link className="button button-primary" to="/login">Se connecter</Link>
          <Link className="button button-secondary" to="/">Retour boutique</Link>
        </div>
      </div>
    </section>
  );
}
