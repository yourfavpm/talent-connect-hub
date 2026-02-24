import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, Banknote, Calendar, Receipt, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { FinanceSettings } from "@/types/settings";

const Finance = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<FinanceSettings | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('finance_settings' as any)
                .select('*')
                .single() as any);

            if (error && error.code !== 'PGRST116') throw error;
            setSettings(data);
        } catch (error: any) {
            toast.error("Failed to load finance settings: " + error.message);
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
                .from('finance_settings' as any)
                .upsert({
                    ...settings,
                    updated_at: new Date().toISOString()
                } as any) as any);

            if (error) throw error;
            toast.success("Finance settings updated successfully");
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
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Finance & Payouts</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Control invoicing cycles, payout thresholds, and audit rules.</p>
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
                            <Receipt className="h-4 w-4 text-indigo-600" />
                            Invoicing Configuration
                        </CardTitle>
                        <CardDescription className="text-[11px]">Default terms and numbering for client invoices.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Invoice Prefix</Label>
                                <Input 
                                    value={settings?.invoicing_json?.numbering_scheme?.prefix || "TSK"}
                                    onChange={(e) => setSettings(s => s ? {
                                        ...s, 
                                        invoicing_json: {
                                            ...s.invoicing_json,
                                            numbering_scheme: { ...s.invoicing_json.numbering_scheme, prefix: e.target.value }
                                        }
                                    } : null)}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Payment Due Days</Label>
                                <Input 
                                    type="number"
                                    value={settings?.invoicing_json?.default_due_days || 14}
                                    onChange={(e) => setSettings(s => s ? {
                                        ...s, 
                                        invoicing_json: { ...s.invoicing_json, default_due_days: parseInt(e.target.value) }
                                    } : null)}
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-emerald-600" />
                            Payout Controls
                        </CardTitle>
                        <CardDescription className="text-[11px]">Minimum thresholds and automation for talent payouts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Require Manual Approval</Label>
                                <p className="text-[10px] text-gray-400">All payouts must be reviewed by a Finance Admin.</p>
                            </div>
                            <Switch 
                                checked={settings?.payout_json?.require_approval || false}
                                onCheckedChange={(val) => setSettings(s => s ? {
                                    ...s,
                                    payout_json: { ...s.payout_json, require_approval: val }
                                } : null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Minimum Payout Threshold ($)</Label>
                            <Input 
                                type="number"
                                value={settings?.payout_json?.minimum_threshold || 50}
                                onChange={(e) => setSettings(s => s ? {
                                    ...s,
                                    payout_json: { ...s.payout_json, minimum_threshold: parseInt(e.target.value) }
                                } : null)}
                                className="h-9 text-sm max-w-[150px]"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
};

export default Finance;
