import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Shield, Search, UserPlus, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AdminUser {
    user_id: string;
    role: string;
    profile?: {
        first_name: string;
        last_name: string;
        email: string;
    };
}

const AdminTeam = () => {
    const { toast } = useToast();
    const { userRole, user } = useAuth();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteOpen, setInviteOpen] = useState(false);

    // Invite Form
    const [searchEmail, setSearchEmail] = useState("");
    const [selectedRole, setSelectedRole] = useState("operations_admin");
    const [foundUser, setFoundUser] = useState<any>(null);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            // Fetch all user roles that are admin types
            const { data: roleData, error } = await supabase
                .from("user_roles")
                .select("user_id, role")
                .in("role", ["super_admin", "operations_admin", "vetting_admin", "finance_admin", "support_admin", "talent_manager", "account_manager"] as any);

            if (error) throw error;

            // Fetch profiles for these users
            const userIds = roleData.map(r => r.user_id);
            const { data: profileData } = await supabase
                .from("profiles")
                .select("user_id, first_name, last_name, email")
                .in("user_id", userIds);

            // Merge details
            const merged = roleData.map(r => ({
                ...r,
                profile: profileData?.find(p => p.user_id === r.user_id)
            }));

            setAdmins(merged);
        } catch (error: any) {
            console.error("Error fetching admins:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const [creatingUser, setCreatingUser] = useState(false);
    const [newUser, setNewUser] = useState({ firstName: "", lastName: "", email: "", password: "" });

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
            toast({ title: "Error", description: "All fields are required", variant: "destructive" });
            return;
        }
        setCreatingUser(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: {
                    email: newUser.email,
                    password: newUser.password,
                    role: selectedRole,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName
                }
            });

            if (error) throw error;

            toast({ title: "Success", description: "Admin account created successfully." });
            setInviteOpen(false);
            setNewUser({ firstName: "", lastName: "", email: "", password: "" });
            fetchAdmins();
        } catch (error: any) {
            console.error("Create user error:", error);
            toast({ title: "Error", description: error.message || "Failed to create user", variant: "destructive" });
        } finally {
            setCreatingUser(false);
        }
    };

    // Role Editing State
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [newRole, setNewRole] = useState("");
    const [newFirstName, setNewFirstName] = useState("");
    const [newLastName, setNewLastName] = useState("");

    const handleUpdateRole = async () => {
        if (!editingUser || !newRole) return;
        setLoading(true);
        try {
            // 1. Update Role
            const { error: roleError } = await supabase
                .from("user_roles")
                .update({ role: newRole as any })
                .eq("user_id", editingUser.user_id);

            if (roleError) throw roleError;

            // 2. Update Profile (Name)
            if (newFirstName !== editingUser.profile?.first_name || newLastName !== editingUser.profile?.last_name) {
                const { error: profileError } = await supabase
                    .from("profiles")
                    .update({
                        first_name: newFirstName,
                        last_name: newLastName
                    })
                    .eq("user_id", editingUser.user_id);

                if (profileError) throw profileError;
            }

            toast({ title: "Success", description: "Admin updated successfully." });
            setEditingUser(null);
            fetchAdmins();
        } catch (error: any) {
            console.error("Error updating admin:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Kept for backward compatibility if needed, but UI now uses Create User. 
    // ... handlesearchUser etc could be removed if we are fully switching.
    // For now I replaced the Dialog UI so these are unused but harmless unless I remove them.
    // I will remove them to be clean? No, I'll update the Dialog content replacement which I did above.
    // So I will just leave the old handlers unused or delete them.
    // I will remove handleSearchUser and handlePromoteUser to avoid confusion.
    // Wait, the "Add New Admin" dialog usage REPLACED the Promote User usage.
    // So I should clean up the unused state/funcs.


    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Admin Team</h1>
                    <p className="text-muted-foreground">Manage platform administrators and roles</p>
                </div>
                {userRole === "super_admin" && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const url = `${window.location.origin}/auth/admin-signup`;
                                navigator.clipboard.writeText(url);
                                toast({ title: "Success", description: "Admin Signup Link copied to clipboard!" });
                            }}
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Copy Invite Link
                        </Button>
                        <Dialog open={inviteOpen} onOpenChange={(open) => {
                            setInviteOpen(open);
                            if (!open) {
                                setFoundUser(null);
                                setSearchEmail("");
                                setSelectedRole("operations_admin");
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button className="gap-2" onClick={() => setInviteOpen(true)}>
                                    <UserPlus className="h-4 w-4" />
                                    Add Admin
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Admin</DialogTitle>
                                    <DialogDescription>
                                        Create a new admin account with password.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>First Name</Label>
                                            <Input
                                                value={newUser.firstName}
                                                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Name</Label>
                                            <Input
                                                value={newUser.lastName}
                                                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Password</Label>
                                        <Input
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select
                                            value={selectedRole}
                                            onValueChange={setSelectedRole}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="operations_admin">Operations Admin</SelectItem>
                                                <SelectItem value="vetting_admin">Vetting Admin</SelectItem>
                                                <SelectItem value="finance_admin">Finance Admin</SelectItem>
                                                <SelectItem value="support_admin">Support Admin</SelectItem>
                                                <SelectItem value="talent_manager">Talent Manager</SelectItem>
                                                <SelectItem value="account_manager">Account Manager</SelectItem>
                                                <SelectItem value="super_admin">Super Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateUser} disabled={creatingUser}>
                                        {creatingUser ? "Creating..." : "Create Account"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {/* EDIT ROLE DIALOG */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Admin Role</DialogTitle>
                        <DialogDescription>
                            Change the access level for {editingUser?.profile?.first_name} {editingUser?.profile?.last_name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    value={newFirstName}
                                    onChange={(e) => setNewFirstName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    value={newLastName}
                                    onChange={(e) => setNewLastName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Select Role</Label>
                            <Select
                                value={newRole}
                                onValueChange={setNewRole}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="operations_admin">Operations Admin</SelectItem>
                                    <SelectItem value="vetting_admin">Vetting Admin</SelectItem>
                                    <SelectItem value="finance_admin">Finance Admin</SelectItem>
                                    <SelectItem value="support_admin">Support Admin</SelectItem>
                                    <SelectItem value="talent_manager">Talent Manager</SelectItem>
                                    <SelectItem value="account_manager">Account Manager</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                        <Button onClick={handleUpdateRole} disabled={loading}>
                            {loading ? "Updating..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && !admins.length ? (
                            <TableRow><TableCell colSpan={4} className="text-center h-24">Loading...</TableCell></TableRow>
                        ) : admins.map((admin) => (
                            <TableRow key={admin.user_id}>
                                <TableCell className="font-medium">
                                    {admin.profile ? `${admin.profile.first_name} ${admin.profile.last_name}` : "Unknown"}
                                </TableCell>
                                <TableCell>{admin.profile?.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {admin.role.replace("_", " ")}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {/* Only Super Admin can edit/remove, and cannot edit self */}
                                    {userRole === "super_admin" && admin.user_id !== user?.id && (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setEditingUser(admin);
                                                    setNewRole(admin.role);
                                                    setNewFirstName(admin.profile?.first_name || "");
                                                    setNewLastName(admin.profile?.last_name || "");
                                                }}
                                            >
                                                <Pencil className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminTeam;
