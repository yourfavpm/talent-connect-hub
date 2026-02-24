import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, Database, ShieldAlert, Download, Trash2, FileJson } from "lucide-react";
import { toast } from "sonner";
import { ComplianceSettings } from "@/types/settings";

const Data = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<ComplianceSettings | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('compliance_settings' as any)
                .select('*')
                .single() as any);

            if (error && error.code !== 'PGRST116') throw error;
            setSettings(data);
        } catch (error: any) {
            toast.error("Failed to load compliance settings: " + error.message);
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
                .from('compliance_settings' as any)
                .upsert({
                    ...settings,
                    updated_at: new Date().toISOString()
                } as any) as any);

            if (error) throw error;
            toast.success("Compliance settings updated successfully");
        } catch (error: any) {
            toast.error("Save failed: " + error.message);
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
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Data & Compliance</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Manage data retention, privacy policies, and portability exports.</p>
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
                            <ShieldAlert className="h-4 w-4 text-orange-600" />
                            Data Retention Policies
                        </CardTitle>
                        <CardDescription className="text-[11px]">Control how long various types of data are stored on the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Log Retention (Days)</Label>
                                <Input 
                                    type="number"
                                    value={settings?.retention_json?.logs_days || 90}
                                    onChange={(e) => setSettings(s => s ? {
                                        ...s,
                                        retention_json: { ...s.retention_json, logs_days: parseInt(e.target.value) }
                                    } : null)}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Deleted User Data (Days)</Label>
                                <Input 
                                    type="number"
                                    value={settings?.retention_json?.deleted_users_days || 30}
                                    onChange={(e) => setSettings(s => s ? {
                                        ...s,
                                        retention_json: { ...s.retention_json, deleted_users_days: parseInt(e.target.value) }
                                    } : null)}
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <div className="flex items-center justify-between py-2">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">Automatic Purging</Label>
                                    <p className="text-[10px] text-gray-400">Permanently delete data once it exceeds retention limits.</p>
                                </div>
                                <Switch 
                                    checked={settings?.retention_json?.auto_purge || false}
                                    onCheckedChange={(val) => setSettings(s => s ? {
                                        ...s,
                                        retention_json: { ...s.retention_json, auto_purge: val }
                                    } : null)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Database className="h-4 w-4 text-blue-600" />
                            Data Portability
                        </CardTitle>
                        <CardDescription className="text-[11px]">Generate machine-readable exports of platform configuration and user data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded bg-white shadow-sm flex items-center justify-center">
                                    <FileJson className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900">Full Platform Configuration</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">JSON FORMAT • ALL SETTINGS CATEGORIES</p>
                                </div>
                            </div>
                            <Button type="button" variant="outline" size="sm" className="h-8 text-[11px] font-bold">
                                <Download className="h-3 w-3 mr-2" />
                                Export Settings
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-50 bg-red-50/10 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-900">
                            <Trash2 className="h-4 w-4 text-red-600" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription className="text-[11px] text-red-700/60">Destructive actions for privacy compliance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" size="sm" className="h-8 font-bold text-[11px] uppercase tracking-wider">
                            Initiate GDPR Wipe Flow
                        </Button>
                        <p className="mt-2 text-[10px] text-gray-400 italic">This will guide you through the process of purging specific user clusters.</p>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
};

export default Data;
