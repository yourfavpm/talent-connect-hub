import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    ArrowLeft, 
    Shield, 
    History, 
    User, 
    Mail, 
    Calendar, 
    Clock, 
    MoreHorizontal,
    UserCheck,
    UserMinus,
    CheckCircle2,
    Lock,
    Unlock,
    Settings,
    Loader2,
    Plus
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AdminProfile {
    id: string;
    email: string;
    full_name: string;
    status: string;
    created_at: string;
    last_active_at: string | null;
    roles: Array<{
        role: {
            id: string;
            name: string;
            description: string;
        };
    }>;
}

interface Permission {
    id: string;
    key: string;
    module: string;
    action: string;
}

const AdminDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [admin, setAdmin] = useState<AdminProfile | null>(null);
    const [effectivePermissions, setEffectivePermissions] = useState<string[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    
    // Override State
    const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
    const [selectedPermId, setSelectedPermId] = useState("");
    const [overrideAllowed, setOverrideAllowed] = useState(true);

    useEffect(() => {
        if (id) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const init = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchAdminData(),
                fetchPermissions()
            ]);
        } catch (error: unknown) {
            toast.error("Initialization failed: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        const { data, error } = await supabase.from('permissions').select('*').order('module');
        if (error) throw error;
        setAllPermissions(data || []);
    };

    const fetchAdminData = async () => {
        try {
            // 1. Fetch Admin Profile & Roles
            const { data, error } = await supabase
                .from("admin_users")
                .select(`
                    *,
                    roles:admin_roles(role:roles(id, name, description))
                `)
                .eq("id", id)
                .single();

            if (error) throw error;
            setAdmin(data as AdminProfile);

            // 2. Fetch Effective Permissions
            const { data: perms, error: permsErr } = await supabase
                .rpc('get_admin_permissions', { p_admin_id: id });
            
            if (permsErr) throw permsErr;
            setEffectivePermissions(perms || []);

        } catch (error: unknown) {
            toast.error("Error fetching admin: " + (error as Error).message);
        }
    };

    const handleToggleStatus = async () => {
        if (!admin) return;
        const newStatus = admin.status === 'active' ? 'suspended' : 'active';
        try {
            const { error } = await supabase.rpc('toggle_admin_status', {
                p_admin_id: id,
                p_status: newStatus
            });

            if (error) throw error;
            toast.success(`Admin ${newStatus === 'active' ? 'restored' : 'suspended'}`);
            fetchAdminData();
        } catch (error: unknown) {
            toast.error("Action failed: " + (error as Error).message);
        }
    };

    const handleAddOverride = async () => {
        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('add_admin_override', {
                p_admin_id: id,
                p_permission_id: selectedPermId,
                p_allowed: overrideAllowed
            });

            if (error) throw error;
            toast.success("Override added successfully");
            setIsOverrideDialogOpen(false);
            fetchAdminData();
        } catch (error: unknown) {
            toast.error("Override failed: " + (error as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-gray-300">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest italic">Hydrating Admin Context...</span>
        </div>
    );

    if (!admin) return <div>Admin not found.</div>;

    return (
        <div className="space-y-6 animate-fade-in bg-white p-6 -m-6 rounded-lg min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/admin/team")} className="h-8 w-8 text-gray-400">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold tracking-tight text-gray-900">{admin.full_name}</h1>
                            <Badge className={cn(
                                "shadow-none border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                admin.status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                            )}>
                                {admin.status}
                            </Badge>
                        </div>
                        <p className="text-[12px] text-gray-500 font-medium mt-0.5">{admin.email} • ID: {admin.id.substring(0, 8)}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600 font-bold">
                        <Settings className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                    <Button 
                        size="sm" 
                        variant={admin.status === 'active' ? "outline" : "default"}
                        className={cn("h-9 font-bold border-0 shadow-sm", 
                            admin.status === 'active' ? "text-red-600 bg-red-50 hover:bg-red-100" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                        onClick={handleToggleStatus}
                    >
                        {admin.status === 'active' ? (
                            <><UserMinus className="h-4 w-4 mr-2" /> Suspend Access</>
                        ) : (
                            <><UserCheck className="h-4 w-4 mr-2" /> Restore Access</>
                        )}
                    </Button>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-transparent border-b border-gray-100 w-full justify-start rounded-none h-auto p-0 gap-8">
                    <TabsTrigger value="overview" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent rounded-none px-0 py-3 text-[12px] font-bold uppercase tracking-widest text-gray-400 data-[state=active]:text-gray-900 transition-all">Overview</TabsTrigger>
                    <TabsTrigger value="access" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent rounded-none px-0 py-3 text-[12px] font-bold uppercase tracking-widest text-gray-400 data-[state=active]:text-gray-900 transition-all">Access Control</TabsTrigger>
                    <TabsTrigger value="activity" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent rounded-none px-0 py-3 text-[12px] font-bold uppercase tracking-widest text-gray-400 data-[state=active]:text-gray-900 transition-all">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="shadow-none border-gray-100 col-span-2">
                            <CardContent className="p-6">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Account Information</h3>
                                <div className="grid grid-cols-2 gap-y-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Registered Email</p>
                                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gray-300" /> {admin.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Member Since</p>
                                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-gray-300" /> {format(new Date(admin.created_at), "MMMM d, yyyy")}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Last Login</p>
                                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-gray-300" /> {admin.last_active_at ? format(new Date(admin.last_active_at), "MMM d, yyyy HH:mm") : "Never"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Current Status</p>
                                        <div className="flex items-center gap-2">
                                            {admin.status === 'active' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Lock className="h-4 w-4 text-amber-500" />}
                                            <span className="text-sm font-bold capitalize">{admin.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-none border-gray-100">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Assigned Roles</h3>
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-50">Manage</Button>
                                </div>
                                <div className="space-y-3">
                                    {(admin.roles || []).map((r, idx: number) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-gray-50 bg-gray-50/50">
                                            <Shield className="h-4 w-4 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">{r.role.name}</p>
                                                <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{r.role.description || "No description provided."}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!admin.roles || admin.roles.length === 0) && (
                                        <div className="text-center py-6 text-gray-400 italic text-[11px]">No roles assigned.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="access" className="pt-6">
                    <Card className="shadow-none border-gray-100">
                        <CardContent className="p-6">
                            <div className="mb-6 flex justify-between items-end">
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Effective Permissions</h3>
                                    <p className="text-xs text-gray-500 mt-1">Calculated based on roles and explicit overrides.</p>
                                </div>
                                <Button 
                                    size="sm" 
                                    className="h-8 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest"
                                    onClick={() => setIsOverrideDialogOpen(true)}
                                >
                                    Add Override
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {effectivePermissions.length > 0 ? (
                                    [...effectivePermissions].sort().map((perm) => (
                                        <div key={perm} className="flex items-center gap-2 p-2 rounded border border-emerald-50 bg-emerald-50/30">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                            <span className="text-[11px] font-mono font-medium text-emerald-800">{perm}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-4 py-8 text-center text-gray-400 italic text-[11px]">No active permissions. Access is restricted.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="pt-6">
                    <Card className="shadow-none border-gray-100">
                        <CardContent className="p-6">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Recent Activity</h3>
                            <div className="space-y-6 border-l border-gray-100 ml-3 pl-6 relative">
                                {[
                                    { action: "Updated Job Status", target: "Frontend Engineer #102", date: "Today at 14:23", icon: User },
                                    { action: "Suspended Talent Access", target: "John Doe", date: "Yesterday at 09:15", icon: Lock },
                                    { action: "Generated Invoice", target: "Invoice #INV-2024-001", date: "2 days ago", icon: History },
                                ].map((activity, i) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-[31px] top-0 h-2.5 w-2.5 rounded-full bg-white border-2 border-gray-200" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-gray-900">{activity.action}</p>
                                            <p className="text-xs text-gray-500">Target: <span className="font-medium text-gray-700">{activity.target}</span></p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">{activity.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 text-center">
                                <Button variant="ghost" size="sm" className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 h-8">View Full Audit History</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Override Dialog */}
            <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Explicit Permission Override</DialogTitle>
                        <DialogDescription className="text-xs">
                            Grant or deny a specific permission regardless of assigned roles.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Permission</Label>
                            <Select value={selectedPermId} onValueChange={setSelectedPermId}>
                                <SelectTrigger className="h-10 text-sm border-gray-200">
                                    <SelectValue placeholder="Select a permission..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allPermissions.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <span className="font-bold mr-2 uppercase">{p.module}</span>
                                            {p.action}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Action</Label>
                            <Select value={overrideAllowed ? "allow" : "deny"} onValueChange={(val) => setOverrideAllowed(val === "allow")}>
                                <SelectTrigger className="h-10 text-sm border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="allow" className="text-emerald-600 font-bold">ALLOW</SelectItem>
                                    <SelectItem value="deny" className="text-red-600 font-bold">DENY</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsOverrideDialogOpen(false)} disabled={submitting} className="font-bold text-gray-500">Cancel</Button>
                        <Button 
                            onClick={handleAddOverride} 
                            disabled={submitting || !selectedPermId}
                            className="bg-gray-900 hover:bg-gray-800 text-white font-bold h-10 px-8"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Apply Override
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminDetail;
