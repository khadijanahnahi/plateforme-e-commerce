import { Link } from "react-router-dom";

export default function AuthHeader() {
  return (
    <header className="auth-header">
      <div className="auth-header-inner">
        <Link className="auth-header-logo" to="/" aria-label="Accueil ShopSphere">
          Shop<span aria-hidden="true">•</span>Sphere
        </Link>

        <Link className="auth-header-back" to="/">
          <span aria-hidden="true">←</span>
          Retour à la boutique
        </Link>
      </div>
    </header>
  );
}
