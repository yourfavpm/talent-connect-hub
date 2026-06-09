import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, DollarSign, ArrowRight, AlertCircle, Briefcase } from "lucide-react";
import { ContractConfigurationModal } from "@/components/admin/ContractConfigurationModal";
import InternalJobModal from "@/components/admin/InternalJobModal";
import { sendTalentOfferEmail, sendClientContractReadyEmail } from "@/lib/email/triggers";

const OPSLYHR_MARGIN = 20; // 20% margin

const AdminOffers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [internalJobModalOpen, setInternalJobModalOpen] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data } = await supabase
        .from("offers")
        .select(`
          *,
          clients(company_name, primary_contact_name, billing_address),
          talents(first_name, last_name, talent_id, email)
        `)
        .order("created_at", { ascending: false });

      setOffers(data || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContract = async (offer: any) => {
    if (!user) return;
    setGenerating(true);

    try {
      // Calculate talent rate (after OpslyHR margin)
      const talentRate = offer.hourly_rate * (1 - OPSLYHR_MARGIN / 100);

      // Generate contract number
      const { data: contractNum } = await supabase.rpc("generate_contract_number");
      const contractNumber = contractNum || `CON-${Date.now()}`;

      // Create contract
      const { error } = await supabase.from("contracts").insert({
        offer_id: offer.id,
        client_id: offer.client_id,
        talent_id: offer.talent_id,
        contract_number: contractNumber,
        role_title: offer.role_title,
        hourly_rate: offer.hourly_rate || 0,
        talent_rate: talentRate || 0,
        taskive_margin: OPSLYHR_MARGIN,
        weekly_hours: offer.weekly_hours || 40,
        start_date: offer.start_date,
        contract_terms: `This contract is between ${offer.clients?.company_name} and the talent for the role of ${offer.role_title}. The engagement will commence on ${offer.start_date} with ${offer.weekly_hours} hours per week at a rate of $${offer.hourly_rate}/hour.`,
        billing_details: {
          company: offer.clients?.company_name,
          contact: offer.clients?.primary_contact_name,
          address: offer.clients?.billing_address,
        },
        status: "pending",
        created_by: user.id,
        admin_sent_at: new Date().toISOString(), // Automatically send to client
      });

      if (error) throw error;

      // Update offer status
      await supabase
        .from("offers")
        .update({ status: "contract_generated" })
        .eq("id", offer.id);

      // Send emails to talent and client
      try {
        await sendTalentOfferEmail({
          talentEmail: offer.talents.email,
          talentName: offer.talents.first_name,
          clientName: offer.clients.company_name,
          jobTitle: offer.role_title,
          rate: `$${offer.hourly_rate}/hr`,
          startDate: offer.start_date,
          offerId: offer.id,
        });

        await sendClientContractReadyEmail({
          clientEmail: offer.clients.primary_contact_email || offer.clients.email,
          clientName: offer.clients.primary_contact_name || offer.clients.company_name,
          talentName: `${offer.talents.first_name} ${offer.talents.last_name}`,
          jobTitle: offer.role_title,
          contractId: contractNumber,
        });
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
        // Don't block the flow if emails fail
      }

      toast({
        title: "Contract Generated",
        description: `Contract ${contractNumber} has been created and sent to client.`,
      });

      fetchOffers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  /* New Config Flow */

  const handleOpenConfig = (offer: any) => {
    navigate(`/admin/offers/${offer.id}/configure`);
  };

  const handleJobCreated = (jobId: string) => {
    // Refresh offers to show newly created internal job
    fetchOffers();
    toast({
      title: "Success",
      description: "Internal job created successfully.",
    });
  };

  const handleConfirmContract = async (config: any) => {
    console.log("handleConfirmContract called with:", config);
    if (!selectedOffer || !user) {
      console.error("Missing selectedOffer or user", { selectedOffer, user });
      return;
    }
    setGenerating(true);

    try {
      const offer = selectedOffer;

      // Generate contract number
      console.log("Generating contract number...");
      const { data: contractNum, error: cnError } = await supabase.rpc("generate_contract_number");
      if (cnError) {
        console.error("Error generating contract number:", cnError);
        // Fallback
      }
      const contractNumber = contractNum || `CON-${Date.now()}`;
      console.log("Contract Number:", contractNumber);

      // Paranoid number parsing
      const rawClientRate = config.billingDetails?.clientRate;
      const rawTalentRate = config.billingDetails?.talentRate;
      const rawMargin = config.billingDetails?.margin;
      const rawHours = offer.weekly_hours;

      console.log("Raw Values:", { rawClientRate, rawTalentRate, rawMargin, rawHours });

      const safeClientRate = isNaN(Number(rawClientRate)) ? 0 : Number(rawClientRate);
      const safeTalentRate = isNaN(Number(rawTalentRate)) ? 0 : Number(rawTalentRate);
      const safeMargin = isNaN(Number(rawMargin)) ? 20 : Number(rawMargin);
      const safeHours = isNaN(Number(rawHours)) ? 40 : Number(rawHours);

      console.log("Safe Values:", { safeClientRate, safeTalentRate, safeMargin, safeHours });

      // Prepare payload
      // Verify all required fields from types.ts
      const payload: any = {
        offer_id: offer.id,
        client_id: offer.client_id,
        talent_id: offer.talent_id,
        contract_number: contractNumber,
        role_title: offer.role_title,
        hourly_rate: safeClientRate, // DB: number
        client_gross_rate: safeClientRate, // DB: number - ensure migration applied
        talent_rate: safeTalentRate, // DB: number
        taskive_margin: safeMargin, // DB: number
        weekly_hours: safeHours, // DB: number
        start_date: offer.start_date, // DB: string
        contract_terms: config.contractTerms,
        billing_details: {
          company: offer.clients?.company_name,
          contact: offer.clients?.primary_contact_name,
          address: offer.clients?.billing_address,
          ...config.billingDetails
        },
        status: "pending", // DB: enum
        created_by: user.id,
        admin_sent_at: new Date().toISOString(),
      };

      console.log("FINAL PAYLOAD TO INSERT:", payload);

      // Create contract
      const { data: insertedContract, error } = await supabase.from("contracts").insert(payload).select().single();

      if (error) {
        console.error("SUPABASE INSERT ERROR:", error);
        throw error;
      }

      console.log("Contract created successfully:", insertedContract);

      // Update offer status
      const { error: offerError } = await supabase
        .from("offers")
        .update({ status: "contract_generated" } as any)
        .eq("id", offer.id);

      if (offerError) {
        console.error("Error updating offer status:", offerError);
        // Don't throw, contract is created
      }

      toast({
        title: "Contract Generated",
        description: `Contract ${contractNumber} has been created.`,
      });

      setConfigModalOpen(false);
      fetchOffers();
    } catch (error: any) {
      console.error("Catch Block Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate contract",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-muted text-muted-foreground",
      sent_to_admin: "bg-warning/10 text-warning",
      contract_generated: "bg-blue-500/10 text-blue-600",
      sent_to_client: "bg-primary/10 text-primary",
      signed: "bg-success/10 text-success",
      rejected: "bg-destructive/10 text-destructive",
    };
    return <Badge className={styles[status] || "bg-muted"}>{status.replace(/_/g, " ")}</Badge>;
  };

  const renderOfferDetails = (offer: any) => {
    const meta = offer.meta || {};
    return (
      <div className="space-y-3 mt-4 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-muted-foreground">Role:</div>
          <div className="font-medium">{offer.role_title}</div>
          
          <div className="text-muted-foreground">Client:</div>
          <div className="font-medium">{offer.clients?.company_name}</div>
          
          <div className="text-muted-foreground">Talent:</div>
          <div className="font-medium">{offer.talents?.first_name} {offer.talents?.last_name}</div>

          <div className="text-muted-foreground">Start Date:</div>
          <div className="font-medium">{new Date(offer.start_date).toLocaleDateString()}</div>
          
          <div className="text-muted-foreground">Weekly Hours:</div>
          <div className="font-medium">{offer.weekly_hours}</div>
        </div>

        {meta.base_salary && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="text-muted-foreground">Base Salary:</div>
            <div className="font-medium">${meta.base_salary}</div>
            {meta.bonus_details && (
              <>
                <div className="text-muted-foreground">Bonus/Equity:</div>
                <div className="font-medium">{meta.bonus_details}</div>
              </>
            )}
          </div>
        )}

        {meta.payment_frequency && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="text-muted-foreground">Rate:</div>
            <div className="font-medium">${offer.hourly_rate} / {meta.payment_frequency.replace('_', ' ')}</div>
          </div>
        )}

        {meta.trial_duration && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="text-muted-foreground">Trial Duration:</div>
            <div className="font-medium">{meta.trial_duration}</div>
            
            <div className="text-muted-foreground">Expected Conversion Salary:</div>
            <div className="font-medium">${meta.expected_conversion_salary}</div>
          </div>
        )}

        {meta.project_price && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="text-muted-foreground">Project Price:</div>
            <div className="font-medium">${meta.project_price}</div>
            
            <div className="text-muted-foreground">Target Completion:</div>
            <div className="font-medium">{meta.target_completion_date}</div>
            
            <div className="text-muted-foreground col-span-2 mt-2">Milestones:</div>
            <div className="font-medium col-span-2 whitespace-pre-wrap bg-gray-50 p-2 rounded">{meta.milestones}</div>
          </div>
        )}

        {offer.special_terms && (
          <div className="pt-2 border-t">
            <div className="text-muted-foreground mb-1">Special Terms & Notes:</div>
            <div className="font-medium whitespace-pre-wrap bg-gray-50 p-2 rounded">{offer.special_terms}</div>
          </div>
        )}
      </div>
    );
  };

  const filteredOffers = offers.filter(
    (offer) =>
      offer.role_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.clients?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.talents?.first_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Offers</h1>
          <p className="text-muted-foreground">Manage talent offers and contract generation</p>
        </div>
        <Button
          onClick={() => setInternalJobModalOpen(true)}
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Create Internal Job
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by talent name, client, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredOffers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No offers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredOffers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* ... Existing Card Content ... */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{offer.role_title}</h3>
                      {getStatusBadge(offer.status)}
                    </div>
                    <p className="text-muted-foreground mb-2">
                      {offer.talents?.first_name} {offer.talents?.last_name}{" "}
                      <ArrowRight className="inline h-4 w-4" />{" "}
                      {offer.clients?.company_name}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${offer.hourly_rate}/hr
                      </span>
                      <span>{offer.weekly_hours} hrs/week</span>
                      <span>Start: {new Date(offer.start_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {offer.status === "sent_to_admin" && (
                      <Button onClick={() => handleOpenConfig(offer)}>
                        Configure Contract
                      </Button>
                    )}
                    {offer.status === "contract_generated" && (
                      <Badge className="bg-blue-500 text-white px-3 py-1">
                        Contract Sent
                      </Badge>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedOffer(offer)}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Offer Details</DialogTitle>
                        </DialogHeader>
                        {/* Details view content */}
                        {renderOfferDetails(offer)}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>


      <ContractConfigurationModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onConfirm={handleConfirmContract}
        offer={selectedOffer}
        loading={generating}
      />


      <InternalJobModal
        open={internalJobModalOpen}
        onOpenChange={setInternalJobModalOpen}
        onJobCreated={handleJobCreated}
      />
    </div>
  );
};

export default AdminOffers;

