import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Save, 
    Loader2, 
    Calculator, 
    Percent, 
    Zap, 
    Clock, 
    ArrowRightLeft,
    ShieldAlert
} from "lucide-react";
import { 
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { PricingRule, ServiceType } from "@/types/settings";

const ServiceModels = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [rules, setRules] = useState<PricingRule[]>([]);
    
    // Preview state
    const [previewAmount, setPreviewAmount] = useState<number>(5000);
    const [activeTab, setActiveTab] = useState<string>("direct_hire");

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('pricing_rules' as any)
                .select('*')
                .eq('is_active', true) as any);

            if (error) throw error;
            setRules(data || []);
        } catch (error: any) {
            toast.error("Failed to load pricing rules: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getRuleValue = (type: string, key: string) => {
        const rule = rules.find(r => r.service_type === type && r.rule_key === key);
        return rule ? rule.value_json : "";
    };

    const handleRuleChange = (type: string, key: string, value: string) => {
        setRules(prev => {
            const index = prev.findIndex(r => r.service_type === type && r.rule_key === key);
            if (index !== -1) {
                const newRules = [...prev];
                newRules[index] = { ...newRules[index], value_json: value };
                return newRules;
            } else {
                return [...prev, { service_type: type, rule_key: key, value_json: value } as PricingRule];
            }
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // Validation: Margin + Payout = 100 for Trial-to-Hire
            const tthMargin = parseFloat(getRuleValue('trial_to_hire', 'margin_pct') || "0");
            const tthPayout = parseFloat(getRuleValue('trial_to_hire', 'payout_pct') || "0");
            
            if (activeTab === 'trial_to_hire' && (tthMargin + tthPayout !== 100)) {
                toast.error("Operational Margin + Talent Payout must equal 100%");
                return;
            }

            const { error } = await (supabase
                .from('pricing_rules' as any)
                .upsert(rules.map(r => ({
                    ...r,
                    updated_at: new Date().toISOString()
                })) as any) as any);

            if (error) throw error;
            toast.success("Pricing rules updated successfully");
        } catch (error: any) {
            toast.error("Save failed: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Calculation logic for preview
    const calculatePreview = () => {
        const amount = previewAmount;
        if (activeTab === 'direct_hire') {
            const pct = parseFloat(getRuleValue('direct_hire', 'buyout_pct') || "0");
            const buyout = (amount * pct) / 100;
            return { label: "Buyout Fee", value: buyout, total: amount + buyout };
        } else if (activeTab === 'trial_to_hire') {
            const marginPct = parseFloat(getRuleValue('trial_to_hire', 'margin_pct') || "0");
            const payoutPct = parseFloat(getRuleValue('trial_to_hire', 'payout_pct') || "0");
            return { 
                margin: (amount * marginPct) / 100, 
                payout: (amount * payoutPct) / 100,
                total: amount 
            };
        }
        return null;
    };

    if (loading) return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
    );

    const previewData = calculatePreview();

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Service Models & Pricing</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Configure margins, buyout fees, and payout splits.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="h-9 border-gray-200 text-gray-600 font-bold px-4">
                                <Calculator className="h-4 w-4 mr-2" />
                                Preview Calculation
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px]">
                            <SheetHeader>
                                <SheetTitle>Pricing Simulator</SheetTitle>
                                <SheetDescription>
                                    See how your current rules affect billing for {activeTab.replace(/_/g, ' ')}.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Sample Billing Amount ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={previewAmount} 
                                        onChange={(e) => setPreviewAmount(parseFloat(e.target.value))}
                                        className="h-10 text-lg font-mono"
                                    />
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-100">
                                    {activeTab === 'direct_hire' && (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Base Salary</span>
                                                <span className="font-mono font-bold">${previewAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-blue-600 font-bold">
                                                <span>Buyout Fee ({getRuleValue('direct_hire', 'buyout_pct')}%)</span>
                                                <span className="font-mono">${(previewData as any)?.value.toLocaleString()}</span>
                                            </div>
                                            <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                                                <span>Total Client Billing</span>
                                                <span className="font-mono">${(previewData as any)?.total.toLocaleString()}</span>
                                            </div>
                                        </>
                                    )}
                                    {activeTab === 'trial_to_hire' && (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Total Invoiced</span>
                                                <span className="font-mono font-bold">${previewAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-emerald-600 font-bold">
                                                <span>Talent Payout ({getRuleValue('trial_to_hire', 'payout_pct')}%)</span>
                                                <span className="font-mono">${(previewData as any)?.payout.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-orange-600 font-bold">
                                                <span>Operational Margin ({getRuleValue('trial_to_hire', 'margin_pct')}%)</span>
                                                <span className="font-mono">${(previewData as any)?.margin.toLocaleString()}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <p className="text-[10px] text-gray-400 italic">
                                    * This is a simulation based on current configuration. Taxes and regional levies not included.
                                </p>
                            </div>
                        </SheetContent>
                    </Sheet>
                    
                    <Button onClick={handleSave} disabled={saving} className="bg-gray-900 hover:bg-gray-800 h-9 font-bold px-4">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-gray-100/50 p-1">
                    <TabsTrigger value="direct_hire" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-8 text-xs font-bold uppercase tracking-wider">
                        Direct Hire
                    </TabsTrigger>
                    <TabsTrigger value="trial_to_hire" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-8 text-xs font-bold uppercase tracking-wider">
                        Trial-to-Hire
                    </TabsTrigger>
                    <TabsTrigger value="one_time" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 h-8 text-xs font-bold uppercase tracking-wider">
                        One-Time Project
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="direct_hire" className="space-y-6 animate-in fade-in-50 duration-300">
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Zap className="h-4 w-4 text-yellow-500" />
                                Direct Placement Rules
                            </CardTitle>
                            <CardDescription className="text-[11px]">Fees paid once when a talent is hired directly.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="max-w-xs space-y-2">
                                <Label htmlFor="buyout_pct" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Buyout Percentage (%)</Label>
                                <div className="relative">
                                    <Input 
                                        id="buyout_pct" 
                                        type="number"
                                        value={getRuleValue('direct_hire', 'buyout_pct')}
                                        onChange={(e) => handleRuleChange('direct_hire', 'buyout_pct', e.target.value)}
                                        className="h-9 pr-8"
                                    />
                                    <Percent className="h-3 w-3 absolute right-3 top-3 text-gray-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trial_to_hire" className="space-y-6 animate-in fade-in-50 duration-300">
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                Managed Payroll & Splits
                            </CardTitle>
                            <CardDescription className="text-[11px]">Configure how the client bill is split between Taskive and the Talent.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label htmlFor="margin_pct" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Operational Margin (%)</Label>
                                    <div className="relative">
                                        <Input 
                                            id="margin_pct" 
                                            type="number"
                                            value={getRuleValue('trial_to_hire', 'margin_pct')}
                                            onChange={(e) => handleRuleChange('trial_to_hire', 'margin_pct', e.target.value)}
                                            className="h-9 pr-8"
                                        />
                                        <Percent className="h-3 w-3 absolute right-3 top-3 text-gray-400" />
                                    </div>
                                    <p className="text-[10px] text-gray-400">Taskive's share of the billing.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payout_pct" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Talent Payout (%)</Label>
                                    <div className="relative">
                                        <Input 
                                            id="payout_pct" 
                                            type="number"
                                            value={getRuleValue('trial_to_hire', 'payout_pct')}
                                            onChange={(e) => handleRuleChange('trial_to_hire', 'payout_pct', e.target.value)}
                                            className="h-9 pr-8"
                                        />
                                        <Percent className="h-3 w-3 absolute right-3 top-3 text-gray-400" />
                                    </div>
                                    <p className="text-[10px] text-gray-400">What the professional actually receives.</p>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-md flex gap-3 text-blue-800">
                                <ShieldAlert className="h-5 w-5 shrink-0" />
                                <div className="text-[11px] leading-relaxed">
                                    <p className="font-bold uppercase tracking-wider mb-1">Strict Balancing Rule</p>
                                    Operational Margin + Talent Payout must equal exactly 100%. If set otherwise, invoices will fail to generate.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="one_time" className="space-y-6 animate-in fade-in-50 duration-300">
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Percent className="h-4 w-4 text-emerald-500" />
                                Project Fee Rules
                            </CardTitle>
                            <CardDescription className="text-[11px]">Configurations for milestone-based project billing.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-xs space-y-2">
                                <Label htmlFor="project_margin" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Fixed Margin (%)</Label>
                                <div className="relative">
                                    <Input 
                                        id="project_margin" 
                                        type="number"
                                        value={getRuleValue('one_time', 'margin_pct')}
                                        onChange={(e) => handleRuleChange('one_time', 'margin_pct', e.target.value)}
                                        className="h-9 pr-8"
                                    />
                                    <Percent className="h-3 w-3 absolute right-3 top-3 text-gray-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ServiceModels;
