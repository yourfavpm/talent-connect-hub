import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

  const [portalAccessLoading, setPortalAccessLoading] = useState(false);
  const [portalAccessGranted, setPortalAccessGranted] = useState<boolean | null>(null);

  // If the role is missing (common during early onboarding), fall back to checking if the
  // user has a corresponding portal record (clients/talents). This avoids redirect loops.
  useEffect(() => {
    const shouldCheckPortalRecord =
      !!user &&
      !!allowedRoles?.length &&
      !roleLoading &&
      !loading &&
      !userRole &&
      (portalType === "client" || portalType === "talent");

    if (!shouldCheckPortalRecord) {
      setPortalAccessGranted(null);
      setPortalAccessLoading(false);
      return;
    }

    let cancelled = false;
    setPortalAccessLoading(true);

    (async () => {
      try {
        if (portalType === "client") {
          const { data, error } = await supabase
            .from("clients")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (cancelled) return;
          if (error) throw error;
          setPortalAccessGranted(!!data);
          return;
        }

        if (portalType === "talent") {
          const { data, error } = await supabase
            .from("talents")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (cancelled) return;
          if (error) throw error;
          setPortalAccessGranted(!!data);
        }
      } catch {
        if (!cancelled) setPortalAccessGranted(false);
      } finally {
        if (!cancelled) setPortalAccessLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [allowedRoles, loading, portalType, roleLoading, user, userRole]);

  // Show loading while auth/role/portal access is being fetched
  if (loading || (user && (roleLoading || portalAccessLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
      // 2) No role yet: allow client/talent portals if the user has that portal record.
      if (!isAdminGate && (portalType === "client" || portalType === "talent")) {
        if (portalType === "client") {
          return portalAccessGranted ? (
            <>{children}</>
          ) : (
            <Navigate to="/client/onboarding" replace />
          );
        }

        if (portalType === "talent") {
          return portalAccessGranted ? (
            <>{children}</>
          ) : (
            <Navigate to="/talent/onboarding" replace />
          );
        }
      }

      // 3) Admin portal (or unknown): no role means no access.
      return <Navigate to={`/auth/login?portal=${portalType}`} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
