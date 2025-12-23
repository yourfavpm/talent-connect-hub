import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Building2, Eye, CheckCircle, XCircle } from "lucide-react";

const AdminClients = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClient = async (clientId: string) => {
    try {
      await supabase
        .from("clients")
        .update({ status: "approved" })
        .eq("id", clientId);

      toast({ title: "Client Approved", description: "Client has been approved" });
      fetchClients();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/10 text-success">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/10 text-destructive">Rejected</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning">Pending</Badge>;
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.primary_contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.client_id?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-3xl font-bold text-foreground">Client Management</h1>
        <p className="text-muted-foreground mt-1">View and manage all registered clients</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by company name, email, or client ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No clients found</p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{client.company_name}</h3>
                      {getStatusBadge(client.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">ID:</span> {client.client_id}
                      </div>
                      <div>
                        <span className="font-medium">Contact:</span> {client.primary_contact_name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {client.primary_contact_email}
                      </div>
                      <div>
                        <span className="font-medium">Industry:</span> {client.industry || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {client.status === "pending" && (
                      <Button
                        size="sm"
                        className="bg-success hover:bg-success/90"
                        onClick={() => handleApproveClient(client.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedClient(client)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{selectedClient?.company_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-muted-foreground">Client ID</Label>
                              <p className="font-medium">{selectedClient?.client_id}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Status</Label>
                              <p>{getStatusBadge(selectedClient?.status)}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Industry</Label>
                              <p className="font-medium">{selectedClient?.industry || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Company Size</Label>
                              <p className="font-medium">{selectedClient?.company_size || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Contact Name</Label>
                              <p className="font-medium">{selectedClient?.primary_contact_name}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Contact Email</Label>
                              <p className="font-medium">{selectedClient?.primary_contact_email}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Phone</Label>
                              <p className="font-medium">{selectedClient?.primary_contact_phone || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Country</Label>
                              <p className="font-medium">{selectedClient?.country || "N/A"}</p>
                            </div>
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

export default AdminClients;
