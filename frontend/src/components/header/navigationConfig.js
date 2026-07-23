export const shopDiscoveryLinks = [
  {
    label: "Tous les produits",
    description: "Parcourir l'ensemble du catalogue.",
    to: "/products",
  },
  {
    label: "Nouveautés",
    description: "Découvrir les dernières pièces ajoutées.",
    to: "/products?sort=new",
  },
  {
    label: "Meilleures ventes",
    description: "Voir les favoris de nos clients.",
    to: "/products?sort=best",
  },
  {
    label: "Promotions en cours",
    description: "Accéder aux offres actuellement disponibles.",
    to: "/#promotions",
  },
];

export const inspirationLinks = [
  {
    label: "Le Journal",
    description: "Conseils, matières et inspirations ShopSphere.",
    to: "/blog",
  },
  {
    label: "Notre univers",
    description: "Découvrir l'identité et les engagements de la boutique.",
    to: "/about",
  },
];

export const serviceGroups = [
  {
    title: "Commandes",
    links: [
      { label: "Mes commandes", to: "/orders" },
      { label: "Suivre une commande", to: "/orders" },
    ],
  },
  {
    title: "Livraison",
    links: [
      { label: "Livraison et paiement", to: "/support" },
      { label: "Questions de livraison", to: "/support" },
    ],
  },
  {
    title: "Retours",
    emphasized: true,
    links: [
      { label: "Demander un retour", to: "/return-policy" },
      { label: "Suivre mes retours", to: "/return-policy" },
      { label: "Politique de retour", to: "/return-policy" },
    ],
  },
  {
    title: "Aide",
    links: [
      { label: "Contacter le support", to: "/support" },
      { label: "À propos", to: "/about" },
      { label: "Conditions d'utilisation", to: "/terms" },
      { label: "Confidentialité", to: "/privacy-policy" },
    ],
  },
];

