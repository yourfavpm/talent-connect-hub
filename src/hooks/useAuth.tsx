import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  roleLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roleLoading, setRoleLoading] = useState(false);

  const fetchUserRole = async (userId: string) => {
    setRoleLoading(true);
    try {
      // 1. Fetch Legacy Role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) {
        console.error("Error fetching user role:", roleError);
      } else {
        setUserRole(roleData?.role ?? null);
      }

      // 2. Fetch RBAC Permissions if Admin
      if (roleData?.role && ['super_admin', 'operations_admin', 'vetting_admin', 'finance_admin', 'support_admin'].includes(roleData.role)) {
          // Join through admin_roles -> role_permissions -> permissions
          // Also include overrides
          const { data: permData, error: permError } = await supabase
            .rpc('get_admin_permissions' as any, { p_admin_id: userId });

          if (permError) {
            console.error("Error fetching RBAC permissions:", permError);
          } else {
            setPermissions((permData as string[]) || []);
          }
      }
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
    } finally {
      setRoleLoading(false);
    }
  };

  const hasPermission = (permission: string) => {
    if (userRole === 'super_admin') return true;
    return permissions.includes(permission);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setPermissions([]);
          setRoleLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setPermissions([]);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, permissions, hasPermission, roleLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
