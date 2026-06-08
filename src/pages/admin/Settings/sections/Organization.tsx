import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, Building2, MapPin, Globe, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { OrganizationSettings } from "@/types/settings";

const Organization = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<OrganizationSettings | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('organization_settings' as any)
                .select('*')
                .single() as any);

            if (error && error.code !== 'PGRST116') throw error;
            setSettings(data as OrganizationSettings);
        } catch (error: unknown) {
            toast.error("Failed to load settings: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        try {
            setSaving(true);
            const { error } = await supabase
                .from('organization_settings' as any)
                .upsert({
                    ...settings,
                    updated_at: new Date().toISOString()
                } as any);

            if (error) throw error;
            toast.success("Organization settings updated successfully");
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
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Organization Profile</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Manage your company legal identity and operational defaults.</p>
                </div>
                <Button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-800 h-9 font-bold px-4">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Identity Card */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            Company Identity
                        </CardTitle>
                        <CardDescription className="text-[11px]">Registered legal entities and display names.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="legal_name" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Legal Business Name</Label>
                                <Input 
                                    id="legal_name" 
                                    value={settings?.legal_name || ""} 
                                    onChange={(e) => setSettings(s => s ? {...s, legal_name: e.target.value} : null)}
                                    placeholder="e.g. OpslyHR Connect Ltd"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="display_name" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Public Display Name</Label>
                                <Input 
                                    id="display_name" 
                                    value={settings?.display_name || ""} 
                                    onChange={(e) => setSettings(s => s ? {...s, display_name: e.target.value} : null)}
                                    placeholder="e.g. OpslyHR Connect"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="registration_number" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Business Registration Number</Label>
                            <Input 
                                id="registration_number" 
                                value={settings?.registration_number || ""} 
                                onChange={(e) => setSettings(s => s ? {...s, registration_number: e.target.value} : null)}
                                placeholder="e.g. RC1234567"
                                className="h-9 text-sm max-w-md"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Operations Card */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Globe className="h-4 w-4 text-emerald-600" />
                            Regional & Operational Defaults
                        </CardTitle>
                        <CardDescription className="text-[11px]">Configure how the platform behaves by default.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="default_currency" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Primary Currency</Label>
                                <Input 
                                    id="default_currency" 
                                    value={settings?.default_currency || "USD"} 
                                    onChange={(e) => setSettings(s => s ? {...s, default_currency: e.target.value} : null)}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="default_timezone" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Default Timezone</Label>
                                <Input 
                                    id="default_timezone" 
                                    value={settings?.default_timezone || "UTC"} 
                                    onChange={(e) => setSettings(s => s ? {...s, default_timezone: e.target.value} : null)}
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Card */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-orange-600" />
                            Contact & Support
                        </CardTitle>
                        <CardDescription className="text-[11px]">Emails used for automated correspondence.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="support_email" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Support Email</Label>
                                <Input 
                                    id="support_email" 
                                    type="email"
                                    value={settings?.support_email || ""} 
                                    onChange={(e) => setSettings(s => s ? {...s, support_email: e.target.value} : null)}
                                    placeholder="support@opslyhr.connect"
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="finance_email" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Finance & Billing Email</Label>
                                <Input 
                                    id="finance_email" 
                                    type="email"
                                    value={settings?.finance_email || ""} 
                                    onChange={(e) => setSettings(s => s ? {...s, finance_email: e.target.value} : null)}
                                    placeholder="finance@opslyhr.connect"
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="office_address" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Headquarters Address</Label>
                            <Input 
                                id="office_address" 
                                value={settings?.office_address || ""} 
                                onChange={(e) => setSettings(s => s ? {...s, office_address: e.target.value} : null)}
                                placeholder="Street address, City, Country"
                                className="h-9 text-sm"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {settings?.updated_at && (
                <div className="pt-4 border-t border-gray-50 flex justify-end">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
                        Last modified: {new Date(settings.updated_at).toLocaleString()}
                    </p>
                </div>
            )}
        </form>
    );
};

export default Organization;
