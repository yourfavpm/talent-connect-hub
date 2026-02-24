import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, GitBranch, CheckCircle2, UserCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { WorkflowSettings } from "@/types/settings";

const Workflows = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<WorkflowSettings[]>([]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('workflow_settings' as any)
                .select('*') as any);

            if (error) throw error;
            setSettings(data || []);
        } catch (error: any) {
            toast.error("Failed to load workflow settings: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getWorkflowConfig = (key: string) => {
        const wf = settings.find(w => w.workflow_key === key);
        return wf?.config_json || {};
    };

    const handleToggle = (key: string, field: string, value: boolean) => {
        setSettings(prev => {
            const index = prev.findIndex(w => w.workflow_key === key);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = { 
                    ...updated[index], 
                    config_json: { ...updated[index].config_json, [field]: value }
                };
                return updated;
            } else {
                return [...prev, { workflow_key: key, config_json: { [field]: value } } as WorkflowSettings];
            }
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { error } = await (supabase
                .from('workflow_settings' as any)
                .upsert(settings.map(s => ({
                    ...s,
                    updated_at: new Date().toISOString()
                } as any)) as any) as any);

            if (error) throw error;
            toast.success("Workflow settings updated successfully");
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
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Workflows & Automation</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Define operational guardrails and automated approval rules.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-gray-900 hover:bg-gray-800 h-9 font-bold px-4">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6">
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Job Post Workflows
                        </CardTitle>
                        <CardDescription className="text-[11px]">Control how job posts are reviewed and published.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-50 pb-4">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Require Admin Approval</Label>
                                <p className="text-[10px] text-gray-400">All client-created jobs must be approved by an Admin before going live.</p>
                            </div>
                            <Switch 
                                checked={getWorkflowConfig('job_posting').require_approval || false}
                                onCheckedChange={(val) => handleToggle('job_posting', 'require_approval', val)}
                            />
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Auto-Archive Inactive Jobs</Label>
                                <p className="text-[10px] text-gray-400">Automatically archive jobs with no activity for 30 days.</p>
                            </div>
                            <Switch 
                                checked={getWorkflowConfig('job_posting').auto_archive || false}
                                onCheckedChange={(val) => handleToggle('job_posting', 'auto_archive', val)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-emerald-600" />
                            Vetting & Onboarding
                        </CardTitle>
                        <CardDescription className="text-[11px]">Configurations for talent verification processes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-50 pb-4">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Background Check Mandatory</Label>
                                <p className="text-[10px] text-gray-400">Force background check completion before any contract can be signed.</p>
                            </div>
                            <Switch 
                                checked={getWorkflowConfig('vetting').force_background_check || false}
                                onCheckedChange={(val) => handleToggle('vetting', 'force_background_check', val)}
                            />
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Enable Self-Vetting Tier</Label>
                                <p className="text-[10px] text-gray-400">Allow talents to complete basic vetting steps without admin intervention.</p>
                            </div>
                            <Switch 
                                checked={getWorkflowConfig('vetting').self_vetting || false}
                                onCheckedChange={(val) => handleToggle('vetting', 'self_vetting', val)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Workflows;
