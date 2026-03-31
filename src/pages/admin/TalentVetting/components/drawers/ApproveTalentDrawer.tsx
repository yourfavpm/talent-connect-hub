import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ShieldCheck, Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sendVettingApprovedEmail } from "@/lib/email/triggers";

interface ApproveTalentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent: any;
  onSuccess: () => void;
}

const ApproveTalentDrawer = ({ open, onOpenChange, talent, onSuccess }: ApproveTalentDrawerProps) => {
  const [saving, setSaving] = useState(false);
  const [checks, setChecks] = useState({
    identity: false,
    expertise: false,
    compliance: false,
    ready: false,
  });

  const allChecked = Object.values(checks).every(v => v);

  const handleApprove = async () => {
    if (!allChecked) return;

    try {
      setSaving(true);
      
      // 1. Update Talent Profile Status
      const { error } = await (supabase.from("talent_profiles") as any)
        .update({ 
          status: "VETTED",
          vetted_at: new Date().toISOString(),
          visibility_to_clients: true,
          locked_onboarding: true 
        } as any)
        .eq("id", talent.id);

      if (error) throw error;

      // 2. Map back to talents table for legacy support if needed
      await supabase
        .from("talents")
        .update({ 
          vetting_status: "fully_vetted",
          onboarding_completed: true 
        } as any)
        .eq("user_id", talent.user_id);

      // 3. Log action
      await (supabase.from("vetting_actions") as any)
        .insert({
          user_id: talent.user_id,
          talent_id: talent.id,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action_type: "APPROVE_TALENT",
          notes: "Talent approved through final checklist"
        });

      // 4. Send vetting approval email
      try {
        // @ts-ignore - profiles table may not be in generated types
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, first_name")
          .eq("user_id", talent.user_id)
          .single();

        if (profile?.email) {
          await sendVettingApprovedEmail({
            email: profile.email,
            firstName: profile.first_name || talent.first_name || 'there',
          });
        }
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Don't block approval if email fails
      }
      
      toast.success("Talent vetting approved. Profile is now active.");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to approve talent: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const ChecklistItem = ({ id, label, description }: { id: keyof typeof checks, label: string, description: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors">
        <Checkbox 
            id={id} 
            checked={checks[id]} 
            onCheckedChange={(checked) => setChecks({...checks, [id]: !!checked})}
            className="mt-1"
        />
        <div className="flex-1">
            <Label htmlFor={id} className="text-sm font-bold text-gray-900 block cursor-pointer">{label}</Label>
            <span className="text-[10px] text-gray-400 font-medium leading-tight block mt-0.5">{description}</span>
        </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full p-0">
        <SheetHeader className="p-6 border-b border-gray-100 bg-emerald-50/20">
          <SheetTitle className="text-lg font-bold uppercase tracking-tight text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Final Approval
          </SheetTitle>
          <SheetDescription className="text-xs font-medium text-emerald-600/70">
            Confirm all verification steps are satisfied before making this profile public.
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <section className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-1 text-center block">Approval Checklist</span>
            <div className="space-y-2">
                <ChecklistItem 
                    id="identity" 
                    label="Identity Verified" 
                    description="Government ID and personal details have been cross-checked." 
                />
                <ChecklistItem 
                    id="expertise" 
                    label="Skill Level Assessed" 
                    description="Technical proficiency matches the assigned platform skill level." 
                />
                <ChecklistItem 
                    id="compliance" 
                    label="Compliance Passed" 
                    description="References and background checks (if applicable) are satisfactory." 
                />
                <ChecklistItem 
                    id="ready" 
                    label="Profile Market-Ready" 
                    description="Work history, education, and CV are polished for client viewing." 
                />
            </div>
          </section>

          <section className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-4">
             <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-emerald-700" />
             </div>
             <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">
                Approving this talent will automatically send an <strong>Access Granted</strong> email with their login credentials and next steps.
             </p>
          </section>
        </div>

        <SheetFooter className="p-6 border-t border-gray-100 bg-gray-50/50">
          <Button 
            className="w-full h-12 font-bold uppercase text-[11px] tracking-widest gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200/50"
            disabled={!allChecked || saving}
            onClick={handleApprove}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                    <ShieldCheck className="h-4 w-4" />
                    Complete Approval
                </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ApproveTalentDrawer;
