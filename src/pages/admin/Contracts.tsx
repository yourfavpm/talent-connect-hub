import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { generateTalentContractTerms } from "@/utils/contractGeneration";
import { FileText, Send, DollarSign, Clock, Search, Briefcase } from "lucide-react";

const AdminContracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchContracts();
  }, [statusFilter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("contracts")
        .select(`
          *,
          clients (company_name, user_id),
          talents (first_name, last_name, user_id)
        `)
        .not("client_signed_at", "is", null) // Client must have signed
        .not("talent_signed_at", "is", null) // Talent must have signed
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching contracts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTalentContract = async (contract: any) => {
    try {
      // Calculate talent rate if missing, though it should be there.
      const talentRate = contract.talent_rate || (contract.hourly_rate * (1 - (contract.taskive_margin || 20) / 100)).toFixed(2);

      const terms = generateTalentContractTerms(contract, talentRate);

      const { error } = await supabase
        .from("contracts")
        .update({ talent_contract_terms: terms } as any)
        .eq("id", contract.id);

      if (error) throw error;

      toast({
        title: "Talent Contract Generated",
        description: "The subcontractor agreement has been generated.",
      });
      fetchContracts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendToClient = async (contractId: string) => {
    try {
      await supabase
        .from("contracts")
        .update({ admin_sent_at: new Date().toISOString() })
        .eq("id", contractId);

      // Also update the offer status
      const contract = contracts.find((c) => c.id === contractId);
      if (contract?.offer_id) {
        await supabase
          .from("offers")
          .update({ status: "sent_to_client" })
          .eq("id", contract.offer_id);
      }

      toast({
        title: "Contract Sent",
        description: "Contract has been sent to the client for signing.",
      });

      fetchContracts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleActivateContract = async (contractId: string) => {
    try {
      await supabase
        .from("contracts")
        .update({ status: "active" })
        .eq("id", contractId);

      toast({
        title: "Contract Activated",
        description: "Contract is now active.",
      });

      fetchContracts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-warning/10 text-warning",
      active: "bg-success/10 text-success",
      paused: "bg-muted text-muted-foreground",
      completed: "bg-primary/10 text-primary",
      terminated: "bg-destructive/10 text-destructive",
    };
    return <Badge className={styles[status] || "bg-muted"}>{status}</Badge>;
  };

  const filteredContracts = contracts.filter(
    (contract) =>
      (contract.contract_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contract.clients?.company_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contract.talents?.first_name || "").toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-3xl font-bold text-foreground">Contracts Management</h1>
        <p className="text-muted-foreground mt-1">Manage all contracts and agreements</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No contracts found</p>
            </CardContent>
          </Card>
        ) : (
          filteredContracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{contract.contract_number}</h3>
                      {getStatusBadge(contract.status)}
                    </div>
                    <p className="font-medium text-foreground mb-1">{contract.role_title}</p>
                    <p className="text-muted-foreground mb-2">
                      {contract.talents?.first_name} {contract.talents?.last_name} →{" "}
                      {contract.clients?.company_name}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${contract.hourly_rate}/hr (Talent: ${contract.talent_rate}/hr)
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {contract.weekly_hours} hrs/week
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {contract.status === "pending" && !contract.admin_sent_at && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button onClick={() => setSelectedContract(contract)}>
                            <Send className="h-4 w-4 mr-2" />
                            Preview & Send
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Review Contract Before Sending</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-md text-xs whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                              {contract.contract_terms || "No terms generated yet."}
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button onClick={() => handleSendToClient(contract.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                Confirm & Send to Client
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Client Signed -> Generate Talent Contract (With Preview/Edit) */}
                    {contract.client_signed_at && !contract.talent_contract_terms && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" onClick={() => {
                            // Pre-generate terms for preview
                            const talentRate = contract.talent_rate || (contract.hourly_rate * (1 - (contract.taskive_margin || 20) / 100)).toFixed(2);
                            const terms = generateTalentContractTerms(contract, talentRate);
                            // Store temporarily in a local state if possible, or just hack it into the object for the dialog to read?
                            // Better to use a state for 'previewTerms'
                            setSelectedContract({ ...contract, preview_talent_terms: terms, temp_talent_rate: talentRate });
                          }}>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Talent Contract
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Prepare Talent Agreement</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                              <div>
                                <Label>Talent Rate ($/hr)</Label>
                                <div className="font-mono text-lg font-semibold">${selectedContract?.temp_talent_rate || selectedContract?.talent_rate}</div>
                              </div>
                              <div>
                                <Label>Role</Label>
                                <div className="text-sm">{contract.role_title}</div>
                              </div>
                            </div>
                            <div>
                              <Label>Contract Terms (Editable)</Label>
                              <textarea
                                className="w-full h-64 p-3 text-xs font-mono border rounded-md"
                                value={selectedContract?.preview_talent_terms}
                                onChange={(e) => setSelectedContract({ ...selectedContract, preview_talent_terms: e.target.value })}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from("contracts")
                                    .update({ talent_contract_terms: selectedContract.preview_talent_terms } as any)
                                    .eq("id", contract.id);
                                  if (error) throw error;

                                  // Also set status to 'waiting_for_talent' if appropriate, or keep keeping track via null signatures
                                  // Ideally we notify talent here
                                  toast({
                                    title: "Talent Contract Generated",
                                    description: "Terms saved and ready for talent signature.",
                                  });
                                  fetchContracts();
                                } catch (e: any) {
                                  toast({ title: "Error", description: e.message, variant: "destructive" });
                                }
                              }}>
                                <Send className="h-4 w-4 mr-2" />
                                Save & Enable for Talent
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Talent Contract Generated -> Send to Talent (Assuming logic exists or manual handling for now) */}
                    {/* For now, just show status or manual activation if talent signed could be handled outside or via 'Activate' if both signed */}

                    {/* Both Signed -> Activate */}
                    {contract.client_signed_at && contract.talent_signed_at && contract.status !== "active" && (
                      <Button className="bg-success hover:bg-success/90" onClick={() => handleActivateContract(contract.id)}>
                        Activate
                      </Button>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => setSelectedContract(contract)}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Contract: {selectedContract?.contract_number}</DialogTitle>
                        </DialogHeader>
                        {/* ... details ... */}
                        <div className="space-y-6 mt-4">
                          {/* ... existing fields ... */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-muted-foreground">Status</Label>
                              <p>{selectedContract && getStatusBadge(selectedContract.status)}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Role</Label>
                              <p className="font-medium">{selectedContract?.role_title}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Talent</Label>
                              <p className="font-medium">
                                {selectedContract?.talents?.first_name} {selectedContract?.talents?.last_name}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Client</Label>
                              <p className="font-medium">{selectedContract?.clients?.company_name}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Client Rate</Label>
                              <p className="font-medium">${selectedContract?.hourly_rate}/hr</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Talent Rate</Label>
                              <p className="font-medium">${selectedContract?.talent_rate}/hr</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">OPSlyHR Margin</Label>
                              <p className="font-medium">{selectedContract?.taskive_margin}%</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Weekly Hours</Label>
                              <p className="font-medium">{selectedContract?.weekly_hours} hrs</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Start Date</Label>
                              <p className="font-medium">
                                {selectedContract?.start_date && new Date(selectedContract.start_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Client Signed</Label>
                              <p className="font-medium">
                                {selectedContract?.client_signed_at
                                  ? new Date(selectedContract.client_signed_at).toLocaleDateString()
                                  : "Not yet"}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {selectedContract?.contract_terms && (
                              <div className="border p-4 rounded-md">
                                <Label className="text-muted-foreground mb-2 block">Client Contract Terms</Label>
                                <div className="max-h-40 overflow-y-auto text-xs whitespace-pre-wrap bg-muted/30 p-2 rounded">
                                  {selectedContract.contract_terms}
                                </div>
                              </div>
                            )}

                            {selectedContract?.talent_contract_terms && (
                              <div className="border p-4 rounded-md bg-blue-50/50">
                                <Label className="text-blue-600 mb-2 block flex items-center gap-2">
                                  <FileText className="h-3 w-3" /> Talent/Subcontractor Agreement
                                </Label>
                                <div className="max-h-40 overflow-y-auto text-xs whitespace-pre-wrap bg-white p-2 rounded border">
                                  {selectedContract.talent_contract_terms}
                                </div>
                              </div>
                            )}
                          </div>
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

export default AdminContracts;
