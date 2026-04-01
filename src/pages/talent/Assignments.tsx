import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
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
  FolderKanban,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  Timer,
  Pause,
  XCircle,
  Pen,
  MessageSquare,
  AlertCircle,
  ChevronRight,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

interface Assignment {
  id: string;
  contract_number: string;
  role_title: string;
  hourly_rate: number;
  talent_rate: number;
  weekly_hours: number;
  start_date: string;
  end_date: string | null;
  status: string;
  contract_terms?: string;
  talent_contract_terms?: string;
  talent_signed_at?: string;
  client_signed_at?: string;
  talent_signature_url?: string;
  client: {
    company_name: string;
    primary_contact_name: string;
  };
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: "Active", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  pending: { label: "Pending", color: "text-amber-600 bg-amber-50 border-amber-200", icon: <Timer className="h-3.5 w-3.5" /> },
  completed: { label: "Completed", color: "text-blue-600 bg-blue-50 border-blue-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  paused: { label: "On Hold", color: "text-orange-600 bg-orange-50 border-orange-200", icon: <Pause className="h-3.5 w-3.5" /> },
  terminated: { label: "Terminated", color: "text-red-700 bg-red-50 border-red-200", icon: <XCircle className="h-3.5 w-3.5" /> },
};

const TalentAssignments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Contract_${selectedAssignment?.contract_number || "Document"}`,
  });

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const { data: talent } = await supabase
        .from("talents")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!talent) return;

      const { data, error } = await supabase
        .from("contracts")
        .select(`
          id, contract_number, role_title, hourly_rate, talent_rate, weekly_hours,
          start_date, end_date, status, contract_terms, talent_contract_terms,
          talent_signed_at, client_signed_at, talent_signature_url,
          client:clients (company_name, primary_contact_name)
        `)
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const active = assignments.filter((a) => a.status === "active");
  const pending = assignments.filter((a) => a.status === "pending");
  const completed = assignments.filter((a) => ["completed", "terminated", "paused"].includes(a.status));
  
  const activeCount = active.length;
  const pendingSignatureCount = pending.filter(a => !a.talent_signed_at).length;
  const currentTimesheetsCount = active.length; // Simplified proxy for now without joining timesheets schema

  const openDrawer = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDrawerOpen(true);
  };

  const handleSign = async () => {
    if (!selectedAssignment || !signature.trim()) {
      toast({ title: "Error", description: "Please enter your signature", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const signatureUrl = `data:text/plain;base64,${btoa(signature)}`;

      const { error } = await supabase
        .from('contracts')
        .update({
          talent_signed_at: new Date().toISOString(),
          talent_signature_url: signatureUrl,
          status: 'active'
        })
        .eq('id', selectedAssignment.id);

      if (error) throw error;

      toast({ title: "Success", description: "Contract signed successfully" });
      setIsSignModalOpen(false);
      setIsDrawerOpen(false);
      setSignature("");
      fetchAssignments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 max-w-5xl mx-auto">
        <div className="h-10 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />)}
        </div>
        <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg mt-4" />
      </div>
    );
  }

  const renderList = (list: Assignment[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="py-16 text-center border rounded-xl bg-white border-gray-200 border-dashed">
          <FolderKanban className="h-8 w-8 mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">No assignments found.</p>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((assignment) => {
          const statusConfig = STATUS_MAP[assignment.status] || STATUS_MAP.pending;
          return (
            <Card 
              key={assignment.id} 
              className="group border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow transition-all cursor-pointer bg-white"
              onClick={() => openDrawer(assignment)}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-primary transition-colors truncate">
                        {assignment.role_title}
                      </h3>
                      <Badge variant="outline" className={`font-medium px-2 py-0.5 text-[11px] rounded transition-colors ${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      <span className="truncate font-medium">{assignment.client?.company_name}</span>
                      <span className="text-gray-300 px-1">•</span>
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">#{assignment.contract_number}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Start: {format(new Date(assignment.start_date), "MMM d, yyyy")}</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {assignment.weekly_hours} hrs/wk</span>
                      <span className="flex items-center gap-1.5 font-medium text-gray-700 bg-gray-50 px-2 rounded-full"><DollarSign className="h-3 w-3 text-gray-400" /> ${assignment.talent_rate}/hr</span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex items-center justify-end">
                     {assignment.status === "pending" && !assignment.talent_signed_at && (
                       <Button size="sm" variant="outline" className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50 h-8 text-xs font-medium mr-3 hidden sm:flex" onClick={(e) => { e.stopPropagation(); openDrawer(assignment); }}>
                         Signature Required
                       </Button>
                     )}
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-100 hidden sm:flex">
                       <ChevronRight className="h-4 w-4" />
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Assignments</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your active and past work engagements.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{activeCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{completed.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <FolderKanban className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Signatures</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{pendingSignatureCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Pen className="h-4 w-4 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Timesheets</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{currentTimesheetsCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Content */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-gray-100/80 p-1">
          <TabsTrigger value="active" className="text-sm">Active</TabsTrigger>
          <TabsTrigger value="pending" className="text-sm relative">
            Pending Signature
            {pendingSignatureCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-sm">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="focus-visible:outline-none focus-visible:ring-0">
          {renderList(active, "You have no active assignments right now.")}
        </TabsContent>
        
        <TabsContent value="pending" className="focus-visible:outline-none focus-visible:ring-0">
          {renderList(pending, "No contracts pending signature.")}
        </TabsContent>

        <TabsContent value="completed" className="focus-visible:outline-none focus-visible:ring-0">
          {renderList(completed, "No completed assignments yet.")}
        </TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 border-l border-gray-200 sm:rounded-l-2xl">
          {selectedAssignment && (
            <div className="flex flex-col h-full bg-white">
              <div className="px-6 py-8 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-3">
                   <Badge variant="outline" className={`font-medium px-2.5 py-1 text-xs rounded shadow-none ${STATUS_MAP[selectedAssignment.status]?.color}`}>
                     {STATUS_MAP[selectedAssignment.status]?.icon}
                     <span className="ml-1.5">{STATUS_MAP[selectedAssignment.status]?.label}</span>
                   </Badge>
                   <span className="font-mono text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500">Contract #{selectedAssignment.contract_number}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedAssignment.role_title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{selectedAssignment.client?.company_name}</span>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-8">
                
                {selectedAssignment.status === "pending" && !selectedAssignment.talent_signed_at && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold text-amber-900">Signature Required</h3>
                    </div>
                    <p className="text-sm text-amber-800 mb-4">You have an offer pending your signature. Please review the terms below and sign to activate this assignment.</p>
                    <Button onClick={() => setIsSignModalOpen(true)} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                      <Pen className="h-4 w-4 mr-2" /> Sign Contract
                    </Button>
                  </div>
                )}

                 {/* Contract Summary */}
                 <section>
                   <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center justify-between">
                     <span>Contract Summary</span>
                      <Button variant="ghost" size="sm" onClick={() => handlePrint()} className="h-7 px-2 text-xs text-brand-primary">
                        <Download className="h-3 w-3 mr-1" /> PDF
                      </Button>
                   </h3>
                   <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Service Type</p>
                        <p className="font-medium text-gray-900">Hourly Services</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Expected Commitment</p>
                        <p className="font-medium text-gray-900 flex items-center"><Clock className="h-3.5 w-3.5 mr-1 text-gray-400" /> {selectedAssignment.weekly_hours} hrs/week</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Payment Amount</p>
                        <p className="font-semibold text-gray-900 flex items-center text-base"><DollarSign className="h-4 w-4 text-gray-400" />{selectedAssignment.talent_rate}<span className="text-xs font-normal text-gray-500 ml-1">/ hr</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Timeline</p>
                        <p className="font-medium text-gray-900">
                          {format(new Date(selectedAssignment.start_date), "MMM d, yyyy")} - {selectedAssignment.end_date ? format(new Date(selectedAssignment.end_date), "MMM d, yyyy") : "Ongoing"}
                        </p>
                      </div>
                   </div>
                 </section>

                 <div className="h-px bg-gray-100 w-full" />
                 
                 {/* Timesheet Access - Show only if Active */}
                 {selectedAssignment.status === "active" && (
                   <section>
                     <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Time Tracking</h3>
                     <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-gray-900">Current Week</p>
                          <p className="text-sm text-gray-500 mt-0.5">Log your hours to ensure timely payment.</p>
                        </div>
                        <Button asChild className="shrink-0 bg-brand-primary hover:bg-brand-primary/90">
                           <Link to={getInternalPath("/talent/timesheets/new")}>Log Time</Link>
                        </Button>
                     </div>
                   </section>
                 )}

                 {/* Terms View (Hidden visually, but needed for react-to-print) */}
                  <div className="hidden">
                     <div ref={printRef} className="prose max-w-none p-8 font-sans">
                         <h1 className="text-2xl font-bold mb-4">Talent Services Agreement</h1>
                         <div className="mb-6 grid grid-cols-2 gap-4 text-sm border-b pb-4">
                            <div><strong>Contract #:</strong> {selectedAssignment.contract_number}</div>
                            <div><strong>Date:</strong> {format(new Date(), "MMM d, yyyy")}</div>
                            <div><strong>Client:</strong> {selectedAssignment.client.company_name}</div>
                            <div><strong>Role:</strong> {selectedAssignment.role_title}</div>
                            <div><strong>Rate:</strong> ${selectedAssignment.talent_rate}/hr</div>
                         </div>
                         <div dangerouslySetInnerHTML={{
                             __html: selectedAssignment.talent_contract_terms || selectedAssignment.contract_terms || '<p>Standard OPSlyHR HR contracting terms apply.</p>'
                         }} />
                         <div className="mt-12 pt-8 border-t grid grid-cols-2 gap-8">
                             <div>
                                 <p className="font-bold mb-8">Talent Signature:</p>
                                 <p>{selectedAssignment.talent_signed_at ? `Signed electronically on ${format(new Date(selectedAssignment.talent_signed_at), "MMM d, yyyy")}` : "Pending"}</p>
                             </div>
                             <div>
                                 <p className="font-bold mb-8">Client Signature:</p>
                                 <p>{selectedAssignment.client_signed_at ? `Signed electronically on ${format(new Date(selectedAssignment.client_signed_at), "MMM d, yyyy")}` : "OPSlyHR Automated Signature"}</p>
                             </div>
                         </div>
                     </div>
                  </div>

              </div>

              {/* Action Footer */}
              <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-3 shrink-0">
                <Button variant="outline" className="flex-1 bg-white border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  <MessageSquare className="h-4 w-4 mr-2" /> Message Client
                </Button>
                {selectedAssignment.status === "pending" && !selectedAssignment.talent_signed_at && (
                  <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setIsSignModalOpen(true)}>
                    Sign Contract
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sign Contract Modal */}
      <Dialog open={isSignModalOpen} onOpenChange={setIsSignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Agreement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm text-gray-600">
               By typing your name below, you consent to electronically sign this document and agree to the specified terms of engagement.
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Type your full name to sign</Label>
              <Input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="bg-white border-gray-200 font-medium"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsSignModalOpen(false)} className="bg-white">Cancel</Button>
            <Button onClick={handleSign} disabled={submitting || !signature.trim()} className="bg-brand-primary">
              {submitting ? "Signing..." : "Sign & Accept"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TalentAssignments;
