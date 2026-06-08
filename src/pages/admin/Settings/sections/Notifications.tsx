import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, Bell, Mail, Smartphone, Info, Search } from "lucide-react";
import { toast } from "sonner";
import { NotificationTemplate } from "@/types/settings";

const Notifications = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('notification_templates' as any)
                .select('*') as any);

            if (error) throw error;
            setTemplates(data || []);
            if (data?.length > 0) setSelectedKey(data[0].template_key);
        } catch (error: any) {
            toast.error("Failed to load templates: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const template = templates.find(t => t.template_key === selectedKey);
        if (!template) return;

        try {
            setSaving(true);
            const { error } = await (supabase
                .from('notification_templates' as any)
                .upsert({
                    ...template,
                    updated_at: new Date().toISOString()
                } as any) as any);

            if (error) throw error;
            toast.success("Template updated successfully");
        } catch (error: any) {
            toast.error("Save failed: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const updateCurrentTemplate = (field: keyof NotificationTemplate, value: string) => {
        setTemplates(prev => prev.map(t => 
            t.template_key === selectedKey ? { ...t, [field]: value } : t
        ));
    };

    const currentTemplate = templates.find(t => t.template_key === selectedKey);
    const filteredTemplates = templates.filter(t => 
        t.template_key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Notification Templates</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Customize email and in-app communications sent by the platform.</p>
                </div>
                <Button onClick={handleSave} disabled={saving || !selectedKey} className="bg-gray-900 hover:bg-gray-800 h-9 font-bold px-4">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Template
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6 h-[600px]">
                {/* template list */}
                <div className="col-span-4 border rounded-lg overflow-hidden flex flex-col bg-white">
                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                            <Input 
                                placeholder="Search templates..." 
                                className="pl-9 h-9 text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredTemplates.map((template) => (
                            <button
                                key={template.template_key}
                                onClick={() => setSelectedKey(template.template_key)}
                                className={`w-full text-left p-3 border-b border-gray-50 transition-colors ${
                                    selectedKey === template.template_key ? "bg-blue-50/50" : "hover:bg-gray-50"
                                }`}
                            >
                                <div className="text-xs font-bold text-gray-900 uppercase tracking-wider truncate">
                                    {template.template_key.replace(/_/g, ' ')}
                                </div>
                                <div className="text-[10px] text-gray-500 truncate mt-0.5">
                                    {template.subject || "No subject set"}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* editor */}
                <div className="col-span-8 space-y-4">
                    {!selectedKey ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 italic">
                            <Info className="h-8 w-8 mb-2 opacity-20" />
                            Select a template to edit
                        </div>
                    ) : (
                        <Card className="border-gray-100 shadow-sm h-full flex flex-col">
                            <CardHeader className="pb-3 shrink-0">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-600" />
                                    Editing: {selectedKey.replace(/_/g, ' ')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-1 overflow-y-auto pb-6">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Subject Line</Label>
                                    <Input 
                                        value={currentTemplate?.subject || ""} 
                                        onChange={(e) => updateCurrentTemplate('subject', e.target.value)}
                                        className="h-9 text-sm"
                                        placeholder="e.g. Action Required: Your OpslyHR Account"
                                    />
                                </div>
                                <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Body Content (HTML)</Label>
                                        <div className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded cursor-help" title="Use {{variable_name}} for dynamic tags">
                                            Variables allowed
                                        </div>
                                    </div>
                                    <Textarea 
                                        value={currentTemplate?.body_html || ""} 
                                        onChange={(e) => updateCurrentTemplate('body_html', e.target.value)}
                                        className="flex-1 text-sm font-mono resize-none border-gray-100"
                                        placeholder="<html>...</html>"
                                    />
                                </div>
                                <div className="p-3 bg-yellow-50/50 border border-yellow-100 rounded text-[10px] text-yellow-800 leading-relaxed italic">
                                    <Info className="h-3 w-3 inline mr-1" />
                                    Tip: Use double curly braces like {"{{user_name}}"} to inject dynamic data from the application context.
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
