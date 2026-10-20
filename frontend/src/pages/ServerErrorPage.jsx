import { Link } from "react-router-dom";

export default function ServerErrorPage() {
  return (
    <section className="page not-found-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">500</span>
          <h1>Erreur serveur</h1>
          <p>Une erreur technique est survenue. Réessayez dans quelques instants.</p>
        </div>
        <div className="banner-actions">
          <Link className="button button-primary" to="/">Retour accueil</Link>
          <Link className="button button-secondary" to="/support">Contacter le support</Link>
        </div>
      </div>
    </section>
  );
}
