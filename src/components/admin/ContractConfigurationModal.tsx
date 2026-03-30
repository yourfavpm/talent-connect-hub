import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateClientContractTerms } from "@/utils/contractGeneration";

interface ContractConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (config: any) => Promise<void>;
    offer: any;
    loading?: boolean;
}

export const ContractConfigurationModal = ({
    isOpen,
    onClose,
    onConfirm,
    offer,
    loading
}: ContractConfigModalProps) => {
    const [serviceModel, setServiceModel] = useState("full_time");
    // Financials
    const [clientRate, setClientRate] = useState(0); // Hourly or Fixed Total
    const [margin, setMargin] = useState(20); // Default 20%
    // Billing
    const [billingFreq, setBillingFreq] = useState("bi-weekly");
    const [billingCycle, setBillingCycle] = useState("Start/End of Month");
    const [billingDay, setBillingDay] = useState("25th"); // For monthly
    const [projectType, setProjectType] = useState("hourly");

    // Generated Terms
    const [terms, setTerms] = useState("");

    const talentRate = (clientRate * (1 - margin / 100)).toFixed(2);

    useEffect(() => {
        if (offer) {
            setClientRate(offer.hourly_rate || 0);
            setServiceModel("trial_to_hire");
            if (offer.hourly_rate > 10000) setServiceModel("direct_hire");
        }
    }, [offer]);

    useEffect(() => {
        generateTerms();
    }, [serviceModel, clientRate, margin, billingFreq, billingCycle, billingDay, projectType, offer]);

    const generateTerms = () => {
        if (!offer) return;
        const text = generateClientContractTerms(
            serviceModel,
            offer,
            clientRate,
            margin,
            billingFreq,
            billingCycle,
            billingDay,
            projectType
        );
        setTerms(text);
    };

    const handleSubmit = () => {
        onConfirm({
            serviceModel,
            contractTerms: terms,
            billingDetails: {
                frequency: billingFreq,
                cycle: billingCycle,
                day: billingDay,
                margin: margin,
                clientRate: clientRate,
                talentRate: parseFloat(talentRate)
            }
        });
    };
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Configure Contract</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Service Model Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Service Model</Label>
                            <Select value={serviceModel} onValueChange={setServiceModel}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="trial_to_hire">Trial-to-Hire</SelectItem>
                                    <SelectItem value="direct_hire">Direct Hire</SelectItem>
                                    <SelectItem value="one_time_project">One-Time Project</SelectItem>
                                    <SelectItem value="monthly_retainer">Monthly Retainer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Financials & Margin */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                            <Label>{serviceModel === 'direct_hire' ? 'Annual Salary' : 'Client Rate'} ($)</Label>
                            <Input type="number" value={clientRate} onChange={e => setClientRate(Number(e.target.value))} />
                        </div>
                        <div>
                            <Label>Margin / Fee (%)</Label>
                            <Input type="number" value={margin} onChange={e => setMargin(Number(e.target.value))} />
                        </div>
                        <div>
                            <Label>Talent Rate (Payout)</Label>
                            <div className="h-10 px-3 py-2 bg-background border rounded-md text-muted-foreground flex items-center shadow-sm">
                                ${talentRate}
                            </div>
                        </div>
                        <div className="col-span-3 text-xs text-muted-foreground text-right">
                            OPSlyHR Revenue: ${(clientRate - parseFloat(talentRate)).toFixed(2)} per unit
                        </div>
                    </div>

                    {serviceModel === "trial_to_hire" && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                                <Label>Billing Frequency</Label>
                                <Select value={billingFreq} onValueChange={setBillingFreq}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Weekly">Weekly</SelectItem>
                                        <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                                        <SelectItem value="Monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Billing Period / Cycle</Label>
                                <Input value={billingCycle} onChange={e => setBillingCycle(e.target.value)} placeholder="e.g. 1st - 30th, billed on 5th" />
                            </div>
                        </div>
                    )}

                    {serviceModel === "monthly_retainer" && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                                <Label>Invoice Date</Label>
                                <Select value={billingDay} onValueChange={setBillingDay}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1st">1st of Month</SelectItem>
                                        <SelectItem value="15th">15th of Month</SelectItem>
                                        <SelectItem value="25th">25th of Month</SelectItem>
                                        <SelectItem value="last">Last Day of Month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {serviceModel === "one_time_project" && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                                <Label>Payment Structure</Label>
                                <Select value={projectType} onValueChange={setProjectType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                                        <SelectItem value="fixed">Fixed Price</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {projectType === 'hourly' && (
                                <div>
                                    <Label>Billing Frequency</Label>
                                    <Select value={billingFreq} onValueChange={setBillingFreq}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                                            <SelectItem value="Milestone">Milestone Based</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Terms Preview */}
                    <div>
                        <Label>Contract Terms (Editable)</Label>
                        <Textarea
                            className="h-48 font-mono text-sm"
                            value={terms}
                            onChange={e => setTerms(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">This text will be visible to the client.</p>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Generating...' : 'Generate & Send'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
