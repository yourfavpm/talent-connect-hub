import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Award, Loader2, Save, Info, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SkillLevel } from "@/types/talent";
import { sendLevelAssignedEmail } from "@/lib/email/triggers";

interface SkillAssessmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent: any;
  onSuccess: () => void;
}

const levels: { value: SkillLevel; label: string; desc: string }[] = [
  { value: "junior", label: "Junior", desc: "0-2 years, foundational skills" },
  { value: "mid", label: "Mid-Level", desc: "2-5 years, independent execution" },
  { value: "senior", label: "Senior", desc: "5-8 years, technical leadership" },
  { value: "lead", label: "Lead / Expert", desc: "8+ years, architectural focus" },
];

const SkillAssessmentDrawer = ({ open, onOpenChange, talent, onSuccess }: SkillAssessmentDrawerProps) => {
  const [saving, setSaving] = useState(false);
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(talent?.overall_skill_level || null);
  const [notes, setNotes] = useState(talent?.skill_assessment_notes || "");
  const [visibleToClient, setVisibleToClient] = useState(talent?.skill_assessment_visible_to_clients ?? true);

  useEffect(() => {
    if (open && talent) {
      setSkillLevel(talent.overall_skill_level);
      setNotes(talent.skill_assessment_notes || "");
      setVisibleToClient(talent.skill_assessment_visible_to_clients ?? true);
    }
  }, [open, talent]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("talents" as any)
        .update({ 
          overall_skill_level: skillLevel,
          skill_assessment_notes: notes,
          skill_assessment_visible_to_clients: visibleToClient
        } as any)
        .eq("id", talent.id);

      if (error) throw error;

      // Send Level Assigned Email
      try {
        const { data: profile } = await (supabase
          .from("profiles") as any)
          .select("email, first_name")
          .eq("user_id", talent.user_id)
          .single();

        if (profile?.email) {
          await sendLevelAssignedEmail({
            email: profile.email,
            firstName: profile.first_name || 'there',
            level: skillLevel as string,
          });
        }
      } catch (emailError) {
        console.error('Failed to send level assigned email:', emailError);
      }
      
      toast.success("Skill assessment updated");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to update assessment: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full p-0">
        <SheetHeader className="p-6 border-b border-gray-100">
          <SheetTitle className="text-lg font-bold uppercase tracking-tight text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Skill Assessment
          </SheetTitle>
          <SheetDescription className="text-xs font-semibold text-gray-400">
            Evaluate the candidate's proficiency and set their platform skill level.
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 flex-1 overflow-y-auto space-y-8">
          <section className="space-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 pl-1">Proficiency Level</span>
            <div className="grid grid-cols-1 gap-2">
              {levels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSkillLevel(level.value)}
                  className={cn(
                    "relative p-4 rounded-xl border text-left transition-all group",
                    skillLevel === level.value 
                      ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600" 
                      : "border-gray-100 hover:border-gray-200 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-xs font-bold uppercase tracking-wider", skillLevel === level.value ? "text-blue-700" : "text-gray-900")}>
                      {level.label}
                    </span>
                    {skillLevel === level.value && <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                  </div>
                  <p className="text-[10px] font-medium text-gray-400">{level.desc}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 pl-1">Assessment Notes</span>
            <Textarea 
              placeholder="Provide internal details on why this skill level was assigned..."
              className="min-h-[140px] resize-none border-gray-100 focus:border-gray-200 bg-gray-50/30 text-sm p-4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          <section className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    {visibleToClient ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                </div>
                <div>
                    <Label className="text-xs font-semibold text-gray-900 block">Client Visibility</Label>
                    <span className="text-[10px] text-gray-400 font-medium">Show assessment to potential clients</span>
                </div>
            </div>
            <Switch 
                checked={visibleToClient} 
                onCheckedChange={setVisibleToClient}
            />
          </section>
        </div>

        <SheetFooter className="p-6 border-t border-gray-100 bg-gray-50/50">
          <Button 
            className="w-full h-12 font-bold uppercase text-[11px] tracking-widest gap-2"
            disabled={!skillLevel || saving}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                    <Save className="h-4 w-4" />
                    Save Assessment
                </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default SkillAssessmentDrawer;
