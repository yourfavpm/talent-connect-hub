import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, DollarSign, ArrowRight } from "lucide-react";

const TASKIVE_MARGIN = 20; // 20% margin

const AdminOffers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

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
      // Calculate talent rate (after Taskive margin)
      const talentRate = offer.hourly_rate * (1 - TASKIVE_MARGIN / 100);
      
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
        hourly_rate: offer.hourly_rate,
        talent_rate: talentRate,
        taskive_margin: TASKIVE_MARGIN,
        weekly_hours: offer.weekly_hours,
        start_date: offer.start_date,
        contract_terms: `This contract is between ${offer.clients?.company_name} and the talent for the role of ${offer.role_title}. The engagement will commence on ${offer.start_date} with ${offer.weekly_hours} hours per week at a rate of $${offer.hourly_rate}/hour.`,
        billing_details: {
          company: offer.clients?.company_name,
          contact: offer.clients?.primary_contact_name,
          address: offer.clients?.billing_address,
        },
        status: "pending",
        created_by: user.id,
      });

      if (error) throw error;

      // Update offer status
      await supabase
        .from("offers")
        .update({ status: "contract_generated" })
        .eq("id", offer.id);

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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-muted text-muted-foreground",
      sent_to_admin: "bg-warning/10 text-warning",
      contract_generated: "bg-success/10 text-success",
      sent_to_client: "bg-primary/10 text-primary",
      signed: "bg-success/10 text-success",
      rejected: "bg-destructive/10 text-destructive",
    };
    return <Badge className={styles[status] || "bg-muted"}>{status.replace(/_/g, " ")}</Badge>;
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Offers Management</h1>
        <p className="text-muted-foreground mt-1">Review offers and generate contracts</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search offers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
                      <Button onClick={() => handleGenerateContract(offer)} disabled={generating}>
                        {generating ? "Generating..." : "Generate Contract"}
                      </Button>
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
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-muted-foreground">Role</Label>
                              <p className="font-medium">{selectedOffer?.role_title}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Status</Label>
                              <p>{selectedOffer && getStatusBadge(selectedOffer.status)}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Talent</Label>
                              <p className="font-medium">
                                {selectedOffer?.talents?.first_name} {selectedOffer?.talents?.last_name}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Client</Label>
                              <p className="font-medium">{selectedOffer?.clients?.company_name}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Hourly Rate</Label>
                              <p className="font-medium">${selectedOffer?.hourly_rate}/hr</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Weekly Hours</Label>
                              <p className="font-medium">{selectedOffer?.weekly_hours} hrs</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Start Date</Label>
                              <p className="font-medium">
                                {selectedOffer?.start_date && new Date(selectedOffer.start_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Duration</Label>
                              <p className="font-medium">{selectedOffer?.duration || "Ongoing"}</p>
                            </div>
                          </div>
                          {selectedOffer?.special_terms && (
                            <div>
                              <Label className="text-muted-foreground">Special Terms</Label>
                              <p className="font-medium">{selectedOffer.special_terms}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminOffers;
