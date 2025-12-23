import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  portalType: "client" | "talent" | "admin";
}

const ProtectedRoute = ({ children, allowedRoles, portalType }: ProtectedRouteProps) => {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth/login?portal=${portalType}`} state={{ from: location }} replace />;
  }

  // Check role-based access for admin portal
  if (portalType === "admin" && allowedRoles) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/auth/login?portal=admin" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
