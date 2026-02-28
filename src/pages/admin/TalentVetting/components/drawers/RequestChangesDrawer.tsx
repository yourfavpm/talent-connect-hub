import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, Send, AlertTriangle, History, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StepChangeRequest } from "@/types/talent";

interface RequestChangesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talentId: string;
  stepKey: string;
  onSuccess: () => void;
}

const commonReasons: Record<string, string[]> = {
  basic_info: ["Identity document is expired", "Name on ID does not match profile", "Proof of address is missing", "Incomplete location details"],
  professional_details: ["Primary role is too vague", "Secondary skills list is missing keywords", "Missing specific tool proficiency"],
  work_history: ["Missing role descriptions", "Overlapping dates in experience", "Missing company names", "Descriptions are too brief"],
  documents: ["CV is in an unsupported format", "Image quality is too low", "Missing clear scan of government ID"],
  education: ["Missing institution name", "Degree title is unclear", "Invalid graduation years"],
  certifications: ["Missing verification link", "Certification is expired"],
  references: ["Missing contact email", "Relationship not specified", "Phone number is invalid"],
};

const RequestChangesDrawer = ({ open, onOpenChange, talentId, stepKey, onSuccess }: RequestChangesDrawerProps) => {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<StepChangeRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (open && talentId && stepKey) {
      fetchHistory();
      setMessage("");
    }
  }, [open, talentId, stepKey]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data, error } = await (supabase.from("vetting_actions" as any) as any)
        .select("*")
        .eq("user_id", talentId) // Note: vetting_actions uses user_id generally, but let's check profile_id usage
        .eq("section_key", stepKey)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory((data as any) || []);
    } catch (error: any) {
      console.error("Failed to load history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      setSaving(true);
      
      // 1. Fetch Profile to get user_id
      const { data: profile } = await (supabase.from("talent_profiles") as any)
        .select("user_id")
        .eq("id", talentId)
        .maybeSingle();
      
      if (!profile) throw new Error("Profile not found");

      // 2. Update Section Status
      const { error: sectionError } = await (supabase.from("talent_profile_sections") as any)
        .update({ 
          status: "CHANGES_REQUESTED",
          last_reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        } as any)
        .eq("user_id", profile.user_id)
        .eq("section_key", stepKey);

      if (sectionError) throw sectionError;

      // 3. Update overall talent profile status
      const { error: profileError } = await (supabase.from("talent_profiles") as any)
        .update({ status: "CHANGES_REQUESTED" } as any)
        .eq("id", talentId);
      
      if (profileError) throw profileError;

      // 4. Log Vetting Action
      await (supabase.from("vetting_actions") as any)
        .insert({
          user_id: profile.user_id,
          talent_id: talentId,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action_type: "REQUEST_CHANGES",
          section_key: stepKey,
          notes: message
        });
      
      toast.success("Change request sent to talent");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to send request: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const reasons = commonReasons[stepKey] || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full p-0">
        <SheetHeader className="p-6 border-b border-gray-100">
          <SheetTitle className="text-lg font-bold uppercase tracking-tight text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Request Changes
          </SheetTitle>
          <SheetDescription className="text-xs font-medium text-gray-400">
            Tell the candidate what they need to fix in the <span className="text-gray-900 font-bold capitalize">{stepKey.replace("_", " ")}</span> section.
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 flex-1 overflow-y-auto space-y-8">
          {reasons.length > 0 && (
            <section className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-1">Common Reasons</span>
                <div className="flex flex-wrap gap-2">
                    {reasons.map((reason, idx) => (
                        <button
                            key={idx}
                            onClick={() => setMessage(reason)}
                            className="px-3 py-1.5 rounded-full border border-gray-100 bg-white text-[10px] font-bold text-gray-600 hover:border-blue-200 hover:bg-blue-50 transition-all uppercase tracking-tight"
                        >
                            {reason}
                        </button>
                    ))}
                </div>
            </section>
          )}

          <section className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-1">Message to Talent</span>
            <Textarea 
              placeholder="e.g. Please re-upload your Government ID, the current one is too blurry to read..."
              className="min-h-[160px] resize-none border-gray-100 focus:border-gray-200 bg-gray-50/30 text-sm p-4 font-medium leading-relaxed"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-100">
                <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-700 font-medium leading-tight">
                    Sending this will notify the talent via email and mark this section as 'Changes Requested'.
                </p>
            </div>
          </section>

          {history.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                    <History className="h-3 w-3 text-gray-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">History for this step</span>
                </div>
                <div className="space-y-3">
                    {history.map((req, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">
                                    {new Date(req.created_at).toLocaleDateString()}
                                </span>
                                {req.resolved_at ? (
                                    <div className="flex items-center gap-1 text-emerald-600">
                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                        <span className="text-[9px] font-bold uppercase">Resolved</span>
                                    </div>
                                ) : (
                                    <span className="text-[9px] font-bold text-orange-500 uppercase">Active</span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-600 font-medium leading-relaxed line-clamp-2 italic">"{req.message}"</p>
                        </div>
                    ))}
                </div>
            </section>
          )}
        </div>

        <SheetFooter className="p-6 border-t border-gray-100 bg-gray-50/50">
          <Button 
            className="w-full h-12 font-bold uppercase text-[11px] tracking-widest gap-2 bg-gray-900 group"
            disabled={!message.trim() || saving}
            onClick={handleSend}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                    <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    Send Request
                </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RequestChangesDrawer;
