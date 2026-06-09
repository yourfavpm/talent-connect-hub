import { useState, useEffect } from "react";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { sendClientContractSignedEmail, sendAdminContractFullySignedEmail, sendClientContractActiveEmail, sendTalentContractActiveEmail } from "@/lib/email/triggers";
import SignatureCanvas from "react-signature-canvas";
import { v4 as uuidv4 } from "uuid";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Loader2 } from "lucide-react";

interface Contract {
  id: string;
  talentName: string;
  role: string;
  startDate: string;
  endDate: string;
  rate: string;
  status: "pending_signature" | "waiting_for_talent" | "active" | "completed" | "expired";
  documentUrl?: string;
  contract_terms?: string;
  contract_number?: string;
  client_signed_at?: string;
  talent_signed_at?: string;
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
                  {contract.talentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {contract.talentName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {contract.role} • {contract.rate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <Badge className={statusConfig.className}>
                  {statusConfig.label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(contract.startDate).toLocaleDateString()} -{" "}
                  {new Date(contract.endDate).toLocaleDateString()}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onView(contract)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const Contracts = () => {
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

  useEffect(() => {
    if (user) fetchContracts();
  }, [user]);

  const fetchContracts = async () => {
    try {
      const { data: client } = await supabase.from('clients').select('id').eq('user_id', user?.id).maybeSingle();
      if (!client) return;

      const { data, error } = await supabase
        .from('contracts')
        .select(`
            *,
            talents(first_name, last_name)
        `)
        .eq('client_id', client.id)
        .not('admin_sent_at', 'is', null) // Only show if admin sent it
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = data.map((c: any) => {
        let status: any = c.status;
        if (c.client_signed_at && c.talent_signed_at) {
            status = 'active';
            if (c.status !== 'active') {
                supabase.from('contracts').update({ status: 'active' } as any).eq('id', c.id).then();
            }
        } else if (c.client_signed_at && !c.talent_signed_at) {
            status = 'waiting_for_talent';
        } else if (c.talent_signed_at && !c.client_signed_at) {
            status = 'pending_signature'; // Wait, client view: if talent signed but client didn't, client needs to sign! So pending_signature.
        } else {
            status = 'pending_signature';
        }

        return {
          id: c.id,
          talentName: `${c.talents?.first_name} ${c.talents?.last_name}`,
          role: c.role_title,
          startDate: c.start_date,
          endDate: c.end_date || 'Ongoing',
          // Show Client Gross Rate
          rate: c.client_gross_rate ? `$${c.client_gross_rate}/${c.compensation_type === 'monthly' ? 'mo' : 'hr'}` : `$${c.hourly_rate}/hr`,
          status: status,
          contract_terms: c.client_contract_terms || c.contract_terms,
          contract_number: c.contract_number,
          talent_id: c.talent_id,
          talent_signed_at: c.talent_signed_at,
          client_signed_at: c.client_signed_at
        };
      });
      setContracts(mapped);
    } catch (error) {
      console.error("Error fetching contracts", error);
    } finally {
      setLoading(false);
    }
  };


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
      // Rotate and place watermark in the middle
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

      // Update Contract with Signature Temporarily to render in PDF
      const updatedContractData = {
        client_signed_at: new Date().toISOString(),
        client_signature_url: signatureUrl,
      };

      const { error } = await supabase.from('contracts').update(updatedContractData).eq('id', contractId);

      if (error) {
        throw error;
      }
      
      // We need to wait a tick for the UI to update with the new signature if we were to generate PDF here.
      // But we will just upload the signature first, and generate PDF later or just return the contract.
      // Wait, let's update selectedContract so printRef re-renders with signature
      const updatedContract = { ...selectedContract, ...updatedContractData } as Contract;
      setSelectedContract(updatedContract);
      
      // Wait for React to render the signature in the printRef
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now generate PDF
      const pdfUrl = await generateAndUploadPDF(contractId, updatedContract);

      // Save PDF URL if generated
      if (pdfUrl) {
         await supabase.from('contracts').update({ documentUrl: pdfUrl }).eq('id', contractId);
      }

      // Notify Admin
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'super_admin')
        .limit(1);

      if (admins && admins.length > 0) {
        await supabase.from('notifications').insert({
          user_id: admins[0].user_id,
          type: 'contract_signed',
          title: 'Client Signed Contract',
          message: `Contract ${selectedContract?.contract_number} has been signed by the client. Awaiting talent signature.`,
          related_id: contractId,
          read: false
        });
      }

      // Send email to client confirming signature
      try {
        await sendClientContractSignedEmail({
          clientEmail: user?.email || '',
          clientName: user?.user_metadata?.full_name || 'Client',
          talentName: selectedContract?.talentName || 'Talent',
          contractId: selectedContract?.contract_number || contractId,
          jobTitle: selectedContract?.role || 'Role',
          rate: selectedContract?.rate || 'Rate',
          startDate: selectedContract?.startDate || new Date().toISOString(),
          pdfUrl: pdfUrl || undefined
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }

      // Check if talent has already signed, if so send admin notification AND active emails
      if (selectedContract?.talent_signed_at) {
        try {
          if (admins && admins.length > 0) {
            const { data: adminProfile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', admins[0].user_id)
              .single();

            if (adminProfile?.email) {
              await sendAdminContractFullySignedEmail({
                adminEmail: adminProfile.email,
                contractId: selectedContract?.contract_number || contractId,
                clientName: user?.user_metadata?.full_name || 'Client',
                talentName: selectedContract?.talentName || 'Talent',
              });
            }
          }

          // Send ACTIVE email to Client
          await sendClientContractActiveEmail({
            clientEmail: user?.email || '',
            clientName: user?.user_metadata?.full_name || 'Client',
            talentName: selectedContract?.talentName || 'Talent',
            contractId: selectedContract?.contract_number || contractId,
            jobTitle: selectedContract?.role || 'Role',
            rate: selectedContract?.rate || 'Rate',
            startDate: selectedContract?.startDate || new Date().toISOString(),
            pdfUrl: pdfUrl || undefined
          });

          // Also update the offer status to 'signed' and shortlist to 'hired'
          try {
            const { data: contractData } = await supabase.from('contracts').select('offer_id, hire_request_id, talent_id').eq('id', contractId).single();
            if (contractData?.offer_id) {
              await supabase.from('offers').update({ status: 'signed' } as any).eq('id', contractData.offer_id);
              // Removed auto-update to 'hired' for hr_v2_hire_requests to allow multiple hires per request
            }
            if (contractData?.hire_request_id && contractData?.talent_id) {
              await supabase.from('hr_v2_shortlist')
                .update({ status: 'hired' } as any)
                .eq('hire_request_id', contractData.hire_request_id)
                .eq('talent_id', contractData.talent_id);
            }
          } catch (offerErr) {
            console.error("Error updating offer status:", offerErr);
          }

          // Fetch Talent Email and send ACTIVE email to Talent
          try {
            const { data: talentData } = await supabase
              .from('talents')
              .select('user_id')
              .eq('id', selectedContract.talent_id)
              .single();
              
            if (talentData?.user_id) {
              const { data: talentProfile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', talentData.user_id)
                .single();
                
              if (talentProfile?.email) {
                await sendTalentContractActiveEmail({
                  talentEmail: talentProfile.email,
                  talentName: selectedContract?.talentName || 'Talent',
                  clientName: user?.user_metadata?.full_name || 'Client',
                  contractId: selectedContract?.contract_number || contractId,
                  jobTitle: selectedContract?.role || 'Role',
                  rate: selectedContract?.rate || 'Rate',
                  startDate: selectedContract?.startDate || new Date().toISOString(),
                  pdfUrl: pdfUrl || undefined
                });
              }
            }
          } catch (talentEmailErr) {
            console.error("Error sending talent active email:", talentEmailErr);
          }

        } catch (emailError) {
          console.error('Error sending active/admin notifications:', emailError);
        }
      }

      toast({
        title: "Contract Signed",
        description: selectedContract?.talent_signed_at 
          ? "Contract fully executed." 
          : "Your signature has been recorded. Awaiting talent signature.",
      });

      fetchContracts();
      setSignDialogOpen(false);
      setViewDialogOpen(false);
    } catch (error: any) {
      console.error("Sign Handler Error:", error);
      toast({ title: "Error signing contract", description: error.message || "Unknown error", variant: "destructive" });
    } finally {
      setIsSigning(false);
    }
  };


  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending_signature":
        return {
          label: "Pending Signature",
          className: "bg-warning/10 text-warning border-warning/20",
          icon: Pen,
        };
      case "waiting_for_talent":
        return {
          label: "Waiting for Talent",
          className: "bg-blue-100 text-blue-700 border-blue-200",
          icon: Clock,
        };
      case "active":
        return {
          label: "Active",
          className: "bg-success/10 text-success border-success/20",
          icon: Check,
        };
      case "completed":
        return {
          label: "Completed",
          className: "bg-muted text-muted-foreground",
          icon: Check,
        };
      case "expired":
        return {
          label: "Expired",
          className: "bg-destructive/10 text-destructive border-destructive/20",
          icon: AlertCircle,
        };
      default:
        return { label: status, className: "", icon: Clock };
    }
  };

  const pendingContracts = contracts.filter(
    (c) => c.status === "pending_signature" || c.status === "waiting_for_talent"
  );
  const activeContracts = contracts.filter((c) => c.status === "active");
  const completedContracts = contracts.filter(
    (c) => c.status === "completed" || c.status === "expired"
  );

  return (
    <div className="w-full max-w-none space-y-6 animate-fade-in px-4 md:px-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Contracts</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your talent contracts
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingContracts.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingContracts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            Active
            <Badge variant="secondary" className="ml-1">
              {activeContracts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            Completed
            <Badge variant="secondary" className="ml-1">
              {completedContracts.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingContracts.length === 0 ? (
            <EmptyState
              icon={Pen}
              title="No pending contracts"
              description="Contracts awaiting your signature will appear here"
            />
          ) : (
            <ContractList
              contracts={pendingContracts}
              getStatusConfig={getStatusConfig}
              onView={(c) => {
                setSelectedContract(c);
                setViewDialogOpen(true);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          {activeContracts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No active contracts"
              description="Your active contracts will appear here"
            />
          ) : (
            <ContractList
              contracts={activeContracts}
              getStatusConfig={getStatusConfig}
              onView={(c) => {
                setSelectedContract(c);
                setViewDialogOpen(true);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedContracts.length === 0 ? (
            <EmptyState
              icon={Check}
              title="No completed contracts"
              description="Completed contracts will appear here"
            />
          ) : (
            <ContractList
              contracts={completedContracts}
              getStatusConfig={getStatusConfig}
              onView={(c) => {
                setSelectedContract(c);
                setViewDialogOpen(true);
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* View Contract Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Talent</h4>
                  <p className="font-semibold">{selectedContract.talentName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Role</h4>
                  <p className="font-semibold">{selectedContract.role}</p>
                </div>
              </div>

              {/* Print & Sign Actions */}
              <div className="flex justify-end gap-2 my-4">
                <Button variant="outline" onClick={() => handlePrint()}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
                {selectedContract?.status === 'pending_signature' && (
                  <Button onClick={() => setSignDialogOpen(true)} disabled={isSigning}>
                    <Pen className="mr-2 h-4 w-4" />
                    Sign Contract
                  </Button>
                )}
              </div>

              {/* Contract Preview Area */}
              <div className="border p-8 rounded-lg bg-white text-black shadow-sm overflow-auto max-h-[60vh] print:max-h-none print:shadow-none" ref={printRef}>
                <div className="mb-8 text-center border-b pb-4">
                  <h1 className="text-2xl font-bold uppercase tracking-wider">Service Agreement</h1>
                  <p className="text-gray-500 mt-2">Contract #{selectedContract.contract_number || selectedContract.id.slice(0, 8)}</p>
                </div>

                {/* Render HTML Content */}
                <div
                  className="prose max-w-none font-serif text-sm leading-relaxed mb-8"
                  dangerouslySetInnerHTML={{
                    __html: selectedContract.contract_terms || "<p>No contract terms available.</p>"
                  }}
                />

                <div className="mt-12 pt-8 border-t grid grid-cols-2 gap-12 break-inside-avoid">
                  <div>
                    <p className="font-bold mb-4 text-xs uppercase tracking-wide">Confirmed and Agreed By:</p>
                    <div className="h-16 border-b border-black mb-2 flex items-end pb-1">
                      {selectedContract?.status !== 'pending_signature' && (
                        <div className="font-script text-2xl text-blue-900 flex flex-col items-start">
                          {selectedContract.client_signature_url && selectedContract.client_signature_url.startsWith('data:image') ? (
                            <img src={selectedContract.client_signature_url} alt="Client Signature" className="h-12 object-contain" />
                          ) : selectedContract.client_signature_url ? (
                            <div className="font-script text-3xl mb-2">{atob(selectedContract.client_signature_url.replace('data:text/plain;base64,', ''))}</div>
                          ) : (
                            <span>{selectedContract.talentName.split(" ")[0]} (Signed)</span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs uppercase font-semibold">Client Signature</p>
                    {selectedContract?.status !== 'pending_signature' && (
                      <p className="text-[10px] text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sign Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sign Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedContract && handleSign(selectedContract.id)} disabled={isSigning}>
              {isSigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign & Accept
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contracts;
