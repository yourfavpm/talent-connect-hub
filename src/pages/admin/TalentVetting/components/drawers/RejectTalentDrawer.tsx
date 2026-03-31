import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sendVettingRejectedEmail } from "@/lib/email/triggers";

interface RejectTalentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent: any;
  onSuccess: () => void;
}

const RejectTalentDrawer = ({ open, onOpenChange, talent, onSuccess }: RejectTalentDrawerProps) => {
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");
  const [notifyTalent, setNotifyTalent] = useState(true);

  const handleReject = async () => {
    if (!reason.trim()) return;

    try {
      setSaving(true);
      
      // 1. Update Talent Status
      const { error } = await supabase
        .from("talents" as any)
        .update({ 
          vetting_status: "rejected" as any,
          rejection_reason: reason 
        } as any)
        .eq("id", talent.id);

      if (error) throw error;

      // Send rejection email if notify toggle is on
      if (notifyTalent) {
        try {
          // @ts-ignore - profiles table may not be in generated types
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, first_name")
            .eq("user_id", talent.user_id)
            .single();

          if (profile?.email) {
            await sendVettingRejectedEmail({
              email: profile.email,
              firstName: profile.first_name || talent.first_name || 'there',
              rejectionReasons: reason,
            });
          }
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
          // Don't block rejection if email fails
        }
      }
      
      toast.success("Talent vetting rejected");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to reject talent: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full p-0">
        <SheetHeader className="p-6 border-b border-gray-100 bg-red-50/20">
          <SheetTitle className="text-lg font-black uppercase tracking-tight text-red-700 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Reject Vetting
          </SheetTitle>
          <SheetDescription className="text-xs font-medium text-red-600/70">
            This action will mark the candidate as permanently rejected for current roles.
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 flex-1 overflow-y-auto space-y-8">
          <section className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-1">Reason for Rejection</span>
            <Textarea 
              placeholder="Provide a detailed reason for rejection..."
              className="min-h-[160px] resize-none border-red-100 focus:border-red-200 bg-red-50/10 text-sm p-4 font-medium leading-relaxed"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <AlertCircle className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-500 font-medium leading-tight italic">
                    Internal Tip: Be specific about failed technical criteria or compliance issues.
                </p>
            </div>
          </section>

          <section className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
            <div className="flex-1">
                <Label className="text-xs font-bold text-gray-900 block">Send Notification</Label>
                <span className="text-[10px] text-gray-400 font-medium">Inform the candidate of the decision via email</span>
            </div>
            <Switch 
                checked={notifyTalent} 
                onCheckedChange={setNotifyTalent}
            />
          </section>
        </div>

        <SheetFooter className="p-6 border-t border-gray-100 bg-gray-50/50">
          <Button 
            variant="destructive"
            className="w-full h-12 font-black uppercase text-[11px] tracking-widest gap-2 shadow-xl shadow-red-200/50"
            disabled={!reason.trim() || saving}
            onClick={handleReject}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                    <Trash2 className="h-4 w-4" />
                    Confirm Rejection
                </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RejectTalentDrawer;
