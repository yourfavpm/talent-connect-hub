import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, ShieldCheck, Lock, Key, Smartphone, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { SecuritySettings } from "@/types/settings";

const Security = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SecuritySettings | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('security_settings' as any)
                .select('*')
                .single() as any);

            if (error && error.code !== 'PGRST116') throw error;
            setSettings(data);
        } catch (error: unknown) {
            toast.error("Failed to load security settings: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        try {
            setSaving(true);
            const { error } = await (supabase
                .from('security_settings' as any)
                .upsert({
                    ...settings,
                    updated_at: new Date().toISOString()
                } as any) as any);

            if (error) throw error;
            toast.success("Security settings updated successfully");
        } catch (error: unknown) {
            toast.error("Save failed: " + (error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
    );

    return (
        <form onSubmit={handleSave} className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Security & Access</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Define platform-wide authentication and session policies.</p>
                </div>
                <Button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-800 h-9 font-bold px-4">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6">
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-blue-600" />
                            Multi-Factor Authentication
                        </CardTitle>
                        <CardDescription className="text-[11px]">Enforce additional security layers for administrative accounts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Require 2FA for all Administrators</Label>
                                <p className="text-[10px] text-gray-400">Forces 2FA setup upon next login for all admin team members.</p>
                            </div>
                            <Switch 
                                checked={settings?.config_json?.require_2fa_admins || false}
                                onCheckedChange={(val) => setSettings(s => s ? {
                                    ...s,
                                    config_json: { ...s.config_json, require_2fa_admins: val }
                                } : null)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            Session Management
                        </CardTitle>
                        <CardDescription className="text-[11px]">Control how long administrative sessions remain active.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Session Duration (Hours)</Label>
                            <Input 
                                type="number"
                                value={settings?.config_json?.session_duration_hours || 24}
                                onChange={(e) => setSettings(s => s ? {
                                    ...s,
                                    config_json: { ...s.config_json, session_duration_hours: parseInt(e.target.value) }
                                } : null)}
                                className="h-9 text-sm max-w-[150px]"
                            />
                            <p className="text-[10px] text-gray-400 italic">Administrators will be logged out automatically after this period of inactivity.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-50 bg-red-50/10 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-900">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            Critical Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" size="sm" className="h-8 font-bold text-[11px] uppercase tracking-wider">
                            Force Logout All Sessions
                        </Button>
                        <p className="mt-2 text-[10px] text-gray-400">This will invalidate all current administrative sessions across the platform.</p>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
};

export default Security;
