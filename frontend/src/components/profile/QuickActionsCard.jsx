import { Link } from "react-router-dom";
import ProfileIcon from "./ProfileIcon";
import ProfileSectionCard from "./ProfileSectionCard";

const clientActions = [
  { description: "Suivre et consulter vos achats", icon: "orders", label: "Mes commandes", to: "/orders" },
  { description: "Retrouver vos articles favoris", icon: "heart", label: "Ma wishlist", to: "/wishlist" },
  { description: "Mettre à jour vos coordonnées", icon: "user", label: "Modifier mon profil", to: "/profile/informations" },
  { description: "Explorer les nouveautés ShopSphere", icon: "shop", label: "Continuer mes achats", to: "/products" },
  { description: "Obtenir de l’aide rapidement", icon: "support", label: "Contacter le support", to: "/support" },
];

const adminActions = [
  { description: "Mettre à jour vos coordonnées", icon: "user", label: "Modifier mon profil", to: "/profile/informations" },
  { description: "Revenir à votre espace de gestion", icon: "overview", label: "Tableau de bord admin", to: "/admin/dashboard" },
  { description: "Consulter la boutique publique", icon: "shop", label: "Voir la boutique", to: "/" },
  { description: "Obtenir de l’aide rapidement", icon: "support", label: "Contacter le support", to: "/support" },
];

export default function QuickActionsCard({ isAdmin }) {
  const actions = isAdmin ? adminActions : clientActions;

  return (
    <ProfileSectionCard className="profile-hub-card-wide" title="Actions rapides">
      <div className="profile-hub-actions-grid">
        {actions.map((action) => (
          <Link className="profile-hub-action-tile" key={action.to} to={action.to}>
            <span className="profile-hub-action-icon"><ProfileIcon name={action.icon} /></span>
            <span>
              <strong>{action.label}</strong>
              <small>{action.description}</small>
            </span>
            <ProfileIcon name="chevron" size={17} />
          </Link>
        ))}
      </div>
    </ProfileSectionCard>
  );
}
