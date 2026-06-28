import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function hasAdminRole(user) {
  return user?.roles?.some((role) => role === "ADMIN" || role === "ROLE_ADMIN");
}

export default function AdminRoute() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasAdminRole(user)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
