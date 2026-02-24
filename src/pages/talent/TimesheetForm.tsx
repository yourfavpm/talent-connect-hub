import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  Building2,
  AlertCircle,
  Save,
  Send,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks, parseISO } from "date-fns";

interface Contract {
  id: string;
  contract_number: string;
  role_title: string;
  weekly_hours: number;
  client: { company_name: string };
}

interface DailyRecord {
  start: string;
  end: string;
  breakDuration: number; // in minutes
  hours: number;
  notes: string;
}

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const TimesheetForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [talentId, setTalentId] = useState<string>("");

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    contract_id: "",
    week_start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    week_end: format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    status: "draft"
  });

  // State mapped by date string "yyyy-MM-dd"
  const [dailyData, setDailyData] = useState<Record<string, DailyRecord>>({});

  useEffect(() => {
    if (user) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const getDayDates = (weekStart: string) => {
    const start = parseISO(weekStart);
    return Array.from({ length: 7 }).map((_, i) => format(addDays(start, i), "yyyy-MM-dd"));
  };

  const initDailyData = (weekStart: string, entries: { date: string; description: string | null; hours: number }[] = []) => {
    const dates = getDayDates(weekStart);
    const newData: Record<string, DailyRecord> = {};
    
    dates.forEach(date => {
      const existing = entries.find(e => e.date.startsWith(date));
      if (existing) {
        let parsedNotes = "";
        let parsedStart = "";
        let parsedEnd = "";
        let parsedBreak = 0;
        
        try {
          const parsed = JSON.parse(existing.description || "{}");
          parsedNotes = parsed.notes || "";
          parsedStart = parsed.start || "";
          parsedEnd = parsed.end || "";
          parsedBreak = parsed.breakDuration || 0;
        } catch {
          parsedNotes = existing.description || "";
        }

        newData[date] = {
          start: parsedStart,
          end: parsedEnd,
          breakDuration: parsedBreak,
          hours: existing.hours || 0,
          notes: parsedNotes
        };
      } else {
        newData[date] = { start: "", end: "", breakDuration: 0, hours: 0, notes: "" };
      }
    });
    setDailyData(newData);
  };

  const fetchData = async () => {
    try {
      const { data: talent } = await supabase.from("talents").select("id").eq("user_id", user?.id).single();
      if (!talent) return;
      setTalentId(talent.id);

      const { data: contractsData } = await supabase
        .from("contracts")
        .select(`id, contract_number, role_title, weekly_hours, client:clients(company_name)`)
        .eq("talent_id", talent.id)
        .eq("status", "active");

      setContracts(contractsData || []);

      if (id) {
        const { data: timesheet } = await supabase.from("timesheets").select("*").eq("id", id).single();
        if (timesheet) {
          setFormData({
            contract_id: timesheet.contract_id,
            week_start: timesheet.week_start,
            week_end: timesheet.week_end,
            status: timesheet.status
          });

          const { data: entries } = await supabase.from("timesheet_entries").select("*").eq("timesheet_id", id);
          initDailyData(timesheet.week_start, entries || []);
        }
      } else {
        if (contractsData && contractsData.length > 0) {
          setFormData(prev => ({ ...prev, contract_id: contractsData[0].id }));
        }
        initDailyData(formData.week_start, []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const start = parseISO(formData.week_start);
    const newStart = direction === "prev" ? subWeeks(start, 1) : addWeeks(start, 1);
    const newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
    
    const weekStartStr = format(newStart, "yyyy-MM-dd");
    setFormData(prev => ({
      ...prev,
      week_start: weekStartStr,
      week_end: format(newEnd, "yyyy-MM-dd")
    }));
    initDailyData(weekStartStr, []);
  };

  const calculateHours = (start: string, end: string, breakMins: number) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    
    let totalMins = (endH * 60 + endM) - (startH * 60 + startM) - (breakMins || 0);
    if (totalMins < 0) totalMins = 0;
    return parseFloat((totalMins / 60).toFixed(2));
  };

  const handleDailyChange = (date: string, field: keyof DailyRecord, value: string | number) => {
    setDailyData(prev => {
      const current = prev[date];
      const updated = { ...current, [field]: value };
      
      if (field === "start" || field === "end" || field === "breakDuration") {
        updated.hours = calculateHours(updated.start, updated.end, updated.breakDuration);
      }
      
      return { ...prev, [date]: updated };
    });
  };

  const totalWeeklyHours = Object.values(dailyData).reduce((sum, d) => sum + (d.hours || 0), 0);
  
  const selectedContract = contracts.find(c => c.id === formData.contract_id);
  const expectedHours = selectedContract?.weekly_hours || 0;
  const isBelowExpected = expectedHours > 0 && totalWeeklyHours < expectedHours;

  const handleSave = async (submit: boolean = false) => {
    if (!formData.contract_id) {
      toast({ title: "Error", description: "Please select an assignment", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const timesheetData = {
        talent_id: talentId,
        contract_id: formData.contract_id,
        week_start: formData.week_start,
        week_end: formData.week_end,
        total_hours: totalWeeklyHours,
        status: submit ? "submitted" : "draft",
        submitted_at: submit ? new Date().toISOString() : null,
      };

      let timesheetId = id;

      if (id) {
        await supabase.from("timesheets").update(timesheetData).eq("id", id);
      } else {
        const { data, error } = await supabase.from("timesheets").insert(timesheetData).select().single();
        if (error) throw error;
        timesheetId = data.id;
      }

      if (timesheetId) {
        await supabase.from("timesheet_entries").delete().eq("timesheet_id", timesheetId);

        const entries = Object.entries(dailyData)
          .filter(([_, data]) => data.hours > 0 || data.notes.length > 0)
          .map(([date, data]) => ({
            timesheet_id: timesheetId,
            date,
            hours: data.hours,
            description: JSON.stringify({
              start: data.start,
              end: data.end,
              breakDuration: data.breakDuration,
              notes: data.notes
            })
          }));

        if (entries.length > 0) {
          await supabase.from("timesheet_entries").insert(entries);
        }
      }

      toast({
        title: submit ? "Timesheet Submitted" : "Draft Saved",
        description: submit ? "Your timesheet has been submitted for approval." : "Your progress has been saved.",
      });

      navigate("/talent/timesheets");
    } catch (error: Error | unknown) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to save timesheet", variant: "destructive" });
    } finally {
      setSaving(false);
      setIsSubmitModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 max-w-6xl mx-auto p-4">
        <div className="h-10 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="h-[600px] w-full bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  const isReadOnly = formData.status === "submitted" || formData.status === "approved" || formData.status === "paid";
  const dates = getDayDates(formData.week_start);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/talent/timesheets")} className="shrink-0 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{isReadOnly ? "View Timesheet" : (id ? "Edit Timesheet" : "Log Hours")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your weekly work hours for invoicing.</p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <Card className="border-gray-200 shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center py-16">
            <FileText className="h-8 w-8 text-gray-300 mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">No Active Assignments</h3>
            <p className="text-sm text-gray-500">You need an active assignment to submit timesheets.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Main Grid Area */}
          <div className="flex-1 space-y-6">
            
            {/* Week & Contract Selector */}
            <Card className="border-gray-200 shadow-sm overflow-visible bg-white">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")} disabled={isReadOnly} className="h-8 w-8 shrink-0">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center justify-center gap-2 w-48 bg-gray-50 border border-gray-200 rounded-md h-8 px-3 text-sm font-medium text-gray-700">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span>{format(parseISO(formData.week_start), "MMM d")} - {format(parseISO(formData.week_end), "MMM d, yyyy")}</span>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => navigateWeek("next")} disabled={isReadOnly} className="h-8 w-8 shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 max-w-xs">
                  <Select value={formData.contract_id} onValueChange={(v) => setFormData({ ...formData, contract_id: v })} disabled={isReadOnly || !!id}>
                    <SelectTrigger className="h-8 text-sm bg-white border-gray-200">
                      <SelectValue placeholder="Select Contract" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.client.company_name} - {c.role_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Daily Grid Table */}
            <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200 text-gray-500 uppercase text-xs tracking-wider">
                      <th className="font-semibold p-4 w-32">Day</th>
                      <th className="font-semibold p-4 w-32">Start Time</th>
                      <th className="font-semibold p-4 w-32">End Time</th>
                      <th className="font-semibold p-4 w-32">Break (min)</th>
                      <th className="font-semibold p-4 w-24 text-center">Total</th>
                      <th className="font-semibold p-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dates.map((dateStr, idx) => {
                      const dayName = DAYS_OF_WEEK[idx];
                      const data = dailyData[dateStr] || { start: "", end: "", breakDuration: 0, hours: 0, notes: "" };
                      const dateObj = parseISO(dateStr);
                      const isWeekend = dayName === "saturday" || dayName === "sunday";
                      
                      return (
                        <tr key={dateStr} className={`group ${isWeekend ? "bg-gray-50/30" : "bg-white"} hover:bg-gray-50/50 transition-colors`}>
                          <td className="p-4 align-top">
                            <p className={`font-medium capitalize ${isWeekend ? 'text-gray-400' : 'text-gray-900'}`}>{dayName}</p>
                            <p className="text-xs text-gray-400">{format(dateObj, "MMM d")}</p>
                          </td>
                          <td className="p-4 align-top">
                            <Input 
                              type="time" 
                              disabled={isReadOnly}
                              value={data.start} 
                              onChange={(e) => handleDailyChange(dateStr, "start", e.target.value)}
                              className="h-9 shadow-none border-gray-200 focus:border-brand-primary"
                            />
                          </td>
                          <td className="p-4 align-top">
                            <Input 
                              type="time" 
                              disabled={isReadOnly}
                              value={data.end} 
                              onChange={(e) => handleDailyChange(dateStr, "end", e.target.value)}
                              className="h-9 shadow-none border-gray-200 focus:border-brand-primary"
                            />
                          </td>
                          <td className="p-4 align-top">
                            <Input 
                              type="number" 
                              min="0"
                              disabled={isReadOnly}
                              value={data.breakDuration || ""} 
                              onChange={(e) => handleDailyChange(dateStr, "breakDuration", parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="h-9 shadow-none border-gray-200 focus:border-brand-primary text-center"
                            />
                          </td>
                          <td className="p-4 align-top text-center pt-5">
                            <span className={`font-semibold text-base ${data.hours > 0 ? "text-emerald-600" : "text-gray-400"}`}>{data.hours > 0 ? data.hours.toFixed(2) : "--"}</span>
                          </td>
                          <td className="p-4 align-top">
                            <Input 
                              disabled={isReadOnly}
                              value={data.notes}
                              onChange={(e) => handleDailyChange(dateStr, "notes", e.target.value)}
                              placeholder="Tasks completed..."
                              className="h-9 shadow-none border-transparent bg-transparent hover:border-gray-200 focus:border-brand-primary focus:bg-white transition-all w-full"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan={4} className="p-4 text-right font-medium text-gray-600">Weekly Total</td>
                      <td className="p-4 text-center font-bold text-lg text-gray-900">{totalWeeklyHours.toFixed(2)}h</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>

          {/* Side Panel: Expected Hours */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <Card className="border-gray-200 shadow-sm bg-gray-50 sticky top-24">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Summary</h3>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-500">Expected Hours</span>
                    <span className="font-semibold text-gray-900">{expectedHours > 0 ? `${expectedHours}h` : "N/A"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-500">Logged Hours</span>
                    <span className={`font-bold ${totalWeeklyHours >= expectedHours && expectedHours > 0 ? "text-emerald-600" : "text-gray-900"}`}>{totalWeeklyHours.toFixed(2)}h</span>
                  </div>

                  {expectedHours > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Remaining</span>
                      <span className="font-medium text-gray-600">{Math.max(0, expectedHours - totalWeeklyHours).toFixed(2)}h</span>
                    </div>
                  )}
                </div>

                {!isReadOnly && isBelowExpected && (
                  <div className="mt-5 p-3 rounded bg-amber-50 border border-amber-200 flex gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      You are currently below expected hours for this period. Submitting below target may result in partial deductions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      {!isReadOnly && contracts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 lg:ml-[260px] transition-all">
           <div className="max-w-6xl mx-auto flex items-center justify-between">
             <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                <span>{selectedContract?.client.company_name} - {selectedContract?.role_title}</span>
             </div>
             <div className="flex items-center gap-3 w-full sm:w-auto">
               <Button onClick={() => handleSave(false)} disabled={saving} variant="outline" className="flex-1 sm:flex-none bg-white text-gray-700 hover:bg-gray-50 border-gray-200 shadow-sm">
                 <Save className="h-4 w-4 mr-2" /> Save Draft
               </Button>
               <Button onClick={() => setIsSubmitModalOpen(true)} disabled={saving} className="flex-1 sm:flex-none bg-brand-primary shadow-sm">
                 <Send className="h-4 w-4 mr-2" /> Submit Week
               </Button>
             </div>
           </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Timesheet</DialogTitle>
            <DialogDescription className="pt-2">
              You are submitting <strong>{totalWeeklyHours.toFixed(2)} hours</strong> for the week of {format(parseISO(formData.week_start), "MMM d")}.
            </DialogDescription>
          </DialogHeader>
          
          {isBelowExpected && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800 flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
               <p>This is below your expected {expectedHours} hours. Check with your client if this requires approval.</p>
            </div>
          )}

          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md border border-gray-100">
             Once submitted, this timesheet will be locked pending client approval. You will need to request a rejection to make further edits.
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSave(true)} disabled={saving} className="bg-brand-primary">
              Confirm & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimesheetForm;
