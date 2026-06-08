import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Building2, 
  SlidersHorizontal, 
  Download,
  MoreHorizontal,
  Eye,
  MessageSquare,
  PowerOff,
  Power
} from "lucide-react";

export default function AdminClients() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          user:user_id (email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast({ title: "Error", description: "Failed to load clients.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const resetFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
      case "active":
        return <Badge className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px] tracking-wider w-fit">Active</Badge>;
      case "rejected":
        return <Badge className="bg-red-50 text-red-700 border-red-200 uppercase text-[10px] tracking-wider w-fit">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px] tracking-wider w-fit">Pending</Badge>;
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.primary_contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.client_id?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-none px-6 lg:px-10 pb-20 animate-fade-in font-inter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Clients</h1>
        <p className="text-sm text-gray-500 mt-1">Manage companies using OpslyHR.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-gray-200 text-sm h-9"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white border-gray-200 text-gray-700 h-9 px-3 w-full sm:w-auto">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {statusFilter !== "all" && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-medium text-blue-800">1</span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Filter Clients</SheetTitle>
                <SheetDescription>
                  Narrow down the client list using the parameters below.
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div className="space-y-3">
                  <Label>Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={statusFilter === "all" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                      className={statusFilter === "all" ? "bg-gray-900 text-white" : ""}
                    >
                      All
                    </Button>
                    <Button 
                      variant={statusFilter === "approved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("approved")}
                      className={statusFilter === "approved" ? "bg-gray-900 text-white" : ""}
                    >
                      Active
                    </Button>
                    <Button 
                      variant={statusFilter === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("pending")}
                      className={statusFilter === "pending" ? "bg-gray-900 text-white" : ""}
                    >
                      Pending
                    </Button>
                    <Button 
                      variant={statusFilter === "rejected" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("rejected")}
                      className={statusFilter === "rejected" ? "bg-gray-900 text-white" : ""}
                    >
                      Inactive
                    </Button>
                  </div>
                </div>
                {/* Visual placeholders for additional filters as per design rules */}
                <div className="space-y-3 opacity-50 pointer-events-none">
                  <Label>Has Active Contracts</Label>
                  <Input placeholder="Any" disabled />
                </div>
                <div className="space-y-3 opacity-50 pointer-events-none">
                  <Label>Outstanding Invoices</Label>
                  <Input placeholder="Any" disabled />
                </div>
              </div>
              <SheetFooter className="flex flex-row justify-between sm:justify-between w-full mt-auto absolute bottom-0 left-0 p-6 border-t bg-white">
                <Button variant="ghost" onClick={resetFilters}>Reset</Button>
                <SheetClose asChild>
                  <Button type="submit">Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          
          <Button variant="outline" size="sm" className="bg-white border-gray-200 text-gray-700 h-9 px-3 hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* List / Empty State */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
          <Building2 className="h-10 w-10 text-gray-300 mb-4" />
          <h3 className="text-sm font-medium text-gray-900">
            {clients.length === 0 ? "No clients yet." : "No clients match your filters."}
          </h3>
          <p className="text-sm text-gray-500 mt-1 text-center max-w-sm">
            {clients.length === 0 
              ? "When companies sign up for OpslyHR, they will appear here." 
              : "Try adjusting your search query or removing some filters to find what you're looking for."}
          </p>
          {clients.length > 0 && (
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4 bg-white">
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium text-xs text-gray-500 uppercase tracking-wider h-11">Company Name</TableHead>
                  <TableHead className="font-medium text-xs text-gray-500 uppercase tracking-wider h-11">Client ID</TableHead>
                  <TableHead className="font-medium text-xs text-gray-500 uppercase tracking-wider h-11">Contact</TableHead>
                  <TableHead className="font-medium text-xs text-gray-500 uppercase tracking-wider h-11 font-mono text-right">Contracts</TableHead>
                  <TableHead className="font-medium text-xs text-gray-500 uppercase tracking-wider h-11 font-mono text-right">Invoices</TableHead>
                  <TableHead className="font-medium text-xs text-gray-500 uppercase tracking-wider h-11">Joined</TableHead>
                  <TableHead className="font-medium text-xs text-gray-500 uppercase tracking-wider h-11">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow 
                    key={client.id} 
                    className="cursor-pointer hover:bg-gray-50/50 group"
                    onClick={() => navigate(`/admin/clients/${client.id}`)}
                  >
                    <TableCell className="py-3">
                      <div className="font-medium text-gray-900 text-sm">{client.company_name}</div>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-500 font-mono italic">{client.client_id}</TableCell>
                    <TableCell className="py-3">
                      <div className="text-sm text-gray-900">{client.primary_contact_name || "N/A"}</div>
                      <div className="text-xs text-gray-500">{client.primary_contact_email}</div>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-900 font-mono text-right">0</TableCell>
                    <TableCell className="py-3 text-sm text-gray-500 font-mono text-right">-</TableCell>
                    <TableCell className="py-3 text-sm text-gray-500">
                      {new Date(client.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="py-3">
                      {getStatusBadge(client.status)}
                    </TableCell>
                    <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}`)}>
                            <Eye className="mr-2 h-4 w-4 text-gray-400" />
                            <span>View details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="mr-2 h-4 w-4 text-gray-400" />
                            <span>Message</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {client.status === 'approved' ? (
                            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700">
                              <PowerOff className="mr-2 h-4 w-4" />
                              <span>Disable</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600 focus:bg-green-50 focus:text-green-700">
                              <Power className="mr-2 h-4 w-4" />
                              <span>Enable</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Mobile Stacked View */}
          <div className="md:hidden space-y-3">
            {filteredClients.map((client) => (
              <div 
                key={client.id}
                onClick={() => navigate(`/admin/clients/${client.id}`)}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm active:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{client.company_name}</h3>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">{client.client_id}</p>
                  </div>
                  {getStatusBadge(client.status)}
                </div>
                
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-gray-900">{client.primary_contact_name || "N/A"}</p>
                  <p className="text-xs text-gray-500">{client.primary_contact_email}</p>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex flex-col">
                      <span className="text-gray-500 mb-0.5">Contracts</span>
                      <span className="font-medium text-gray-900 font-mono">0</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 mb-0.5">Invoices</span>
                      <span className="font-medium text-gray-500 font-mono">-</span>
                    </div>
                  </div>
                  
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}`)}>
                          <Eye className="mr-2 h-4 w-4" /> View details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" /> Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
