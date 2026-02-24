import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
    ArrowLeft, 
    Shield, 
    Check, 
    X, 
    Plus, 
    Save, 
    Info,
    ChevronRight,
    Loader2,
    Lock
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface PermissionEntry {
    id: string;
    key: string;
    module: string;
    action: string;
    description: string | null;
}

interface RoleEntry {
    id: string;
    name: string;
    description: string | null;
    is_system_role: boolean;
}

const RolesPermissions = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [roles, setRoles] = useState<RoleEntry[]>([]);
    const [permissions, setPermissions] = useState<PermissionEntry[]>([]);
    const [selectedRole, setSelectedRole] = useState<RoleEntry | null>(null);
    const [rolePermissions, setRolePermissions] = useState<string[]>([]);

    const selectRole = useCallback(async (role: RoleEntry) => {
        setSelectedRole(role);
        try {
            const { data, error } = await supabase
                .from('role_permissions' as any)
                .select('permission_id, permissions(key)')
                .eq('role_id', role.id);

            if (error) throw error;
            setRolePermissions((data as unknown as { permissions: { key: string } }[])?.map((rp) => rp.permissions.key) || []);
        } catch (error: unknown) {
            toast.error("Failed to load permissions: " + (error as Error).message);
        }
    }, []);

    const togglePermission = (permKey: string) => {
        if (selectedRole?.is_system_role && selectedRole?.name === 'Super Admin') {
            toast.error("Super Admin permissions are immutable.");
            return;
        }
        
        setRolePermissions(cur => 
            cur.includes(permKey) ? cur.filter(p => p !== permKey) : [...cur, permKey]
        );
    };

    const init = useCallback(async () => {
        try {
            setLoading(true);
            const [rolesRes, permsRes] = await Promise.all([
                supabase.from('roles' as any).select('*').order('name'),
                supabase.from('permissions' as any).select('*').order('module, action')
            ]);

            if (rolesRes.error) throw rolesRes.error;
            if (permsRes.error) throw permsRes.error;

            setRoles((rolesRes.data as unknown as RoleEntry[]) || []);
            setPermissions((permsRes.data as unknown as PermissionEntry[]) || []);
            
            if (rolesRes.data && rolesRes.data.length > 0) {
                selectRole((rolesRes.data as unknown as RoleEntry[])[0]);
            }
        } catch (error: unknown) {
            toast.error("Initialization failed: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    }, [selectRole]);

    useEffect(() => {
        init();
    }, [init]);

    const handleSave = async () => {
        if (!selectedRole) return;
        try {
            setSaving(true);
            
            // 1. Get permission IDs for selected keys
            const selectedPermIds = permissions
                .filter(p => rolePermissions.includes(p.key))
                .map(p => p.id);

            // 2. Delete existing
            await supabase
                .from('role_permissions' as any)
                .delete()
                .eq('role_id', selectedRole.id);

            // 3. Insert new
            if (selectedPermIds.length > 0) {
                const inserts = selectedPermIds.map(pid => ({
                    role_id: selectedRole.id,
                    permission_id: pid
                }));
                const { error } = await supabase.from('role_permissions' as any).insert(inserts);
                if (error) throw error;
            }

            toast.success("Permissions updated successfully.");
        } catch (error: unknown) {
            toast.error("Save failed: " + (error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    // Group permissions by module
    const modules = Array.from(new Set(permissions.map(p => p.module))).sort();

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-gray-300">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest italic">Hydrating RBAC Matrix...</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in bg-white p-6 -m-6 rounded-lg min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/admin/team")} className="h-8 w-8 text-gray-400">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">Roles & Permissions</h1>
                        <p className="text-[12px] text-gray-500 font-medium mt-0.5">Control access levels for all administrative modules.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600 font-bold">
                        <Plus className="h-4 w-4 mr-2" /> New Role
                    </Button>
                    <Button 
                        size="sm" 
                        className="h-9 bg-gray-900 hover:bg-gray-800 text-white font-bold border-0 shadow-sm"
                        onClick={handleSave}
                        disabled={saving || (selectedRole?.is_system_role && selectedRole?.name === 'Super Admin')}
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} 
                        Save Matrix
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-2">
                {/* Roles Sidebar */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">System Roles</h3>
                    <div className="space-y-1">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => selectRole(role)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all",
                                    selectedRole?.id === role.id 
                                        ? "bg-gray-100 text-gray-900 shadow-sm" 
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Shield className={cn("h-4 w-4", selectedRole?.id === role.id ? "text-gray-900" : "text-gray-300")} />
                                    <span>{role.name}</span>
                                </div>
                                {selectedRole?.id === role.id && <ChevronRight className="h-3 w-3 text-gray-400" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permissions Matrix */}
                <div className="md:col-span-3 space-y-8">
                    {selectedRole && (
                        <div className="mb-6">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-gray-900">{selectedRole.name}</h2>
                                {selectedRole.is_system_role && (
                                    <Badge className="bg-blue-50 text-blue-700 h-5 px-1.5 text-[9px] font-bold border-0">SYSTEM ROLE</Badge>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{selectedRole.description || "No description provided for this role."}</p>
                        </div>
                    )}

                    {selectedRole?.name === 'Super Admin' && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 text-blue-900">
                            <Lock className="h-5 w-5 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold">Immutable System Role</p>
                                <p className="text-xs mt-0.5 opacity-80">Super Admin roles have unrestricted access to all modules. Permissions cannot be modified for this role.</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8">
                        {modules.map((module) => (
                            <div key={module} className="space-y-3">
                                <h4 className="text-[11px] font-bold text-gray-400 tracking-widest border-b border-gray-50 pb-2 capitalize">{module} Module</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {permissions
                                        .filter(p => p.module === module)
                                        .map((perm) => (
                                            <div 
                                                key={perm.id}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                                                    rolePermissions.includes(perm.key) 
                                                        ? "border-gray-200 bg-white shadow-sm" 
                                                        : "border-gray-50 bg-gray-50/30 opacity-60"
                                                )}
                                            >
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-bold text-gray-900">{perm.action.toUpperCase()} {perm.module.toUpperCase()}</p>
                                                    <p className="text-[10px] text-gray-500 line-clamp-1">{perm.description || `Allows ${perm.action} actions in ${perm.module}.`}</p>
                                                </div>
                                                <Checkbox 
                                                    id={perm.id}
                                                    checked={rolePermissions.includes(perm.key)}
                                                    onCheckedChange={() => togglePermission(perm.key)}
                                                    disabled={selectedRole?.name === 'Super Admin'}
                                                    className="data-[state=checked]:bg-gray-900 border-gray-200"
                                                />
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RolesPermissions;
