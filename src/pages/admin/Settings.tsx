import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Settings, AlertTriangle, Save, RefreshCw } from "lucide-react";

const AdminSettings = () => {
    const { userRole } = useAuth();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [allowSignup, setAllowSignup] = useState(true);
    const [platformFee, setPlatformFee] = useState("10");

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            toast({
                title: "Settings Saved",
                description: "System settings have been updated.",
            });
        }, 1000);
    };

    if (!userRole || userRole !== "super_admin") {
        return (
            <div className="p-8 text-center text-red-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <h2 className="text-xl font-bold">Access Denied</h2>
                <p>Only Super Admins can access system settings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">System Settings</h1>
                    <p className="text-muted-foreground">Configure global platform parameters</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Platform Configuration
                            </CardTitle>
                            <CardDescription>Manage general system behavior</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Maintenance Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Disable access to the platform for non-admins
                                    </p>
                                </div>
                                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Allow New Signups</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable public registration for talents and clients
                                    </p>
                                </div>
                                <Switch checked={allowSignup} onCheckedChange={setAllowSignup} />
                            </div>
                            <div className="space-y-2">
                                <Label>Default Platform Fee (%)</Label>
                                <Input
                                    type="number"
                                    value={platformFee}
                                    onChange={(e) => setPlatformFee(e.target.value)}
                                    className="max-w-xs"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="roles">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Role-Based Access Control (RBAC)
                            </CardTitle>
                            <CardDescription>View current role definitions (Read-only)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 border rounded-md">
                                        <h4 className="font-bold">Super Admin</h4>
                                        <p className="text-sm text-muted-foreground">Full access to all system resources, settings, and team management.</p>
                                    </div>
                                    <div className="p-4 border rounded-md">
                                        <h4 className="font-bold">Operations Admin</h4>
                                        <p className="text-sm text-muted-foreground">Manage jobs, talents, and clients. No access to financial settings.</p>
                                    </div>
                                    <div className="p-4 border rounded-md">
                                        <h4 className="font-bold">Vetting Admin</h4>
                                        <p className="text-sm text-muted-foreground">Access to talent onboarding and vetting workflows only.</p>
                                    </div>
                                    <div className="p-4 border rounded-md">
                                        <h4 className="font-bold">Finance Admin</h4>
                                        <p className="text-sm text-muted-foreground">Access to invoices, payments, and contracts.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                                <AlertTriangle className="h-4 w-4 inline mr-2" />
                                Sensitive actions require Super Admin authentication.
                            </div>
                            <Button variant="destructive">Reset All Sessions</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminSettings;
