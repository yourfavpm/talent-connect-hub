import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    FileText,
    Download,
    Eye,
    Check,
    Clock,
    AlertCircle,
    Pen,
    ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useReactToPrint } from "react-to-print";
import { sendTalentContractSignedEmail, sendAdminContractFullySignedEmail, sendTalentContractActiveEmail, sendClientContractActiveEmail } from "@/lib/email/triggers";
import SignatureCanvas from "react-signature-canvas";
import { v4 as uuidv4 } from "uuid";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Loader2 } from "lucide-react";

interface Contract {
    id: string;
    clientName: string;
    role: string;
    startDate: string;
    endDate: string;
    rate: string;
    status: "pending" | "active" | "completed" | "expired";
    contract_terms?: string;
    talent_contract_terms?: string;
    contract_number?: string;
    talent_signed_at?: string;
    talent_signature_url?: string;
    client_signature_url?: string;
}

const EmptyState = ({
    icon: Icon,
    title,
    description,
}: {
    icon: any;
    title: string;
    description: string;
}) => (
    <div className="text-center py-16 bg-card rounded-xl border border-border">
        <Icon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

const ContractList = ({
    contracts,
    getStatusConfig,
    onView,
}: {
    contracts: Contract[];
    getStatusConfig: (status: string) => any;
    onView: (contract: Contract) => void;
}) => (
    <div className="space-y-4">
        {contracts.map((contract, index) => {
            const statusConfig = getStatusConfig(contract.status);
            return (
                <div
                    key={contract.id}
                    className="bg-card rounded-xl border border-border p-6 hover:shadow-sm transition-shadow animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                    {contract.clientName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">
                                    {contract.role}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {contract.clientName} • {contract.rate}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <Badge className={statusConfig.className}>
                                    {statusConfig.label}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(contract.startDate).toLocaleDateString()}
                                </p>
                            </div>
                            <button className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 flex items-center gap-1.5 transition-colors" onClick={() => onView(contract)}>
                                View <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);

const TalentContracts = () => {
    const { user } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [signDialogOpen, setSignDialogOpen] = useState(false);
    const [signMode, setSignMode] = useState<"draw" | "type">("type");
    const [typedSignature, setTypedSignature] = useState("");
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [loading, setLoading] = useState(true);
    const [isSigning, setIsSigning] = useState(false);
    const { toast } = useToast();

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Contract_${selectedContract?.contract_number || "Document"}`,
    });

    const fetchContracts = async () => {
        try {
            const { data: talent } = await supabase
                .from('talents')
                .select('id')
                .eq('user_id', user?.id)
                .maybeSingle();

            if (!talent) return;

            const { data, error } = await supabase
                .from('contracts')
                .select(`
                    *,
                    clients(company_name)
                `)
                .eq('talent_id', talent.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedContracts = (data || []).map((contract: any) => ({
                id: contract.id,
                clientName: contract.clients?.company_name || 'Unknown Client',
                role: contract.role_title || 'N/A',
                startDate: contract.start_date || new Date().toISOString(),
                endDate: contract.end_date || new Date().toISOString(),
                rate: `$${contract.talent_rate || 0}/hr`,
                status: contract.status,
                contract_terms: contract.contract_terms,
                talent_contract_terms: contract.talent_contract_terms,
                contract_number: contract.contract_number,
                talent_signed_at: contract.talent_signed_at,
                client_signed_at: contract.client_signed_at,
                talent_signature_url: contract.talent_signature_url,
                client_signature_url: contract.client_signature_url,
            }));

            setContracts(formattedContracts);
        } catch (error: any) {
            console.error('Error fetching contracts:', error);
            toast({
                title: "Error",
                description: "Failed to load contracts",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchContracts();
    }, [user]);


    const generateAndUploadPDF = async (contractId: string, currentContract: any) => {
        if (!printRef.current) return null;
        
        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            
            // Add watermark
            pdf.setTextColor(230, 230, 230);
            pdf.setFontSize(canvas.width / 10);
            pdf.text("OpslyHR", canvas.width / 2, canvas.height / 2, { angle: 45, align: "center" });

            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            const pdfBlob = pdf.output('blob');

            const fileName = `${contractId}-${uuidv4()}.pdf`;
            const { data, error } = await supabase.storage
                .from('contracts')
                .upload(fileName, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('contracts')
                .getPublicUrl(fileName);

            return publicUrlData.publicUrl;
        } catch (error) {
            console.error("PDF generation error", error);
            return null;
        }
    };

    const handleSign = async (contractId: string) => {
        try {
            setIsSigning(true);
            
            let signatureUrl = "";
            if (signMode === "draw") {
                if (sigCanvas.current?.isEmpty()) {
                    toast({ title: "Error", description: "Please provide a signature.", variant: "destructive" });
                    setIsSigning(false);
                    return;
                }
                signatureUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png') || "";
            } else {
                if (!typedSignature.trim()) {
                    toast({ title: "Error", description: "Please type your name to sign.", variant: "destructive" });
                    setIsSigning(false);
                    return;
                }
                signatureUrl = `data:text/plain;base64,${btoa(typedSignature)}`;
            }

            const updatedContractData = {
                talent_signed_at: new Date().toISOString(),
                talent_signature_url: signatureUrl,
                status: 'active' // Auto-activate upon talent signature
            };

            const { error } = await supabase
                .from('contracts')
                .update(updatedContractData)
                .eq('id', contractId);

            if (error) throw error;
            
            const updatedContract = { ...selectedContract, ...updatedContractData } as Contract;
            setSelectedContract(updatedContract);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const pdfUrl = await generateAndUploadPDF(contractId, updatedContract);

            if (pdfUrl) {
                await supabase.from('contracts').update({ documentUrl: pdfUrl }).eq('id', contractId);
            }

            // Send email to talent confirming signature
            try {
                await sendTalentContractSignedEmail({
                    talentEmail: user.email || '',
                    talentName: user.user_metadata?.first_name || 'Talent',
                    clientName: selectedContract?.clientName || 'Client',
                    contractId: selectedContract?.contract_number || contractId,
                    jobTitle: selectedContract?.role || 'Role',
                    rate: selectedContract?.rate || 'Rate',
                    startDate: selectedContract?.startDate || new Date().toISOString(),
                    pdfUrl: pdfUrl || undefined
                });
            } catch (emailError) {
                console.error('Error sending email:', emailError);
            }

            // Check if client has already signed, if so send admin notification AND active emails
            if (selectedContract?.client_signed_at) {
                try {
                    const { data: adminUsers } = await supabase
                        .from('user_roles')
                        .select('user_id')
                        .eq('role', 'super_admin')
                        .limit(1);

                    if (adminUsers && adminUsers.length > 0) {
                        const { data: adminProfile } = await supabase
                            .from('profiles')
                            .select('email')
                            .eq('id', adminUsers[0].user_id)
                            .single();

                        if (adminProfile?.email) {
                            await sendAdminContractFullySignedEmail({
                                adminEmail: adminProfile.email,
                                contractId: selectedContract?.contract_number || contractId,
                                clientName: selectedContract?.clientName || 'Client',
                                talentName: user.user_metadata?.first_name || 'Talent',
                            });
                        }
                    }

                    // Send ACTIVE email to Talent
                    await sendTalentContractActiveEmail({
                        talentEmail: user.email || '',
                        talentName: user.user_metadata?.first_name || 'Talent',
                        clientName: selectedContract?.clientName || 'Client',
                        contractId: selectedContract?.contract_number || contractId,
                        jobTitle: selectedContract?.role || 'Role',
                        rate: selectedContract?.rate || 'Rate',
                        startDate: selectedContract?.startDate || new Date().toISOString(),
                        pdfUrl: pdfUrl || undefined
                    });

                    // Fetch Client Email and send ACTIVE email to Client
                    const { data: clientData } = await supabase
                        .from('clients')
                        .select('user_id')
                        .eq('id', selectedContract.client_id)
                        .single();
                        
                    if (clientData?.user_id) {
                        const { data: clientProfile } = await supabase
                            .from('profiles')
                            .select('email')
                            .eq('id', clientData.user_id)
                            .single();
                            
                        if (clientProfile?.email) {
                            await sendClientContractActiveEmail({
                                clientEmail: clientProfile.email,
                                clientName: selectedContract?.clientName || 'Client',
                                talentName: user.user_metadata?.first_name || 'Talent',
                                contractId: selectedContract?.contract_number || contractId,
                                jobTitle: selectedContract?.role || 'Role',
                                rate: selectedContract?.rate || 'Rate',
                                startDate: selectedContract?.startDate || new Date().toISOString(),
                                pdfUrl: pdfUrl || undefined
                            });
                        }
                    }

                } catch (emailError) {
                    console.error('Error sending active/admin notifications:', emailError);
                }
            }

            toast({
                title: "Success",
                description: selectedContract?.client_signed_at 
                    ? "Contract fully executed." 
                    : "Contract signed successfully. Awaiting client signature.",
            });

            setSignDialogOpen(false);
            setViewDialogOpen(false);
            fetchContracts();
        } catch (error: any) {
            console.error('Error signing contract:', error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSigning(false);
        }
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; className: string }> = {
            pending: { label: "Pending Signature", className: "bg-amber-100 text-amber-700" },
            active: { label: "Active", className: "bg-green-100 text-green-700" },
            completed: { label: "Completed", className: "bg-blue-100 text-blue-700" },
            expired: { label: "Expired", className: "bg-gray-100 text-gray-700" },
        };
        return configs[status] || configs.pending;
    };

    const pendingContracts = contracts.filter(c => c.status === 'pending' && !c.talent_signed_at);
    const activeContracts = contracts.filter(c => c.status === 'active');
    const completedContracts = contracts.filter(c => c.status === 'completed');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in w-full">
            <div>
                <h1 className="text-3xl font-bold text-foreground">My Contracts</h1>
                <p className="text-muted-foreground mt-1">View and manage your talent contracts</p>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">
                        Pending ({pendingContracts.length})
                    </TabsTrigger>
                    <TabsTrigger value="active">
                        Active ({activeContracts.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Completed ({completedContracts.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    {pendingContracts.length === 0 ? (
                        <EmptyState
                            icon={Clock}
                            title="No Pending Contracts"
                            description="You don't have any contracts awaiting your signature"
                        />
                    ) : (
                        <ContractList
                            contracts={pendingContracts}
                            getStatusConfig={getStatusConfig}
                            onView={(contract) => {
                                setSelectedContract(contract);
                                setViewDialogOpen(true);
                            }}
                        />
                    )}
                </TabsContent>

                <TabsContent value="active" className="mt-6">
                    {activeContracts.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="No Active Contracts"
                            description="You don't have any active contracts at the moment"
                        />
                    ) : (
                        <ContractList
                            contracts={activeContracts}
                            getStatusConfig={getStatusConfig}
                            onView={(contract) => {
                                setSelectedContract(contract);
                                setViewDialogOpen(true);
                            }}
                        />
                    )}
                </TabsContent>

                <TabsContent value="completed" className="mt-6">
                    {completedContracts.length === 0 ? (
                        <EmptyState
                            icon={Check}
                            title="No Completed Contracts"
                            description="You haven't completed any contracts yet"
                        />
                    ) : (
                        <ContractList
                            contracts={completedContracts}
                            getStatusConfig={getStatusConfig}
                            onView={(contract) => {
                                setSelectedContract(contract);
                                setViewDialogOpen(true);
                            }}
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* View Contract Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Contract Details</DialogTitle>
                    </DialogHeader>
                    {selectedContract && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <Label className="text-muted-foreground">Contract Number</Label>
                                    <p className="font-semibold">{selectedContract.contract_number}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Client</Label>
                                    <p className="font-semibold">{selectedContract.clientName}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Role</Label>
                                    <p className="font-semibold">{selectedContract.role}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Rate</Label>
                                    <p className="font-semibold">{selectedContract.rate}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Start Date</Label>
                                    <p className="font-semibold">
                                        {new Date(selectedContract.startDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <Badge className={getStatusConfig(selectedContract.status).className}>
                                        {getStatusConfig(selectedContract.status).label}
                                    </Badge>
                                </div>
                            </div>

                            <div ref={printRef} className="border p-8 rounded-lg bg-white text-black shadow-sm overflow-auto max-h-[60vh] print:max-h-none print:shadow-none">
                                <div className="mb-8 text-center border-b pb-4">
                                  <h1 className="text-2xl font-bold uppercase tracking-wider">Service Agreement</h1>
                                  <p className="text-gray-500 mt-2">Contract #{selectedContract.contract_number || selectedContract.id.slice(0, 8)}</p>
                                </div>
                                <div dangerouslySetInnerHTML={{
                                    __html: selectedContract.talent_contract_terms || selectedContract.contract_terms || '<p>No contract terms available</p>'
                                }} className="prose max-w-none font-serif text-sm leading-relaxed mb-8" />
                                
                                <div className="mt-12 pt-8 border-t grid grid-cols-2 gap-12 break-inside-avoid">
                                  <div>
                                    <p className="font-bold mb-4 text-xs uppercase tracking-wide">Confirmed and Agreed By:</p>
                                    <div className="h-16 border-b border-black mb-2 flex items-end pb-1">
                                      {selectedContract?.talent_signed_at && (
                                        <div className="font-script text-2xl text-blue-900 flex flex-col items-start">
                                          {selectedContract.talent_signature_url && selectedContract.talent_signature_url.startsWith('data:image') ? (
                                            <img src={selectedContract.talent_signature_url} alt="Talent Signature" className="h-12 object-contain" />
                                          ) : selectedContract.talent_signature_url ? (
                                            <div className="font-script text-3xl mb-2">{atob(selectedContract.talent_signature_url.replace('data:text/plain;base64,', ''))}</div>
                                          ) : (
                                            <span>{user?.user_metadata?.first_name} (Signed)</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-xs uppercase font-semibold">Talent Signature</p>
                                    {selectedContract?.talent_signed_at && (
                                      <p className="text-[10px] text-gray-500 mt-1">Date: {new Date(selectedContract.talent_signed_at).toLocaleDateString()}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold mb-4 text-xs uppercase tracking-wide">Accepted By OpslyHR:</p>
                                    <div className="h-16 border-b border-black mb-2 flex items-end pb-1">
                                      {selectedContract?.status === 'active' && (
                                        <span className="font-script text-2xl text-blue-900">OpslyHR Admin</span>
                                      )}
                                    </div>
                                    <p className="text-xs uppercase font-semibold">Authorized Signature</p>
                                  </div>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" onClick={() => handlePrint()}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                </Button>
                                {!selectedContract.talent_signed_at && selectedContract.status === 'pending' && (
                                    <Button onClick={() => {
                                        setViewDialogOpen(false);
                                        setSignDialogOpen(true);
                                    }}>
                                        <Pen className="h-4 w-4 mr-2" />
                                        Sign Contract
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Sign Contract Dialog */}
            <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Sign Contract</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                <div className="text-sm text-amber-900">
                                    <p className="font-semibold">Important</p>
                                    <p>By signing this contract, you agree to all terms and conditions outlined in the agreement.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mb-4">
                            <Button
                                variant={signMode === "type" ? "default" : "outline"}
                                onClick={() => setSignMode("type")}
                                className="flex-1"
                            >
                                Type Signature
                            </Button>
                            <Button
                                variant={signMode === "draw" ? "default" : "outline"}
                                onClick={() => setSignMode("draw")}
                                className="flex-1"
                            >
                                Draw Signature
                            </Button>
                        </div>

                        {signMode === "type" ? (
                            <div className="space-y-2">
                                <Label>Type your full name</Label>
                                <Input
                                    value={typedSignature}
                                    onChange={(e) => setTypedSignature(e.target.value)}
                                    placeholder="John Doe"
                                    className="font-script text-2xl h-14"
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Draw your signature</Label>
                                <div className="border rounded-md bg-slate-50 relative">
                                    <SignatureCanvas
                                        ref={sigCanvas}
                                        canvasProps={{
                                            className: "w-full h-40 cursor-crosshair",
                                        }}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-2 right-2 h-7 px-2 text-xs"
                                        onClick={() => sigCanvas.current?.clear()}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="outline" onClick={() => setSignDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => selectedContract && handleSign(selectedContract.id)} disabled={isSigning}>
                                {isSigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign Contract
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TalentContracts;
