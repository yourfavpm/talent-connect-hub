import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getInternalPath, getZoneUrl, Zone } from "@/utils/subdomain";

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
    const loginUrl = getZoneUrl(Zone.AUTH, `/auth/login?portal=${portalType}`);
    window.location.href = loginUrl;
    return null;
  }

  // Role-based access control
  if (allowedRoles && allowedRoles.length > 0) {
    const isAdminGate = allowedRoles.some((r) => (ADMIN_ROLES as readonly string[]).includes(r));

    // 1) If we have a role, enforce it strictly.
    if (userRole) {
      const hasAccess = allowedRoles.includes(userRole);
      if (!hasAccess) {
        if (userRole === "talent") {
            window.location.href = getZoneUrl(Zone.TALENT, "/dashboard");
            return null;
        }
        if (userRole === "client") {
            window.location.href = getZoneUrl(Zone.CLIENT, "/dashboard");
            return null;
        }
        if (userRole.includes("admin")) {
            window.location.href = getZoneUrl(Zone.ADMIN, "/dashboard");
            return null;
        }
        window.location.href = getZoneUrl(Zone.AUTH, `/auth/login?portal=${portalType}`);
        return null;
      }
    } else {
      // 2) No role yet: for client/talent portals, allow access (onboarding is optional).
      //    They can complete onboarding later from their dashboard.
      if (!isAdminGate && (portalType === "client" || portalType === "talent")) {
        // Allow access - onboarding is not mandatory
        return <>{children}</>;
      }

      // 3) Admin portal: no role means no access.
      window.location.href = getZoneUrl(Zone.AUTH, `/auth/login?portal=${portalType}`);
      return null;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
