import { Link, NavLink } from "react-router-dom";
import ProfileIcon from "./ProfileIcon";

const accountItems = [
  { end: true, icon: "overview", label: "Vue d’ensemble", to: "/profile" },
  { icon: "user", label: "Informations personnelles", to: "/profile/informations" },
  { icon: "lock", label: "Sécurité", to: "/profile/security" },
];

const commerceItems = [
  { icon: "orders", label: "Mes commandes", to: "/orders" },
  { icon: "heart", label: "Ma wishlist", to: "/wishlist" },
];

function NavigationItem({ end, icon, label, to }) {
  return (
    <NavLink className={({ isActive }) => `profile-hub-nav-link${isActive ? " is-active" : ""}`} end={end} to={to}>
      <ProfileIcon name={icon} />
      <span>{label}</span>
      <ProfileIcon name="chevron" size={16} />
    </NavLink>
  );
}

export default function ProfileNavigation({ isAdmin = false }) {
  const visibleItems = isAdmin ? accountItems : [...accountItems, ...commerceItems];

  return (
    <>
      <aside className="profile-hub-sidebar" aria-label="Navigation de l’espace client">
        <nav>
          <span className="profile-hub-nav-label">Compte</span>
          {accountItems.map((item) => <NavigationItem key={item.to} {...item} />)}

          {!isAdmin ? (
            <>
              <span className="profile-hub-nav-label profile-hub-nav-label-spaced">Achats</span>
              {commerceItems.map((item) => <NavigationItem key={item.to} {...item} />)}
            </>
          ) : null}
        </nav>

        <div className="profile-hub-help">
          <ProfileIcon name="support" />
          <strong>Besoin d’aide ?</strong>
          <p>Notre équipe vous accompagne pour vos commandes et votre compte.</p>
          <Link to="/support">Nous contacter <span aria-hidden="true">→</span></Link>
        </div>
      </aside>

      <nav className="profile-hub-mobile-nav" aria-label="Navigation mobile de l’espace client">
        {visibleItems.map((item) => (
          <NavLink
            className={({ isActive }) => `profile-hub-mobile-link${isActive ? " is-active" : ""}`}
            end={item.end}
            key={item.to}
            to={item.to}
          >
            <ProfileIcon name={item.icon} size={17} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
