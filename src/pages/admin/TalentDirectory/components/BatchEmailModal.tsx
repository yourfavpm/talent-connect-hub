import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { sendEmail } from "@/lib/email/emailService";
import { Mail, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BatchEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTalents: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  }[];
}

const BatchEmailModal = ({ isOpen, onClose, selectedTalents }: BatchEmailModalProps) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSend = async () => {
    if (!subject || !body) {
      toast.error("Please fill in both subject and message body.");
      return;
    }

    setIsSending(true);
    setProgress(0);
    setErrors([]);
    
    const total = selectedTalents.length;
    let successCount = 0;

    for (let i = 0; i < total; i++) {
      const talent = selectedTalents[i];
      
      // Personalize body
      const personalizedBody = body
        .replace(/{{first_name}}/g, talent.first_name || "there")
        .replace(/{{last_name}}/g, talent.last_name || "")
        .replace(/\n/g, '<br/>'); // Simple conversion for HTML email sending if needed

      try {
        const success = await sendEmail({
          to: talent.email,
          toName: `${talent.first_name} ${talent.last_name}`,
          subject: subject,
          htmlTemplate: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
              <div style="padding: 20px; background: white;">
                ${personalizedBody}
              </div>
              <div style="padding: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                <p>Best regards,<br/><strong>The OPSlyHR Team</strong></p>
                <p><a href="https://opslyhr.com" style="color: #0f2147; text-decoration: none;">opslyhr.com</a></p>
              </div>
            </div>
          `,
          priority: 'normal'
        });

        if (success) {
          successCount++;
        } else {
          setErrors(prev => [...prev, talent.email]);
        }
      } catch (err) {
        setErrors(prev => [...prev, talent.email]);
      }

      setProgress(Math.round(((i + 1) / total) * 100));
      // Small delay to prevent rate limit spikes
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsSending(false);
    setCompleted(true);
    
    if (successCount === total) {
      toast.success(`Successfully sent ${total} emails!`);
    } else {
      toast.warning(`Sent ${successCount} of ${total} emails. Some failed.`);
    }
  };

  const resetAndClose = () => {
    setSubject("");
    setBody("");
    setIsSending(false);
    setProgress(0);
    setCompleted(false);
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSending && resetAndClose()}>
      <DialogContent className="sm:max-w-[600px] border-none shadow-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-white/10 p-2 rounded-lg">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <DialogTitle className="text-xl">Broadcast Email</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 font-medium">
            Sending to {selectedTalents.length} selected talent{selectedTalents.length === 1 ? "" : "s"}
          </DialogDescription>
        </DialogHeader>

        {!completed ? (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Email Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Important Update Regarding Your Profile"
                  disabled={isSending}
                  className="h-12 border-slate-100 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="body" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Message Content</Label>
                  <div className="flex gap-2">
                    <code className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{"{{first_name}}"}</code>
                    <code className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{"{{last_name}}"}</code>
                  </div>
                </div>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Hello {{first_name}}, ..."
                  disabled={isSending}
                  className="min-h-[250px] border-slate-100 focus:ring-blue-500/10 focus:border-blue-500 font-light resize-none leading-relaxed"
                />
              </div>
            </div>

            {isSending && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Sending broadcast...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-slate-100" />
              </div>
            )}

            <DialogFooter className="pt-4 gap-2">
              <Button 
                variant="ghost" 
                onClick={resetAndClose} 
                disabled={isSending}
                className="font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={isSending || selectedTalents.length === 0}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 shadow-lg shadow-slate-200"
              >
                {isSending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</>
                ) : (
                  <>Send Broadcast</>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Broadcast Complete</h3>
              <p className="text-slate-500 mt-2">
                Your message has been processed. 
                {errors.length > 0 && ` ${errors.length} emails failed to deliver.`}
              </p>
            </div>
            
            {errors.length > 0 && (
              <div className="w-full bg-red-50 p-4 rounded-xl border border-red-100 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Failed Emails</p>
                </div>
                <ScrollArea className="h-[100px] w-full">
                  <div className="space-y-1">
                    {errors.map((email, idx) => (
                      <p key={idx} className="text-xs text-red-600 font-medium">{email}</p>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <Button onClick={resetAndClose} className="w-full bg-slate-900 hover:bg-slate-800 font-bold h-12 rounded-xl">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BatchEmailModal;
