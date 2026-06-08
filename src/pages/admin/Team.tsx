import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Plus, 
    Search, 
    Shield, 
    History, 
    MoreHorizontal, 
    UserPlus, 
    Filter,
    Users,
    Clock,
    UserCheck,
    UserMinus,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AdminWithRoles {
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
        };
    }>;
}

interface Role {
    id: string;
    name: string;
}

const AdminTeam = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [admins, setAdmins] = useState<AdminWithRoles[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    
    // Dialog States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminWithRoles | null>(null);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role_id: "" });
    const [editData, setEditData] = useState({ role_id: "" });

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        try {
            setLoading(true);
            const [adminsRes, rolesRes] = await Promise.all([
                supabase
                    .from("admin_users")
                    .select("*, roles:admin_roles(role:roles(name, id))")
                    .order("created_at", { ascending: false }),
                supabase.from("roles").select("id, name").order("name")
            ]);

            if (adminsRes.error) throw adminsRes.error;
            if (rolesRes.error) throw rolesRes.error;

            setAdmins(adminsRes.data || []);
            setRoles(rolesRes.data || []);
        } catch (error: any) {
            toast.error("Initialization failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdmins = async () => {
        try {
            const { data, error } = await supabase
                .from("admin_users")
                .select("*, roles:admin_roles(role:roles(name, id))")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAdmins(data || []);
        } catch (error: any) {
            toast.error("Failed to refresh team: " + error.message);
        }
    };

    const handleAddAdmin = async () => {
        try {
            setSubmitting(true);
            
            // Get the role name for the legacy user_roles system
            const selectedRole = roles.find(r => r.id === formData.role_id);
            const roleForLegacySystem = selectedRole 
                ? selectedRole.name.toLowerCase().replace(/ /g, '_')
                : "operations_admin";

            // 1. Create Auth Account using edge function
            const { data: authData, error: createError } = await supabase.functions.invoke('create-user', {
                body: {
                    email: formData.email,
                    password: formData.password,
                    role: roleForLegacySystem, 
                    firstName: formData.name.split(' ')[0],
                    lastName: formData.name.split(' ').slice(1).join(' ')
                }
            });

            if (createError) throw new Error(createError.message || "Failed to create Auth user");
            
            const userId = authData?.user?.id;
            if (!userId) throw new Error("No user ID returned from creation");

            // 2. Insert into admin_users (now the FK constraint will pass)
            const { error: adminUserError } = await supabase.from('admin_users').insert({
                id: userId,
                email: formData.email,
                full_name: formData.name,
                status: 'active'
            });

            if (adminUserError) throw new Error("Failed to insert admin profile: " + adminUserError.message);

            // 3. Bind the chosen RBAC role in admin_roles
            const { error: adminRoleError } = await supabase.from('admin_roles').insert({
                admin_id: userId,
                role_id: formData.role_id
            });

            if (adminRoleError) throw new Error("Failed to bind RBAC role: " + adminRoleError.message);

            // 4. Send Branded "You have been invited" Email
            const emailHtml = `
                <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 16px; border: 1px solid #f1f5f9;">
                    <h2 style="color: #0f172a; margin-bottom: 20px; font-weight: 800; font-size: 24px;">Welcome to OpslyHR Administration Room</h2>
                    <p style="color: #475569; line-height: 1.6; margin-bottom: 24px; font-size: 15px;">
                        Hello ${formData.name},<br><br>
                        A secure administrator account has been provisioned for you. Your assigned role and permissions are now active.
                    </p>
                    <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin-bottom: 28px; border-left: 4px solid #ef4444;">
                        <p style="margin: 0; color: #334155; font-size: 14px;"><strong>Admin Portal:</strong> <a href="https://app.opslyhr.com/auth/login" style="color: #2563eb;">Login Here</a></p>
                        <p style="margin: 12px 0 0 0; color: #334155; font-size: 14px;"><strong>Email:</strong> ${formData.email}</p>
                        <p style="margin: 12px 0 0 0; color: #334155; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${formData.password}</code></p>
                    </div>
                    <p style="color: #64748b; font-size: 13px; font-style: italic;">For security purposes, please sign in and navigate to Settings > Security to change your password immediately.</p>
                </div>
            `;

            await supabase.functions.invoke('send-email', {
                body: {
                    to: formData.email,
                    subject: "Your OpslyHR Admin Access Provisioned",
                    htmlTemplate: emailHtml
                }
            });

            toast.success("Admin provisioned successfully and credentials emailed");
            setIsAddDialogOpen(false);
            setFormData({ name: "", email: "", password: "", role_id: "" });
            fetchAdmins();
        } catch (error: any) {
            console.error("Provisioning error:", error);
            toast.error("Provisioning failed: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedAdmin) return;
        try {
            setSubmitting(true);
            const { error } = await supabase.rpc('update_admin_role', {
                p_admin_id: selectedAdmin.id,
                p_role_id: editData.role_id
            });

            if (error) throw error;
            
            toast.success("Role updated successfully");
            setIsEditDialogOpen(false);
            fetchAdmins();
        } catch (error: any) {
            toast.error("Role update failed: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusToggle = async (admin: AdminWithRoles, newStatus: string) => {
        try {
            const { error } = await supabase.rpc('toggle_admin_status', {
                p_admin_id: admin.id,
                p_status: newStatus
            });
            if (error) throw error;
            toast.success(`Admin ${newStatus}`);
            fetchAdmins();
        } catch (error: any) {
            toast.error("Status update failed: " + error.message);
        }
    };

    const stats = {
        active: admins.filter(a => a.status === 'active').length,
        invited: admins.filter(a => a.status === 'invited').length,
        suspended: admins.filter(a => a.status === 'suspended').length,
        roles: roles.length,
    };

    const filteredAdmins = admins.filter(admin => {
        const matchesSearch = 
            admin.full_name?.toLowerCase().includes(search.toLowerCase()) || 
            admin.email?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || admin.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const base = "shadow-none border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider";
        switch (status) {
            case "active": return <Badge className={cn(base, "bg-emerald-50 text-emerald-700")}>Active</Badge>;
            case "invited": return <Badge className={cn(base, "bg-blue-50 text-blue-700")}>Invited</Badge>;
            case "suspended": return <Badge className={cn(base, "bg-gray-100 text-gray-600")}>Suspended</Badge>;
            default: return <Badge variant="outline" className={base}>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in bg-white p-6 -m-6 rounded-lg min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">Team</h1>
                    <p className="text-[12px] text-gray-500 font-medium mt-0.5">Manage administrators, roles and permissions.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600 font-bold" onClick={() => navigate("audit")}>
                        <History className="h-4 w-4 mr-2" /> Audit Log
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600 font-bold" onClick={() => navigate("roles")}>
                        <Shield className="h-4 w-4 mr-2" /> Roles & Permissions
                    </Button>
                    <Button 
                        size="sm" 
                        className="h-9 bg-gray-900 hover:bg-gray-800 text-white font-bold border-0 shadow-sm"
                        onClick={() => setIsAddDialogOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Provision Admin
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Active Admins", value: stats.active, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Pending Invites", value: stats.invited, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Suspended", value: stats.suspended, icon: UserMinus, color: "text-gray-600", bg: "bg-gray-50" },
                    { label: "Roles Defined", value: stats.roles, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-lg p-4 flex items-center gap-4">
                        <div className={cn("p-2 rounded-md", stat.bg)}>
                            <stat.icon className={cn("h-4 w-4", stat.color)} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input 
                            placeholder="Search by name or email..." 
                            className="pl-9 h-9 text-sm border-gray-200 focus-visible:ring-gray-200 placeholder:text-gray-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-9 border-gray-200 text-[12px] font-bold">
                            <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="invited">Invited</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="border border-gray-100 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent border-gray-100">
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10">Name</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10">Email</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10">Role(s)</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10">Status</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10 text-right">Last Active</TableHead>
                            <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-10 text-right">Joined</TableHead>
                            <TableHead className="text-right h-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-gray-200 border-t-gray-800 animate-spin rounded-full"></div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Syncing Team...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredAdmins.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <Users className="h-8 w-8 text-gray-100 mb-2" />
                                        <p className="text-sm font-bold text-gray-900">No admins found</p>
                                        <p className="text-xs text-gray-500">Try adjusting your search or filters.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredAdmins.map((admin) => (
                            <TableRow 
                                key={admin.id} 
                                className="hover:bg-gray-50/50 border-gray-100 cursor-pointer group"
                                onClick={() => navigate(`admins/${admin.id}`)}
                            >
                                <TableCell className="whitespace-nowrap font-bold text-gray-900">{admin.full_name || "Unknown Admin"}</TableCell>
                                <TableCell className="text-gray-500 font-medium">{admin.email}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {admin.roles?.map((r, idx) => (
                                            <span key={idx} className="text-[11px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                {r.role?.name}
                                            </span>
                                        ))}
                                        {(!admin.roles || admin.roles.length === 0) && (
                                            <span className="text-[11px] text-gray-400 italic">No Role</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(admin.status)}</TableCell>
                                <TableCell className="text-right text-[11px] font-mono text-gray-400 group-hover:text-gray-900 transition-colors">
                                    {admin.last_active_at ? format(new Date(admin.last_active_at), "MMM d, HH:mm") : "Never"}
                                </TableCell>
                                <TableCell className="text-right text-[11px] font-mono text-gray-400">
                                    {format(new Date(admin.created_at), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                                <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 shadow-lg border-gray-100">
                                            <DropdownMenuLabel className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">Management</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigate(`admins/${admin.id}`)} className="flex items-center px-3 py-2 text-sm font-medium">
                                                <ExternalLink className="h-4 w-4 mr-2 text-gray-400" /> View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => {
                                                    setSelectedAdmin(admin);
                                                    setEditData({ role_id: admin.roles?.[0]?.role?.id || "" });
                                                    setIsEditDialogOpen(true);
                                                }}
                                                className="flex items-center px-3 py-2 text-sm font-medium"
                                            >
                                                <Shield className="h-4 w-4 mr-2 text-gray-400" /> Edit Role
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-gray-50" />
                                            {admin.status === 'active' ? (
                                                <DropdownMenuItem 
                                                    onClick={() => handleStatusToggle(admin, 'suspended')}
                                                    className="flex items-center px-3 py-2 text-sm font-medium text-red-600 focus:text-red-700 focus:bg-red-50"
                                                >
                                                    <UserMinus className="h-4 w-4 mr-2" /> Suspend Admin
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem 
                                                    onClick={() => handleStatusToggle(admin, 'active')}
                                                    className="flex items-center px-3 py-2 text-sm font-medium text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                                                >
                                                    <UserCheck className="h-4 w-4 mr-2" /> Restore Admin
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Invite Admin Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Provision Admin Account</DialogTitle>
                        <DialogDescription className="text-xs">
                            This creates the account and sends the credentials. Access will be granted immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-gray-400">Full Name</Label>
                            <Input 
                                id="name" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="h-10 text-sm border-gray-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-400">Email Address</Label>
                            <Input 
                                id="email" 
                                type="email"
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="h-10 text-sm border-gray-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-400">Temporary Password</Label>
                            <Input 
                                id="password" 
                                type="text"
                                placeholder="Secure password"
                                value={formData.password} 
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="h-10 text-sm border-gray-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Primary Role</Label>
                            <Select 
                                value={formData.role_id} 
                                onValueChange={(val) => setFormData({...formData, role_id: val})}
                            >
                                <SelectTrigger className="h-10 text-sm border-gray-200">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => (
                                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} disabled={submitting} className="font-bold text-gray-500">Cancel</Button>
                        <Button 
                            onClick={handleAddAdmin} 
                            disabled={submitting || !formData.email || !formData.password || !formData.role_id}
                            className="bg-gray-900 hover:bg-gray-800 text-white font-bold h-10 px-8"
                        >
                            {submitting ? <Clock className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                            Provision Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Edit Access Role</DialogTitle>
                        <DialogDescription className="text-xs">
                            Update the primary role for {selectedAdmin?.full_name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Primary Role</Label>
                            <Select 
                                value={editData.role_id} 
                                onValueChange={(val) => setEditData({...editData, role_id: val})}
                            >
                                <SelectTrigger className="h-10 text-sm border-gray-200">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => (
                                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} disabled={submitting} className="font-bold text-gray-500">Cancel</Button>
                        <Button 
                            onClick={handleUpdateRole} 
                            disabled={submitting || !editData.role_id}
                            className="bg-gray-900 hover:bg-gray-800 text-white font-bold h-10 px-8"
                        >
                            {submitting ? <Clock className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                            Update Access
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminTeam;
