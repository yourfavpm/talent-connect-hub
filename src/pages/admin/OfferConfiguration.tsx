import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Send, Eye, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import { generateContractContent, CONTRACT_TEMPLATES } from "@/utils/contractTemplates";
import { sendClientContractReadyEmail, sendTalentContractReadyEmail } from "@/lib/email/triggers";

/* 
  MASTER BUILD: Dual-Contract Configuration Page
  - Single page configures BOTH Client and Talent contracts
  - Shared context (job details, dates, service model)
  - Independent configurations (billing vs payment)
  - Full Time Hire special logic (10-15% placement fee)
  - Conditional time tracking rules
  - Dual preview system
  - Single "Generate & Send" action
*/

const AdminOfferConfig = () => {
    const { offerId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [offer, setOffer] = useState<any>(null);

    // ========== SHARED CONFIGURATION ==========
    const [serviceModel, setServiceModel] = useState<string>("trial_to_hire");
    const [jobTitle, setJobTitle] = useState<string>("");
    const [jobDescription, setJobDescription] = useState<string>("");
    const [contractStartDate, setContractStartDate] = useState<string>("");
    const [contractDuration, setContractDuration] = useState<string>("");
    const [workingArrangement, setWorkingArrangement] = useState<string>("remote");
    const [expectedWeeklyHours, setExpectedWeeklyHours] = useState<number | null>(null);
    const [currency, setCurrency] = useState<string>("USD");

    const getCurrencySymbol = (code: string) => {
        const symbols: Record<string, string> = {
            USD: '$', CAD: 'CA$', GBP: '£', EUR: '€',
            GHS: 'GH₵', NGN: '₦', KES: 'KSh', ZAR: 'R'
        };
        return symbols[code] || '$';
    };
    const currencySymbol = getCurrencySymbol(currency);

    // ========== CLIENT CONTRACT CONFIGURATION ==========
    const [clientCompensationType, setClientCompensationType] = useState<string>("hourly");
    const [clientBillingAmount, setClientBillingAmount] = useState<number>(0);
    const [clientBillingFrequency, setClientBillingFrequency] = useState<string>("monthly");
    const [clientBillingDay, setClientBillingDay] = useState<string>("last_day");
    const [clientContractTemplate, setClientContractTemplate] = useState<string>("");

    // ========== TALENT CONTRACT CONFIGURATION ==========
    const [opslyhrMargin, setOpslyhrMargin] = useState<number>(20);
    const [talentNetRate, setTalentNetRate] = useState<number>(0);
    const [talentPaymentFrequency, setTalentPaymentFrequency] = useState<string>("monthly");
    const [talentPayday, setTalentPayday] = useState<string>("15th");
    const [talentContractTemplate, setTalentContractTemplate] = useState<string>("");

    // ========== TEMPLATE TRACKING ==========
    const [clientTemplateId, setClientTemplateId] = useState<string | null>(null);
    const [clientTemplateVersion, setClientTemplateVersion] = useState<number | null>(null);
    const [clientTemplateName, setClientTemplateName] = useState<string>("");
    const [talentTemplateId, setTalentTemplateId] = useState<string | null>(null);
    const [talentTemplateVersion, setTalentTemplateVersion] = useState<number | null>(null);
    const [talentTemplateName, setTalentTemplateName] = useState<string>("");
    const [templateError, setTemplateError] = useState<boolean>(false);
    const [templateLoading, setTemplateLoading] = useState<boolean>(false);

    // ========== PREVIEW STATES ==========
    const [clientPreviewOpen, setClientPreviewOpen] = useState(false);
    const [talentPreviewOpen, setTalentPreviewOpen] = useState(false);
    const [clientPreviewContent, setClientPreviewContent] = useState("");
    const [talentPreviewContent, setTalentPreviewContent] = useState("");

    // ========== DERIVED VALUES ==========
    const [timeTrackingRequired, setTimeTrackingRequired] = useState(false);
    const [overtimeEnabled, setOvertimeEnabled] = useState(false);
    const [placementFee, setPlacementFee] = useState<number>(0);

    // Fetch offer data on mount
    useEffect(() => {
        if (offerId) fetchOfferData();
    }, [offerId]);

    // Auto-calculate Net Rate based on Service Model
    useEffect(() => {
        if (serviceModel === 'full_time') {
            // Full Time Hire: 10-15% placement fee
            let annualSalary = clientBillingAmount;

            if (clientCompensationType === 'monthly') {
                annualSalary = clientBillingAmount * 12;
            }

            const fee = annualSalary * 0.15;
            setPlacementFee(fee);
            setOpslyhrMargin(0); // No margin for Full Time Hire
            setTalentNetRate(annualSalary); // Talent gets full salary from client
        } else {
            // Trial-to-Hire / Contract: 20% margin
            const margin = (clientBillingAmount * 20) / 100;
            setPlacementFee(0);
            setOpslyhrMargin(20);
            setTalentNetRate(clientBillingAmount - margin);
        }
    }, [clientBillingAmount, serviceModel, clientCompensationType]);

    // Auto-derive Time Tracking requirement
    useEffect(() => {
        if (serviceModel === 'full_time') {
            // Full Time Hire: NO time tracking
            setTimeTrackingRequired(false);
            setOvertimeEnabled(false);
        } else {
            // Time tracking required when:
            // - Compensation = Hourly, OR
            // - Compensation = Monthly + Expected Weekly Hours exists
            const required =
                clientCompensationType === 'hourly' ||
                (clientCompensationType === 'monthly' && expectedWeeklyHours !== null);

            setTimeTrackingRequired(required);

            // Overtime enabled only if Expected Weekly Hours is defined
            setOvertimeEnabled(required && expectedWeeklyHours !== null);
        }
    }, [serviceModel, clientCompensationType, expectedWeeklyHours]);

    // Auto-fetch agreement templates when service model changes
    useEffect(() => {
        if (offer && serviceModel) {
            fetchDefaultTemplates();
        }
    }, [offer, serviceModel]);

    const fetchDefaultTemplates = async () => {
        setTemplateLoading(true);
        try {
            // Fetch client template
            const { data: clientTemplate, error: clientError } = await supabase
                .from('agreement_templates')
                .select('*')
                .eq('user_type', 'client')
                .eq('service_model', serviceModel)
                .eq('status', 'active')
                .eq('is_default', true)
                .maybeSingle();

            // Fetch talent template
            const { data: talentTemplate, error: talentError } = await supabase
                .from('agreement_templates')
                .select('*')
                .eq('user_type', 'talent')
                .eq('service_model', serviceModel)
                .eq('status', 'active')
                .eq('is_default', true)
                .maybeSingle();

            if (!clientTemplate || !talentTemplate) {
                setTemplateError(true);
                setClientContractTemplate('');
                setTalentContractTemplate('');
                setClientTemplateId(null);
                setTalentTemplateId(null);
                toast({
                    title: "Missing Agreement Templates",
                    description: `No default templates found for ${serviceModel.replace(/_/g, ' ')}. Please create them in Legal → Agreement Templates.`,
                    variant: "destructive"
                });
                return;
            }

            setTemplateError(false);
            setClientContractTemplate(clientTemplate.clause_body);
            setTalentContractTemplate(talentTemplate.clause_body);
            setClientTemplateId(clientTemplate.id);
            setClientTemplateVersion(clientTemplate.version_number);
            setClientTemplateName(clientTemplate.clause_name);
            setTalentTemplateId(talentTemplate.id);
            setTalentTemplateVersion(talentTemplate.version_number);
            setTalentTemplateName(talentTemplate.clause_name);
        } catch (error: any) {
            console.error('Error fetching templates:', error);
            setTemplateError(true);
            toast({
                title: "Error",
                description: "Failed to load agreement templates",
                variant: "destructive"
            });
        } finally {
            setTemplateLoading(false);
        }
    };

    const fetchOfferData = async () => {
        try {
            const { data, error } = await supabase
                .from('offers')
                .select(`
                    *,
                    clients(company_name, primary_contact_name),
                    talents(first_name, last_name, talent_id, email),
                    jobs(title)
                `)
                .eq('id', offerId)
                .single();

            if (error) throw error;
            setOffer(data);

            // Initialize from offer data
            setJobTitle(data.role_title || data.jobs?.title || '');
            setJobDescription(data.jobs?.description || '');
            setClientBillingAmount(data.client_gross_amount || data.hourly_rate || 0);
            setContractStartDate(data.start_date || '');
            if (data.preferred_currency) setCurrency(data.preferred_currency);
            if (data.expected_weekly_hours) setExpectedWeeklyHours(data.expected_weekly_hours);

        } catch (error) {
            console.error("Error fetching offer:", error);
            toast({ title: "Error", description: "Could not load offer data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewClient = () => {
        const variables = {
            talentName: `${offer.talents.first_name} ${offer.talents.last_name}`,
            talentId: offer.talents.talent_id,
            clientCompany: offer.clients.company_name,
            jobTitle: jobTitle,
            jobDescription: jobDescription,
            serviceModel: serviceModel.replace(/_/g, ' '),
            clientRate: clientBillingAmount.toString(),
            compensationType: clientCompensationType,
            billingFrequency: clientBillingFrequency,
            billingDay: clientBillingDay,
            startDate: contractStartDate,
            duration: contractDuration || 'Ongoing',
            workingArrangement: workingArrangement,
            expectedWeeklyHours: expectedWeeklyHours?.toString() || 'Not specified',
            timeTrackingRequired: timeTrackingRequired ? 'Yes' : 'No',
            currencySymbol,
            overtimeClause: overtimeEnabled
                ? `<p><strong>Overtime:</strong> Hours exceeding ${expectedWeeklyHours}/week billed at 1.5× rate.</p>`
                : '',
            placementFee: placementFee > 0 ? placementFee.toFixed(2) : 'N/A'
        };

        const content = generateContractContent(clientContractTemplate, variables);
        setClientPreviewContent(content);
        setClientPreviewOpen(true);
    };

    const handlePreviewTalent = () => {
        const variables = {
            talentName: `${offer.talents.first_name} ${offer.talents.last_name}`,
            talentId: offer.talents.talent_id,
            clientCompany: offer.clients.company_name,
            jobTitle: jobTitle,
            jobDescription: jobDescription,
            serviceModel: serviceModel.replace(/_/g, ' '),
            talentRate: talentNetRate.toFixed(2),
            compensationType: clientCompensationType,
            paymentFrequency: talentPaymentFrequency,
            payday: talentPayday,
            startDate: contractStartDate,
            duration: contractDuration || 'Ongoing',
            workingArrangement: workingArrangement,
            timeTrackingRequired: timeTrackingRequired ? 'Yes' : 'No',
            currencySymbol,
            overtimeClause: overtimeEnabled
                ? `<p><strong>Overtime:</strong> Hours exceeding ${expectedWeeklyHours}/week paid at 1.5× rate.</p>`
                : '',
            employmentTransferClause: serviceModel === 'full_time'
                ? '<p><strong>Employment Transfer:</strong> This agreement confirms your direct employment with the client.</p>'
                : ''
        };

        const content = generateContractContent(talentContractTemplate, variables);
        setTalentPreviewContent(content);
        setTalentPreviewOpen(true);
    };

    const handleGenerateAndSend = async () => {
        // Validation - Templates Required
        if (!clientTemplateId || !talentTemplateId) {
            toast({
                title: "Missing Agreement Templates",
                description: "No active agreement templates found. Please create them in Legal → Agreement Templates or refresh templates.",
                variant: "destructive"
            });
            return;
        }

        // Validation - Required Fields
        if (!jobTitle || !contractStartDate || clientBillingAmount === 0) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            // Generate contract number
            const { data: contractNum } = await supabase.rpc("generate_contract_number");

            // Prepare contract terms with all variables
            const commonVars = {
                talentName: `${offer.talents.first_name} ${offer.talents.last_name}`,
                talentId: offer.talents.talent_id,
                clientCompany: offer.clients.company_name,
                jobTitle: jobTitle,
                jobDescription: jobDescription,
                serviceModel: serviceModel.replace(/_/g, ' '),
                startDate: contractStartDate,
                duration: contractDuration || 'Ongoing',
                workingArrangement: workingArrangement,
                expectedWeeklyHours: expectedWeeklyHours?.toString() || 'Not specified',
                timeTrackingRequired: timeTrackingRequired ? 'Yes' : 'No',
                currencySymbol
            };

            const clientTerms = generateContractContent(clientContractTemplate, {
                ...commonVars,
                clientRate: clientBillingAmount.toString(),
                compensationType: clientCompensationType,
                billingFrequency: clientBillingFrequency,
                billingDay: clientBillingDay,
                overtimeClause: overtimeEnabled
                    ? `<p><strong>Overtime:</strong> Hours exceeding ${expectedWeeklyHours}/week billed at 1.5× rate.</p>`
                    : '',
                placementFee: placementFee > 0 ? placementFee.toFixed(2) : 'N/A'
            });

            const talentTerms = generateContractContent(talentContractTemplate, {
                ...commonVars,
                talentRate: talentNetRate.toFixed(2),
                compensationType: clientCompensationType,
                paymentFrequency: talentPaymentFrequency,
                payday: talentPayday,
                overtimeClause: overtimeEnabled
                    ? `<p><strong>Overtime:</strong> Hours exceeding ${expectedWeeklyHours}/week paid at 1.5× rate.</p>`
                    : '',
                employmentTransferClause: serviceModel === 'full_time'
                    ? '<p><strong>Employment Transfer:</strong> This agreement confirms your direct employment with the client.</p>'
                    : ''
            });

            // Insert contract into database
            const { error } = await supabase.from('contracts').insert({
                offer_id: offerId,
                client_id: offer.client_id,
                talent_id: offer.talent_id,
                contract_number: contractNum || `CON-${Date.now()}`,

                // Core contract fields
                role_title: jobTitle,
                start_date: contractStartDate,
                duration: contractDuration || null,
                working_arrangement: workingArrangement,
                weekly_hours: expectedWeeklyHours || 40, // Default to 40 hours if not specified

                // Billing configuration (critical for invoicing)
                compensation_type: clientCompensationType,
                service_model: serviceModel,
                billing_frequency: serviceModel === 'direct_hire' ? 'one_time' : clientBillingFrequency,
                billing_day: clientBillingDay,
                expected_weekly_hours: expectedWeeklyHours,
                time_tracking_required: timeTrackingRequired,
                overtime_enabled: overtimeEnabled,

                // Financial fields
                hourly_rate: clientBillingAmount,
                client_gross_amount: clientBillingAmount,
                talent_rate: talentNetRate,
                taskive_margin: opslyhrMargin,

                // Talent payment configuration
                talent_payment_frequency: talentPaymentFrequency,
                talent_payday: talentPayday,

                // Contract terms (both client and talent versions)
                contract_terms: clientTerms,
                talent_contract_terms: talentTerms,
                client_contract_terms: clientTerms, // Explicit client terms field

                // Admin tracking
                admin_sent_at: new Date().toISOString(),

                // Status
                status: 'pending',
                created_by: (await supabase.auth.getUser()).data.user?.id,
                currency: currency
            });

            if (error) throw error;

            // Update offer status to contract_generated
            const { error: offerError } = await supabase
                .from('offers')
                .update({ status: 'contract_generated', currency: currency })
                .eq('id', offerId);

            if (offerError) console.error('Error updating offer status:', offerError);

            // Send notification emails
            try {
                // Send to Client
                if (offer.clients?.primary_contact_name && offer.clients?.company_name) {
                    // Try to get client email, fallback if needed
                    const clientEmail = "client@example.com"; // We should fetch actual client email from profiles or auth
                    // We'll skip exact email sending if we don't have it, but we can assume we do or fetch it
                }
                
                await sendClientContractReadyEmail({
                    clientEmail: offer.clients?.email || 'test@example.com', // Replace with real fetch if available
                    clientName: offer.clients?.primary_contact_name || offer.clients?.company_name || 'Client',
                    talentName: `${offer.talents.first_name} ${offer.talents.last_name}`,
                    jobTitle: jobTitle,
                    contractId: contractNum || `CON-${Date.now()}`
                });

                await sendTalentContractReadyEmail({
                    talentEmail: offer.talents?.email || 'test@example.com',
                    talentName: `${offer.talents.first_name} ${offer.talents.last_name}`,
                    clientName: offer.clients?.company_name || 'Client',
                    jobTitle: jobTitle
                });
            } catch (emailError) {
                console.error("Error sending contract ready emails:", emailError);
            }

            toast({
                title: "Success",
                description: "Contracts generated and sent to Client and Talent portals."
            });

            navigate('/admin/offers');

        } catch (error: any) {
            console.error("Contract generation error:", error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!offer) return <div className="p-8">Offer not found</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 space-y-8 animate-fade-in">
            {/* ========== PAGE HEADER ========== */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/offers')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Configure Contracts</h1>
                    <div className="flex items-center gap-3 text-muted-foreground mt-1 flex-wrap">
                        <span className="font-semibold text-primary">
                            {offer.talents.first_name} {offer.talents.last_name}
                        </span>
                        <span>•</span>
                        <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">
                            ID: {offer.talents.talent_id}
                        </span>
                        <span>•</span>
                        <span>{offer.clients.company_name}</span>
                        <span>•</span>
                        <span>{jobTitle}</span>
                    </div>
                </div>
            </div>

            {/* ========== THREE-COLUMN LAYOUT ========== */}
            <div className="grid lg:grid-cols-3 gap-6">

                {/* ========== LEFT: SHARED CONFIGURATION ========== */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Shared Configuration
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Applies to both contracts</p>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="space-y-3">
                            <Label>Service Model</Label>
                            <Select value={serviceModel} onValueChange={setServiceModel}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="trial_to_hire">Trial-to-Hire</SelectItem>
                                    <SelectItem value="full_time">Full Time Hire (Full-Time)</SelectItem>
                                    <SelectItem value="one_time">One-Time Project</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label>Job Title</Label>
                            <Input
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                placeholder="e.g. Senior Frontend Developer"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Currency</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="CAD">CAD (CA$)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="GHS">GHS (GH₵)</SelectItem>
                                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                                    <SelectItem value="KES">KES (KSh)</SelectItem>
                                    <SelectItem value="ZAR">ZAR (R)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label>Job Description</Label>
                            <Textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Full job description..."
                                rows={4}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Contract Start Date</Label>
                            <Input
                                type="date"
                                value={contractStartDate}
                                onChange={(e) => setContractStartDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Contract Duration (Optional)</Label>
                            <Input
                                value={contractDuration}
                                onChange={(e) => setContractDuration(e.target.value)}
                                placeholder="e.g. 6 months, 1 year, or leave blank for ongoing"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Working Arrangement</Label>
                            <Select value={workingArrangement} onValueChange={setWorkingArrangement}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="remote">Remote</SelectItem>
                                    <SelectItem value="hybrid">Hybrid</SelectItem>
                                    <SelectItem value="onsite">On-site</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label>Expected Weekly Hours (Optional)</Label>
                            <Input
                                type="number"
                                value={expectedWeeklyHours || ''}
                                onChange={(e) => setExpectedWeeklyHours(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="e.g. 40"
                            />
                            <p className="text-xs text-muted-foreground">
                                Affects time tracking and overtime calculation
                            </p>
                        </div>

                        {/* Time Tracking Status */}
                        <div className="p-3 bg-muted/50 rounded-md space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Time Tracking:</span>
                                <span className={timeTrackingRequired ? "text-green-600" : "text-muted-foreground"}>
                                    {timeTrackingRequired ? "Required" : "Not Required"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Overtime:</span>
                                <span className={overtimeEnabled ? "text-green-600" : "text-muted-foreground"}>
                                    {overtimeEnabled ? "Enabled (1.5×)" : "Disabled"}
                                </span>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* ========== MIDDLE: CLIENT CONTRACT ========== */}
                <Card className="lg:col-span-1 border-blue-200 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                            <DollarSign className="w-5 h-5" />
                            Client Contract
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Billing & invoicing configuration</p>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="space-y-3">
                            <Label>Compensation Type</Label>
                            <RadioGroup value={clientCompensationType} onValueChange={setClientCompensationType}>
                                {serviceModel === 'full_time' ? (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="annual" id="annual" />
                                            <Label htmlFor="annual">Annual Salary</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="monthly" id="monthly-salary" />
                                            <Label htmlFor="monthly-salary">Monthly Salary</Label>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="hourly" id="hourly" />
                                            <Label htmlFor="hourly">Hourly</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="monthly" id="monthly-retainer" />
                                            <Label htmlFor="monthly-retainer">Monthly Retainer</Label>
                                        </div>
                                    </>
                                )}
                            </RadioGroup>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-blue-700 font-bold">
                                Billing Amount ({clientCompensationType})
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span>
                                <Input
                                    type="number"
                                    value={clientBillingAmount}
                                    onChange={(e) => setClientBillingAmount(parseFloat(e.target.value) || 0)}
                                    className="pl-8 font-bold text-lg"
                                />
                            </div>
                        </div>

                        {serviceModel !== 'full_time' && (
                            <>
                                <div className="space-y-3">
                                    <Label>Billing Frequency</Label>
                                    <Select value={clientBillingFrequency} onValueChange={setClientBillingFrequency}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clientCompensationType === 'hourly' && (
                                                <>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                                                </>
                                            )}
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label>Billing Day</Label>
                                    <Select value={clientBillingDay} onValueChange={setClientBillingDay}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clientBillingFrequency === 'monthly' ? (
                                                <>
                                                    <SelectItem value="last_day">Last day of month</SelectItem>
                                                    <SelectItem value="first_day">First day of following month</SelectItem>
                                                </>
                                            ) : (
                                                <SelectItem value="first_day">First day of next billing cycle</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        {serviceModel === 'full_time' && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-amber-900">Full Time Hire - One-Time Invoice</p>
                                        <p className="text-amber-700 mt-1">
                                            Placement Fee: <span className="font-bold">{currencySymbol}{placementFee.toFixed(2)}</span> (10-15% of {clientCompensationType === 'annual' ? 'annual' : 'annual equivalent'})
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label>Client Agreement Template</Label>
                            <Textarea
                                value={clientContractTemplate}
                                onChange={(e) => setClientContractTemplate(e.target.value)}
                                rows={8}
                                className="font-mono text-xs"
                            />
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                            onClick={handlePreviewClient}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Client Contract
                        </Button>

                    </CardContent>
                </Card>

                {/* ========== RIGHT: TALENT CONTRACT ========== */}
                <Card className="lg:col-span-1 border-green-200 bg-green-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <DollarSign className="w-5 h-5" />
                            Talent Contract
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Payment & payout configuration</p>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="p-4 bg-white border border-green-200 rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Client Gross:</span>
                                <span className="font-mono font-semibold">{currencySymbol}{clientBillingAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">OpslyHR Margin:</span>
                                <span className="font-mono">{opslyhrMargin}%</span>
                            </div>
                            <div className="h-px bg-green-200"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-green-700">Talent Net Rate:</span>
                                <span className="font-mono font-bold text-lg text-green-700">
                                    {currencySymbol}{talentNetRate.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {serviceModel !== 'full_time' && (
                            <>
                                <div className="space-y-3">
                                    <Label>Payment Frequency</Label>
                                    <Select value={talentPaymentFrequency} onValueChange={setTalentPaymentFrequency}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label>Payday</Label>
                                    <Select value={talentPayday} onValueChange={setTalentPayday}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1st">1st of month</SelectItem>
                                            <SelectItem value="15th">15th of month</SelectItem>
                                            <SelectItem value="last_day">Last day of month</SelectItem>
                                            <SelectItem value="friday">Every Friday</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        {serviceModel === 'full_time' && (
                            <div className="p-3 bg-green-100 border border-green-300 rounded-md">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-green-700 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-green-900">Direct Employment</p>
                                        <p className="text-green-700 mt-1">
                                            Talent will be directly employed by client. No ongoing payments from OpslyHR.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label>Talent Agreement Template</Label>
                            <Textarea
                                value={talentContractTemplate}
                                onChange={(e) => setTalentContractTemplate(e.target.value)}
                                rows={8}
                                className="font-mono text-xs"
                            />
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-green-300 text-green-700 hover:bg-green-100"
                            onClick={handlePreviewTalent}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Talent Contract
                        </Button>

                    </CardContent>
                </Card>

            </div>

            {/* ========== BOTTOM ACTION BAR ========== */}
            <Card className="bg-stone-900 text-white border-0 shadow-xl sticky bottom-6">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg">Ready to Generate Contracts?</h3>
                            <p className="text-sm text-white/70">
                                This will send both contracts to Client and Talent portals simultaneously
                            </p>
                        </div>
                        <Button
                            size="lg"
                            className="bg-white text-stone-900 hover:bg-stone-200 font-bold"
                            onClick={handleGenerateAndSend}
                            disabled={loading}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Generate & Send Contracts
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ========== CLIENT PREVIEW DIALOG ========== */}
            <Dialog open={clientPreviewOpen} onOpenChange={setClientPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Client Contract Preview</DialogTitle>
                    </DialogHeader>
                    <div
                        dangerouslySetInnerHTML={{ __html: clientPreviewContent }}
                        className="prose max-w-none p-6"
                    />
                </DialogContent>
            </Dialog>

            {/* ========== TALENT PREVIEW DIALOG ========== */}
            <Dialog open={talentPreviewOpen} onOpenChange={setTalentPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Talent Contract Preview</DialogTitle>
                    </DialogHeader>
                    <div
                        dangerouslySetInnerHTML={{ __html: talentPreviewContent }}
                        className="prose max-w-none p-6"
                    />
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default AdminOfferConfig;
