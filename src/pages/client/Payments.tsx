import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, ShieldCheck } from "lucide-react";

const ClientPayments = () => {
    // This page normally would hold Stripe stored payment methods.
    // For now, based on User Request: "Wipe every detail... to only reflect payment from active contracts"
    // We will show a summary of "Billing Sources" which are the Active Contracts.

    const [activeContracts, setActiveContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBilling = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get Client ID
            const { data: client } = await supabase.from('clients').select('id').eq('user_id', user.id).maybeSingle();
            if (!client) return;

            const { data } = await supabase.from('contracts')
                .select(`
                    id, contract_number, 
                    role_title, 
                    client_gross_rate, 
                    billing_frequency,
                    compensation_type,
                    talents(first_name, last_name)
                `)
                .eq('client_id', client.id)
                .eq('status', 'active');

            setActiveContracts(data || []);
            setLoading(false);
        };
        fetchBilling();
    }, []);

    return (
        <div className="w-full max-w-none space-y-6 animate-fade-in px-4 md:px-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Payments & Billing</h1>
                    <p className="text-muted-foreground">Manage your billing sources and active engagements</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Active Billing Sources (Contracts) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Active Billing Sources
                        </CardTitle>
                        <CardDescription>Contracts currently generating invoices</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? <p>Loading...</p> : activeContracts.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No active contracts found.</p>
                        ) : (
                            activeContracts.map((c: any) => (
                                <div key={c.id} className="flex items-center justify-between p-4 border rounded-xl bg-card/50">
                                    <div>
                                        <div className="font-semibold">{c.role_title}</div>
                                        <div className="text-xs text-muted-foreground">{c.talents?.first_name} {c.talents?.last_name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-sm font-bold">${c.client_gross_rate}/{c.compensation_type === 'monthly' ? 'mo' : 'hr'}</div>
                                        <div className="text-[10px] text-muted-foreground capitalize">{c.billing_frequency} Billing</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Billing Settings / Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-emerald-600" />
                            Billing Information
                        </CardTitle>
                        <CardDescription>Your registered billing address</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/30 rounded-lg space-y-1">
                            <p className="font-medium">OpslyHR Tech Inc.</p>
                            <p className="text-sm text-muted-foreground">123 Tech Boulevard</p>
                            <p className="text-sm text-muted-foreground">San Francisco, CA 94107</p>
                            <p className="text-sm text-muted-foreground">United States</p>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2">
                            <span className="text-muted-foreground">Tax ID</span>
                            <span className="font-mono">US-99-9999999</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ClientPayments;
