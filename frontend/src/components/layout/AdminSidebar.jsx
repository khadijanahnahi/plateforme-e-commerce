import { NavLink } from "react-router-dom";

const adminLinks = [
  { icon: "dashboard", label: "Dashboard", to: "/admin/dashboard" },
  { icon: "banner", label: "Banners", to: "/admin/banners" },
  { icon: "promotion", label: "Promotions", to: "/admin/promotions" },
  { icon: "product", label: "Products", to: "/admin/products" },
  { icon: "stock", label: "Stock History", to: "/admin/stock-movements" },
  { icon: "category", label: "Categories", to: "/admin/categories" },
  { icon: "coupon", label: "Coupons", to: "/admin/coupons" },
  { icon: "review", label: "Reviews", to: "/admin/reviews" },
  { icon: "customer", label: "Customers", to: "/admin/customers" },
  { icon: "order", label: "Orders", to: "/admin/orders" },
  { icon: "settings", label: "Settings", to: "/admin/settings" },
];

function AdminNavIcon({ name }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    banner: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m7 15 3-3 2.5 2.5L16 11l4 4" /><circle cx="8.5" cy="9" r="1.2" /></>,
    promotion: <><path d="M20 12 12 20l-8-8 8-8 8 8Z" /><path d="m9 12 2 2 4-4" /></>,
    product: <><path d="M6 8.5 12 5l6 3.5v7L12 19l-6-3.5v-7Z" /><path d="m6.4 8.7 5.6 3.2 5.6-3.2M12 12v7" /></>,
    stock: <><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" /><path d="m4.5 7.8 7.5 4.1 7.5-4.1M12 12v9" /><path d="M8 5.3 15.5 9.5" /></>,
    category: <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></>,
    coupon: <><path d="M4 7a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a3 3 0 0 0 0-6V7Z" /><path d="M12 7v2M12 11v2M12 15v2" /></>,
    review: <><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></>,
    customer: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.8M16.5 15a5 5 0 0 1 4 5" /></>,
    order: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  };

  return <svg aria-hidden="true" className="admin-nav-icon" viewBox="0 0 24 24">{paths[name]}</svg>;
}

export default function AdminSidebar({ collapsed, mobileOpen, onNavigate, onToggleCollapsed }) {
  return (
    <aside className={`admin-sidebar ${collapsed ? "admin-sidebar-compact" : ""} ${mobileOpen ? "admin-sidebar-open" : ""}`}>
      <div className="admin-sidebar-brand-row">
        <NavLink className="admin-sidebar-brand" to="/admin/dashboard" onClick={onNavigate}>
          <span className="admin-sidebar-monogram">S<span>•</span></span>
          <span className="admin-sidebar-brand-copy"><strong>ShopSphere Admin</strong><small>Commerce Console</small></span>
        </NavLink>
        <button
          className="admin-sidebar-collapse"
          type="button"
          aria-label={collapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapsed}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d={collapsed ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} /></svg>
        </button>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        {adminLinks.map((link) => (
          <NavLink
            aria-label={link.label}
            data-tooltip={link.label}
            key={link.to}
            title={collapsed ? link.label : undefined}
            to={link.to}
            onClick={onNavigate}
          >
            <AdminNavIcon name={link.icon} />
            <span className="admin-sidebar-link-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
