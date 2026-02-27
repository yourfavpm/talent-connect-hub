import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  portalType: "client" | "talent" | "admin";
}

const ADMIN_ROLES = [
  "super_admin",
  "operations_admin",
  "vetting_admin",
  "finance_admin",
  "support_admin",
] as const;

const ProtectedRoute = ({ children, allowedRoles, portalType }: ProtectedRouteProps) => {
  const { user, loading, userRole, roleLoading } = useAuth();
  const location = useLocation();

  // Only block on auth loading (fast — reads from localStorage/memory)
  // Never block on roleLoading for client/talent portals — role resolves in background
  const needsRoleForAccess = portalType === "admin";
  
  if (loading || (needsRoleForAccess && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={`/auth/login?portal=${portalType}`} state={{ from: location }} replace />;
  }

  // Role-based access control
  if (allowedRoles && allowedRoles.length > 0) {
    const isAdminGate = allowedRoles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));

    // 1) If we have a role, enforce it strictly.
    if (userRole) {
      const hasAccess = allowedRoles.includes(userRole);
      if (!hasAccess) {
        if (userRole === "talent") return <Navigate to="/talent/dashboard" replace />;
        if (userRole === "client") return <Navigate to="/client/dashboard" replace />;
        if (userRole.includes("admin")) return <Navigate to="/admin/dashboard" replace />;
        return <Navigate to={`/auth/login?portal=${portalType}`} replace />;
      }
    } else {
      // 2) No role yet: for client/talent portals, allow access (onboarding is optional).
      //    They can complete onboarding later from their dashboard.
      if (!isAdminGate && (portalType === "client" || portalType === "talent")) {
        // Allow access - onboarding is not mandatory
        return <>{children}</>;
      }

      // 3) Admin portal: no role means no access.
      return <Navigate to={`/auth/login?portal=${portalType}`} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
