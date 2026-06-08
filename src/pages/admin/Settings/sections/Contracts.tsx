import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, FileText, Plus, Variable, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const Contracts = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('contract_settings' as any)
                .select('*')
                .single() as any);

            if (error && error.code !== 'PGRST116') throw error;
            setSettings(data || { settings: { variables: [] } });
        } catch (error: any) {
            toast.error("Failed to load contract settings: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await (supabase
                .from('contract_settings' as any)
                .upsert({
                    ...settings,
                    updated_at: new Date().toISOString()
                } as any) as any);

            if (error) throw error;
            toast.success("Contract settings updated successfully");
        } catch (error: any) {
            toast.error("Save failed: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const addVariable = () => {
        const newSettings = { ...settings };
        if (!newSettings.settings.variables) newSettings.settings.variables = [];
        newSettings.settings.variables.push({ key: "NEW_VAR", description: "", default_value: "" });
        setSettings(newSettings);
    };

    const removeVariable = (index: number) => {
        const newSettings = { ...settings };
        newSettings.settings.variables.splice(index, 1);
        setSettings(newSettings);
    };

    const updateVariable = (index: number, field: string, value: string) => {
        const newSettings = { ...settings };
        newSettings.settings.variables[index][field] = value;
        setSettings(newSettings);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Contracts & Agreements</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Manage global contract templates, variables, and signing logic.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-9 border-gray-200 text-gray-600 font-bold px-4" asChild>
                        <a href="/admin/legal/agreements">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Manage Templates
                        </a>
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-gray-900 hover:bg-gray-800 h-9 font-bold px-4">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Variable className="h-4 w-4 text-purple-600" />
                            Global Contract Variables
                        </CardTitle>
                        <CardDescription className="text-[11px]">Define keys that can be injected into any contract template.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            {settings?.settings?.variables?.map((variable: any, index: number) => (
                                <div key={index} className="flex gap-3 items-start p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Variable Key</Label>
                                            <Input 
                                                value={variable.key} 
                                                onChange={(e) => updateVariable(index, 'key', e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                                                className="h-8 text-xs font-mono"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Default Value</Label>
                                            <Input 
                                                value={variable.default_value} 
                                                onChange={(e) => updateVariable(index, 'default_value', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Description / Usage Note</Label>
                                            <Input 
                                                value={variable.description} 
                                                onChange={(e) => updateVariable(index, 'description', e.target.value)}
                                                className="h-8 text-xs"
                                                placeholder="e.g. Total buyout amount for full time hire"
                                            />
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                                        onClick={() => removeVariable(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="ghost" className="w-full h-9 border-dashed border-gray-200 text-gray-500 hover:text-gray-900" onClick={addVariable}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Custom Variable
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            Signing Policies
                        </CardTitle>
                        <CardDescription className="text-[11px]">Execution logic for contract workflows.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Auto-Expiry Period (Days)</Label>
                                <Input 
                                    type="number"
                                    value={settings?.settings?.auto_expiry_days || 7}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        settings: { ...settings.settings, auto_expiry_days: parseInt(e.target.value) }
                                    })}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Contract Prefix (ID)</Label>
                                <Input 
                                    value={settings?.settings?.id_prefix || "AGR"}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        settings: { ...settings.settings, id_prefix: e.target.value }
                                    })}
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Contracts;
