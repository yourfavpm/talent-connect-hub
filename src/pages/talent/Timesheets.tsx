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
  Clock,
  Plus,
  Calendar,
  FileText,
  CheckCircle,
  Timer,
  XCircle,
  AlertCircle,
  Building2,
  ChevronRight,
  DollarSign,
  Edit
} from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface Timesheet {
  id: string;
  week_start: string;
  week_end: string;
  total_hours: number;
  status: string;
  submitted_at: string | null;
  rejection_reason: string | null;
  contract: {
    contract_number: string;
    role_title: string;
    weekly_hours: number;
    talent_rate: number;
    billing_mode: string;
    tracking_enabled: boolean;
    client: {
      company_name: string;
    };
  };
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "text-slate-700 bg-slate-50 border-slate-200", icon: <Edit className="h-3.5 w-3.5" /> },
  submitted: { label: "Pending Approval", color: "text-amber-700 bg-amber-50 border-amber-200", icon: <Timer className="h-3.5 w-3.5" /> },
  approved: { label: "Approved", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  rejected: { label: "Rejected", color: "text-red-700 bg-red-50 border-red-200", icon: <XCircle className="h-3.5 w-3.5" /> },
  paid: { label: "Paid", color: "text-blue-700 bg-blue-50 border-blue-200", icon: <CheckCircle className="h-3.5 w-3.5" /> },
};

