import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, Palette, Upload, Image as ImageIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { BrandingSettings } from "@/types/settings";

const Branding = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<BrandingSettings | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('branding_settings' as any)
                .select('*')
                .single() as any);

            if (error && error.code !== 'PGRST116') throw error;
            setSettings(data);
        } catch (error: any) {
            toast.error("Failed to load branding settings: " + error.message);
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
                .from('branding_settings' as any)
                .upsert({
                    ...settings,
                    updated_at: new Date().toISOString()
                } as any) as any);

            if (error) throw error;
            toast.success("Branding settings updated successfully");
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
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Branding & Identity</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Customize the platform's appearance to match your organization's brand.</p>
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
                            <ImageIcon className="h-4 w-4 text-blue-600" />
                            Logo & Assets
                        </CardTitle>
                        <CardDescription className="text-[11px]">Upload and manage your organization's visual assets.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-start gap-8">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Primary Logo</Label>
                                <div className="h-32 w-48 border-2 border-dashed border-gray-100 rounded-lg flex flex-col items-center justify-center bg-gray-50/50 group relative overflow-hidden transition-colors hover:border-blue-200">
                                    {settings?.theme_json?.logo_url ? (
                                        <img src={settings.theme_json.logo_url} alt="Logo" className="max-h-[80%] max-w-[80%] object-contain" />
                                    ) : (
                                        <>
                                            <Upload className="h-6 w-6 text-gray-300 mb-2" />
                                            <span className="text-[10px] text-gray-400 font-medium">SVG or PNG</span>
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button type="button" variant="secondary" size="sm" className="h-7 text-[10px] font-bold">Change Image</Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Logo Alt Text</Label>
                                    <Input 
                                        value={settings?.theme_json?.logo_alt || ""}
                                        onChange={(e) => setSettings(s => s ? {
                                            ...s,
                                            theme_json: { ...s.theme_json, logo_alt: e.target.value }
                                        } : null)}
                                        className="h-9 text-sm"
                                        placeholder="e.g. OPSlyHR Connect Logo"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Favicon URL</Label>
                                    <Input 
                                        value={settings?.theme_json?.favicon_url || ""}
                                        onChange={(e) => setSettings(s => s ? {
                                            ...s,
                                            theme_json: { ...s.theme_json, favicon_url: e.target.value }
                                        } : null)}
                                        className="h-9 text-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Palette className="h-4 w-4 text-emerald-600" />
                            Color System
                        </CardTitle>
                        <CardDescription className="text-[11px]">Define the primary and secondary colors used throughout the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Primary Color (Hex)</Label>
                                <div className="flex gap-3">
                                    <div 
                                        className="h-9 w-9 rounded border border-gray-200" 
                                        style={{ backgroundColor: settings?.theme_json?.colors?.primary || "#000000" }}
                                    />
                                    <Input 
                                        value={settings?.theme_json?.colors?.primary || "#000000"}
                                        onChange={(e) => setSettings(s => s ? {
                                            ...s,
                                            theme_json: { 
                                                ...s.theme_json, 
                                                colors: { ...s.theme_json.colors, primary: e.target.value } 
                                            }
                                        } : null)}
                                        className="h-9 font-mono text-sm uppercase"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Accent Color (Hex)</Label>
                                <div className="flex gap-3">
                                    <div 
                                        className="h-9 w-9 rounded border border-gray-200" 
                                        style={{ backgroundColor: settings?.theme_json?.colors?.accent || "#3b82f6" }}
                                    />
                                    <Input 
                                        value={settings?.theme_json?.colors?.accent || "#3b82f6"}
                                        onChange={(e) => setSettings(s => s ? {
                                            ...s,
                                            theme_json: { 
                                                ...s.theme_json, 
                                                colors: { ...s.theme_json.colors, accent: e.target.value } 
                                            }
                                        } : null)}
                                        className="h-9 font-mono text-sm uppercase"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
};

export default Branding;
