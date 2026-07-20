import { Navigate, Outlet } from "react-router-dom";
import ProfileNavigation from "../components/profile/ProfileNavigation";
import Skeleton from "../components/ui/Skeleton";
import { useProfileDashboard } from "../hooks/useProfileDashboard";

function ProfileShellSkeleton() {
  return (
    <main className="profile-hub-page" aria-busy="true" aria-label="Chargement du profil">
      <div className="profile-hub-loading">
        <Skeleton height="150px" radius="24px" />
        <Skeleton height="210px" radius="24px" />
        <Skeleton height="420px" radius="24px" />
      </div>
    </main>
  );
}

export default function ProfilePage() {
  const dashboard = useProfileDashboard();

  if (dashboard.authLoading) return <ProfileShellSkeleton />;
  if (!dashboard.isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <main className="profile-hub-page">
      <div className="profile-hub-layout">
        <ProfileNavigation isAdmin={dashboard.isAdmin} />
        <section className="profile-hub-content" aria-live="polite">
          <Outlet context={dashboard} />
        </section>
      </div>
    </main>
  );
}
