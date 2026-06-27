import { NavLink, Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="announcement-bar">
          <div className="announcement-inner">
            <span>Premium monochrome edits, weekly drops, express delivery.</span>
            <span>ShopSphere Members get early access to flash deals.</span>
          </div>
        </div>

        <div className="topbar">
          <NavLink className="brand" to="/">
            ShopSphere
          </NavLink>

          <nav className="primary-nav">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/">Categories</NavLink>
            <NavLink to="/">Flash Sale</NavLink>
            <NavLink to="/">Recommended</NavLink>
            <NavLink to="/orders">Orders</NavLink>
          </nav>

          <div className="header-actions">
            <label className="search-shell" htmlFor="shop-search">
              <input
                id="shop-search"
                type="search"
                placeholder="Search products"
              />
            </label>
            <NavLink className="icon-link" to="/">
              Saved
            </NavLink>
            <NavLink className="auth-button signup-button" to="/register">
              Inscription
            </NavLink>
            <NavLink className="auth-button login-button" to="/login">
              Login
            </NavLink>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