const TalentTimesheets = () => {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchTimesheets = async () => {
    try {
      const { data: talent } = await supabase
        .from("talents")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!talent) return;

      const { data, error } = await supabase
        .from("timesheets")
        .select(`
          id, week_start, week_end, total_hours, status, submitted_at, rejection_reason,
          contract:contracts (
            contract_number, role_title, weekly_hours, talent_rate, billing_mode, tracking_enabled,
            client:clients ( company_name )
          )
        `)
        .eq("talent_id", talent.id)
        .order("week_start", { ascending: false });

      if (error) throw error;
      setTimesheets(data as any || []); // Casting as `any` because `billing_mode` & `tracking_enabled` might not be in DB types yet
    } catch (error) {
      console.error("Error fetching timesheets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTimesheets();
    }
  }, [user]);


  // derived stats
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  
  const currentWeekTimesheets = timesheets.filter(t => new Date(t.week_start).getTime() === currentWeekStart.getTime());
  const currentWeekHours = currentWeekTimesheets.reduce((acc, t) => acc + (t.total_hours || 0), 0);
  const pendingQty = timesheets.filter((ts) => ts.status === "submitted").length;
  const approvedQty = timesheets.filter((ts) => ts.status === "approved").length;
  const pendingPayoutQty = timesheets.filter((ts) => ts.status === "approved").length; // Simplified proxy

  const drafts = timesheets.filter(t => t.status === "draft");
  const submittedList = timesheets.filter(t => t.status === "submitted");
  const approvedList = timesheets.filter(t => t.status === "approved" || t.status === "paid");
  const rejectedList = timesheets.filter(t => t.status === "rejected");

  const openDrawer = (ts: Timesheet) => {
    setSelectedTimesheet(ts);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 max-w-5xl mx-auto">
        <div className="h-10 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />)}
        </div>
        <div className="h-48 w-full bg-gray-100 animate-pulse rounded-lg mt-4" />
        <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg mt-4" />
      </div>
    );
  }

  const renderTimesheetList = (list: Timesheet[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="py-16 text-center border rounded-xl bg-white border-gray-200 border-dashed">
          <FileText className="h-8 w-8 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((ts) => {
          const statusConfig = STATUS_MAP[ts.status] || STATUS_MAP.draft;
          return (
            <Card 
              key={ts.id} 
              className="group border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow transition-all cursor-pointer bg-white"
              onClick={() => openDrawer(ts)}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-primary transition-colors">
                      {format(new Date(ts.week_start), "MMM d")} - {format(new Date(ts.week_end), "MMM d, yyyy")}
                    </h3>
                    <Badge variant="outline" className={`font-medium px-2 py-0.5 text-[11px] rounded transition-colors ${statusConfig.color}`}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    <span className="truncate">{ts.contract?.client?.company_name}</span>
                    <span className="text-gray-300">•</span>
                    <span className="truncate">{ts.contract?.role_title}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end gap-6 text-sm">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{ts.total_hours} hrs</p>
                    <p className="text-xs text-gray-500">Logged</p>
                  </div>
                  
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 group-hover:text-gray-600 hidden sm:flex">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Timesheets</h1>
          <p className="text-sm text-gray-500 mt-1">Log your hours and track approvals.</p>
        </div>
        <Button asChild className="bg-brand-primary">
          <Link to={getInternalPath("/talent/timesheets/new")}>
            <Plus className="h-4 w-4 mr-2" /> Log Hours
          </Link>
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Week Hours</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{currentWeekHours}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{pendingQty}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
              <Timer className="h-4 w-4 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{approvedQty}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payout Prep</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{pendingPayoutQty}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Week Snapshot */}
      <h2 className="text-base font-semibold text-gray-900 mt-8 mb-4">Current Week Snapshot</h2>
      {currentWeekTimesheets.length === 0 ? (
        <Card className="border-gray-200 shadow-sm bg-gray-50/50">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h3 className="font-semibold text-gray-900">{format(currentWeekStart, "MMM d")} - {format(endOfWeek(now, { weekStartsOn: 1 }), "MMM d, yyyy")}</h3>
                <p className="text-sm text-gray-500 mt-1">Start tracking your hours for this week.</p>
             </div>
             <Button asChild variant="outline" className="bg-white hover:bg-gray-50 shrink-0">
               <Link to={getInternalPath("/talent/timesheets/new")}>Log Hours Now</Link>
             </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
           {currentWeekTimesheets.map(ts => {
             const statusConfig = STATUS_MAP[ts.status] || STATUS_MAP.draft;
             const expected = ts.contract?.weekly_hours || 0;
             return (
               <Card key={ts.id} className="border-gray-200 shadow-sm bg-white overflow-hidden">
                 <div className="flex flex-col md:flex-row">
                   <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-gray-100">
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{format(new Date(ts.week_start), "MMM d")} - {format(new Date(ts.week_end), "MMM d, yyyy")}</span>
                       <Badge variant="outline" className={`font-medium px-2 py-0.5 text-[11px] rounded shadow-none ${statusConfig.color}`}>
                          {statusConfig.label}
                       </Badge>
                     </div>
                     <h3 className="font-semibold text-gray-900">{ts.contract?.client?.company_name} - {ts.contract?.role_title}</h3>
                   </div>
                   
                   <div className="flex md:w-1/3 min-w-[300px] divide-x divide-gray-100 bg-gray-50/50">
                     <div className="flex-1 p-5 flex flex-col justify-center text-center">
                       <p className="text-xs text-gray-500 mb-1">Expected</p>
                       <p className="font-semibold text-gray-900">{expected > 0 ? `${expected}h` : '--'}</p>
                     </div>
                     <div className="flex-1 p-5 flex flex-col justify-center text-center">
                       <p className="text-xs text-gray-500 mb-1">Logged</p>
                       <p className={`font-semibold ${ts.total_hours >= expected && expected > 0 ? "text-emerald-600" : "text-gray-900"}`}>{ts.total_hours}h</p>
                     </div>
                     <div className="flex-1 p-5 flex items-center justify-center">
                        <Button asChild size="sm" variant={ts.status === "draft" ? "default" : "outline"} className={ts.status === "draft" ? "bg-brand-primary shrink-0" : "bg-white shrink-0"}>
                          <Link to={getInternalPath(`/talent/timesheets/${ts.id}`)}>{ts.status === "draft" ? "Edit" : "View"}</Link>
                        </Button>
                     </div>
                   </div>
                 </div>
               </Card>
             );
           })}
        </div>
      )}

      {/* History Tabs */}
      <div className="pt-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Timesheet History</h2>
        <Tabs defaultValue="draft" className="space-y-6">
          <TabsList className="bg-gray-100/80 p-1">
            <TabsTrigger value="draft" className="text-sm">Drafts</TabsTrigger>
            <TabsTrigger value="submitted" className="text-sm">Submitted</TabsTrigger>
            <TabsTrigger value="approved" className="text-sm">Approved</TabsTrigger>
            <TabsTrigger value="rejected" className="text-sm">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="draft" className="focus-visible:outline-none focus-visible:ring-0">
            {renderTimesheetList(drafts, "No draft timesheets.")}
          </TabsContent>
          <TabsContent value="submitted" className="focus-visible:outline-none focus-visible:ring-0">
            {renderTimesheetList(submittedList, "No pending timesheets.")}
          </TabsContent>
          <TabsContent value="approved" className="focus-visible:outline-none focus-visible:ring-0">
            {renderTimesheetList(approvedList, "No approved timesheets found.")}
          </TabsContent>
          <TabsContent value="rejected" className="focus-visible:outline-none focus-visible:ring-0">
            {renderTimesheetList(rejectedList, "No rejected timesheets.")}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 border-l border-gray-200">
          {selectedTimesheet && (
            <div className="flex flex-col h-full bg-gray-50">
              
              {/* Drawer Header */}
              <div className="bg-white px-6 py-8 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {format(new Date(selectedTimesheet.week_start), "MMM d")} - {format(new Date(selectedTimesheet.week_end), "MMM d, yyyy")}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedTimesheet.contract?.client?.company_name}</h2>
                    <p className="text-sm text-gray-600 border border-gray-100 bg-gray-50 px-2 py-0.5 inline-block mt-2 rounded font-medium">{selectedTimesheet.contract?.role_title}</p>
                  </div>
                  <Badge variant="outline" className={`font-medium px-2.5 py-1 text-xs rounded shadow-none ${STATUS_MAP[selectedTimesheet.status]?.color}`}>
                    {STATUS_MAP[selectedTimesheet.status]?.label}
                  </Badge>
                </div>

                <div className="flex gap-4 border-t border-gray-100 mt-6 pt-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Hours</p>
                    <p className="font-semibold text-gray-900 text-lg mt-0.5">{selectedTimesheet.total_hours}</p>
                  </div>
                  {(selectedTimesheet.contract?.weekly_hours || 0) > 0 && (
                     <div>
                       <p className="text-gray-500">Expected</p>
                       <p className="font-medium text-gray-700 mt-1.5">{selectedTimesheet.contract.weekly_hours}</p>
                     </div>
                  )}
                </div>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 p-6 space-y-6">

                {/* Rejection Feedback */}
                {selectedTimesheet.status === "rejected" && selectedTimesheet.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                     <div className="flex items-start gap-3">
                       <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                       <div>
                         <h4 className="text-sm font-semibold text-red-900 mb-1">Rejection Feedback</h4>
                         <p className="text-sm text-red-800 leading-relaxed mb-3">{selectedTimesheet.rejection_reason}</p>
                         <Button asChild size="sm" variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50">
                           <Link to={getInternalPath(`/talent/timesheets/${selectedTimesheet.id}`)}>Edit & Resubmit</Link>
                         </Button>
                       </div>
                     </div>
                  </div>
                )}

                {/* Approvals/Paid Badges */}
                {selectedTimesheet.status === "approved" && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg py-3 px-4 flex items-center gap-3">
                     <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                     <div>
                       <p className="text-sm font-medium text-emerald-900">Approved – Ready for Invoicing</p>
                       <p className="text-xs text-emerald-700 mt-0.5">This timesheet will be included in the next client invoice.</p>
                     </div>
                  </div>
                )}

                {/* Daily Breakdown placeholder (Actual details fetched in the edit form usually, simplified here) */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                     <h4 className="text-sm font-semibold text-gray-900">Summary</h4>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500">
                       Detailed day-by-day logs are available in the editor.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-3 text-xs w-full bg-white">
                      <Link to={getInternalPath(`/talent/timesheets/${selectedTimesheet.id}`)}>View Full Entry Form</Link>
                    </Button>
                  </div>
                </div>

                {/* INVOICE IMPACT PREVIEW CARD - Show if tracking enabled & monthly/bi-weekly */}
                {(selectedTimesheet.contract?.tracking_enabled && (selectedTimesheet.contract?.billing_mode === "monthly" || selectedTimesheet.contract?.billing_mode === "bi-weekly")) && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                       <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><DollarSign className="h-4 w-4 text-gray-400" /> Deduction Preview</h4>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {selectedTimesheet.total_hours < selectedTimesheet.contract.weekly_hours ? (
                         <>
                           <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">Base Weekly Pay:</span>
                              <span className="font-medium text-gray-900">${(selectedTimesheet.contract.weekly_hours * selectedTimesheet.contract.talent_rate).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">Missing Hours:</span>
                              <span className="font-medium text-amber-700">{selectedTimesheet.contract.weekly_hours - selectedTimesheet.total_hours}h</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">Estimated Deduction:</span>
                              <span className="font-medium text-red-600">-${((selectedTimesheet.contract.weekly_hours - selectedTimesheet.total_hours) * selectedTimesheet.contract.talent_rate).toFixed(2)}</span>
                           </div>
                           <div className="h-px bg-gray-100 my-2" />
                           <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900">Projected Payout:</span>
                              <span className="font-bold text-gray-900 text-lg">${(selectedTimesheet.total_hours * selectedTimesheet.contract.talent_rate).toFixed(2)}</span>
                           </div>
                           <p className="text-xs text-gray-400 mt-2 text-center">Final amount determined after client approval and billing cycle ends.</p>
                         </>
                      ) : (
                         <div className="text-center py-2 space-y-2">
                           <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto" />
                           <p className="text-sm font-medium text-gray-900">Hours met or exceeded.</p>
                           <p className="text-xs text-gray-500">No deductions will be applied this week.</p>
                           <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-100">
                              <span className="font-medium text-gray-900 text-sm">Projected Payout:</span>
                              <span className="font-bold text-gray-900">${(selectedTimesheet.total_hours * selectedTimesheet.contract.talent_rate).toFixed(2)}</span>
                           </div>
                         </div>
                      )}
                    </div>
                  </div>
                )}
                
                {(!selectedTimesheet.contract?.tracking_enabled) && (
                   <div className="bg-gray-50 rounded p-4 text-center border border-gray-100">
                      <p className="text-sm text-gray-600">This contract uses fixed billing. Timesheets do not affect payment.</p>
                   </div>
                )}

              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
};

export default TalentTimesheets;
