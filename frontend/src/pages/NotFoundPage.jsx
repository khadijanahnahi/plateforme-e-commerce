import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="page not-found-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">404</span>
          <h1>Page not found</h1>
          <p>The page you are looking for does not exist in ShopSphere.</p>
        </div>
        <Link className="button button-primary" to="/">Back home</Link>
      </div>
    </section>
  );
}
