import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, Link, Shield, ExternalLink, Eye, EyeOff, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { IntegrationSettings } from "@/types/settings";

const Integrations = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [integrations, setIntegrations] = useState<IntegrationSettings[]>([]);
    const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('integration_settings' as any)
                .select('*') as any);

            if (error) throw error;
            setIntegrations(data || []);
        } catch (error: any) {
            toast.error("Failed to load integrations: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (integration: IntegrationSettings) => {
        try {
            const { error } = await (supabase
                .from('integration_settings' as any)
                .upsert({
                    ...integration,
                    updated_at: new Date().toISOString()
                } as any) as any);

            if (error) throw error;
            toast.success(`${integration.provider_name} settings updated`);
        } catch (error: any) {
            toast.error("Save failed: " + error.message);
        }
    };

    const updateConfig = (id: string, key: string, value: string) => {
        setIntegrations(prev => prev.map(i => 
            i.id === id ? { ...i, config_json: { ...i.config_json, [key]: value } } : i
        ));
    };

    const toggleSecret = (id: string, key: string) => {
        const fullKey = `${id}-${key}`;
        setShowSecrets(prev => ({ ...prev, [fullKey]: !prev[fullKey] }));
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
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">External Integrations</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Manage connections to third-party services and secure API keys.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {integrations.map((integration) => (
                    <Card key={integration.id} className="border-gray-100 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4 bg-gray-50/50 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                        <Link className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold">{integration.provider_name}</CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                            {integration.category}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        onClick={() => handleSave(integration)} 
                                        className="h-8 text-[11px] font-bold px-3 bg-gray-900 hover:bg-gray-800"
                                    >
                                        Update {integration.provider_name}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {Object.keys(integration.config_json || {}).map((key) => {
                                const isSecret = key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') || key.toLowerCase().includes('token');
                                const fullKey = `${integration.id}-${key}`;
                                
                                return (
                                    <div key={key} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                {key.replace(/_/g, ' ')}
                                            </Label>
                                            {isSecret && (
                                                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                                    <Shield className="h-3 w-3" />
                                                    Masked Secret
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Input 
                                                type={isSecret && !showSecrets[fullKey] ? "password" : "text"}
                                                value={(integration.config_json as any)[key] || ""}
                                                onChange={(e) => updateConfig(integration.id, key, e.target.value)}
                                                className="h-9 text-sm font-mono"
                                            />
                                            {isSecret && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSecret(integration.id, key)}
                                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showSecrets[fullKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="pt-2 flex gap-4">
                                <Button variant="ghost" className="h-8 text-[11px] font-bold text-gray-500 hover:text-gray-900 px-0">
                                    <RefreshCcw className="h-3 w-3 mr-2" />
                                    Test Connection
                                </Button>
                                <Button variant="ghost" className="h-8 text-[11px] font-bold text-gray-500 hover:text-gray-900 px-0">
                                    <ExternalLink className="h-3 w-3 mr-2" />
                                    View Documentation
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {integrations.length === 0 && (
                    <div className="p-12 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
                        <Link className="h-8 w-8 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No integrations configured yet.</p>
                        <Button variant="outline" className="mt-4 h-8 text-[11px] font-bold border-gray-200">Connect Provider</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Integrations;
