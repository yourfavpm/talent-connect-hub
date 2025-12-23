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
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={`/auth/login?portal=${portalType}`} state={{ from: location }} replace />;
  }

  // Role-based access control
  if (allowedRoles && allowedRoles.length > 0) {
    // Check if user has one of the allowed roles
    const hasAccess = userRole && allowedRoles.includes(userRole);
    
    if (!hasAccess) {
      // User is authenticated but doesn't have the right role
      // Redirect them to their appropriate portal
      if (userRole === "talent") {
        return <Navigate to="/talent/dashboard" replace />;
      } else if (userRole === "client") {
        return <Navigate to="/client/dashboard" replace />;
      } else if (userRole?.includes("admin")) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      
      // If no role found, redirect to login
      return <Navigate to={`/auth/login?portal=${portalType}`} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
