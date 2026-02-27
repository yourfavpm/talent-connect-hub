import { useState, useEffect, createContext, useContext, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Module-level cache: role/permissions are fetched ONCE per user per session
const roleCache = new Map<string, { role: string | null; permissions: string[] }>();

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
  const fetchingForUser = useRef<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    // Return from cache instantly if already fetched for this user
    if (roleCache.has(userId)) {
      const cached = roleCache.get(userId)!;
      setUserRole(cached.role);
      setPermissions(cached.permissions);
      return;
    }
    // Prevent duplicate concurrent fetches for same user
    if (fetchingForUser.current === userId) return;
    fetchingForUser.current = userId;
    setRoleLoading(true);
    try {
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

      let perms: string[] = [];
      if (roleData?.role && ['super_admin', 'operations_admin', 'vetting_admin', 'finance_admin', 'support_admin'].includes(roleData.role)) {
          const { data: permData, error: permError } = await supabase
            .rpc('get_admin_permissions' as any, { p_admin_id: userId });

          if (permError) {
            console.error("Error fetching RBAC permissions:", permError);
          } else {
            perms = (permData as string[]) || [];
            setPermissions(perms);
          }
      }

      // Cache the result for this session
      roleCache.set(userId, { role: roleData?.role ?? null, permissions: perms });
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
    } finally {
      setRoleLoading(false);
      fetchingForUser.current = null;
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
