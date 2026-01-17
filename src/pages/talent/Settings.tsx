import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
    Settings as SettingsIcon,
    Lock,
    Bell,
    LogOut,
    Shield,
    Eye,
    EyeOff,
    Check
} from "lucide-react";

const TalentSettings = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: "",
    });

    const [notifications, setNotifications] = useState({
        email_job_updates: true,
        email_application_status: true,
        email_timesheet_reminders: true,
        email_messages: true,
        push_notifications: true,
    });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.new !== passwords.confirm) {
            toast({
                title: "Error",
                description: "New passwords do not match",
                variant: "destructive",
            });
            return;
        }

        if (passwords.new.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.new,
            });

            if (error) throw error;

            toast({
                title: "Password Updated",
                description: "Your password has been changed successfully",
            });

            setPasswords({ current: "", new: "", confirm: "" });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update password",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogoutAll = async () => {
        try {
            await signOut();
            navigate("/auth/login?portal=talent");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to logout",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 p-8 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <SettingsIcon className="h-6 w-6" />
                        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
                    </div>
                    <p className="text-white/80">Manage your account preferences and security</p>
                </div>
            </div>

            {/* Security Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-accent" />
                        Security
                    </CardTitle>
                    <CardDescription>Update your password and security settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPasswords ? "text" : "password"}
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                    placeholder="Enter current password"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input
                                    type={showPasswords ? "text" : "password"}
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm New Password</Label>
                                <Input
                                    type={showPasswords ? "text" : "password"}
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                checked={showPasswords}
                                onCheckedChange={setShowPasswords}
                                id="show-passwords"
                            />
                            <Label htmlFor="show-passwords" className="text-sm text-muted-foreground cursor-pointer">
                                Show passwords
                            </Label>
                        </div>

                        <Button type="submit" disabled={loading}>
                            <Shield className="h-4 w-4 mr-2" />
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-accent" />
                        Notifications
                    </CardTitle>
                    <CardDescription>Choose what notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { key: "email_job_updates", label: "Job Updates", description: "New jobs matching your profile" },
                        { key: "email_application_status", label: "Application Status", description: "Updates on your job applications" },
                        { key: "email_timesheet_reminders", label: "Timesheet Reminders", description: "Weekly reminders to submit timesheets" },
                        { key: "email_messages", label: "Messages", description: "New messages from administrators" },
                        { key: "push_notifications", label: "Push Notifications", description: "In-app notifications" },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium">{item.label}</p>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Switch
                                checked={notifications[item.key as keyof typeof notifications]}
                                onCheckedChange={(checked) =>
                                    setNotifications({ ...notifications, [item.key]: checked })
                                }
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Account Section */}
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <LogOut className="h-5 w-5" />
                        Session Management
                    </CardTitle>
                    <CardDescription>Manage your active sessions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                        <p className="text-sm text-red-700 mb-4">
                            This will log you out from all devices and sessions. You'll need to log in again.
                        </p>
                        <Button variant="destructive" onClick={handleLogoutAll}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout from All Sessions
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-accent text-white">
                            <Check className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-medium">Account Email</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TalentSettings;
