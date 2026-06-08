import React, { useState, useRef } from "react";
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
import { 
  Mail, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Bold,
  Italic,
  List,
  Type
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (tag: string, placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = textarea.value.substring(start, end);
    const content = selection || placeholder;
    
    let formatted = "";
    if (tag === 'ul') {
      formatted = `\n<ul>\n  <li>${content}</li>\n</ul>\n`;
    } else if (tag === 'li') {
      formatted = `<li>${content}</li>`;
    } else {
      formatted = `<${tag}>${content}</${tag}>`;
    }

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    setBody(before + formatted + after);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      const newPos = start + formatted.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

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
      
      // Personalize body (replace variables and keep HTML tags)
      const personalizedBody = body
        .replace(/{{first_name}}/g, talent.first_name || "there")
        .replace(/{{last_name}}/g, talent.last_name || "")
        .replace(/\n/g, '<br/>');

      try {
        const success = await sendEmail({
          to: talent.email,
          toName: `${talent.first_name} ${talent.last_name}`,
          subject: subject,
          htmlTemplate: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                .header { padding: 40px 20px; text-align: center; border-bottom: 1px solid #f1f5f9; }
                .content { padding: 40px 30px; font-size: 16px; color: #334155; }
                .footer { padding: 30px; border-top: 1px solid #f1f5f9; background-color: #f8fafc; font-size: 12px; color: #64748b; text-align: center; }
                b, strong { color: #0f172a; font-weight: 700; }
                ul { padding-left: 20px; margin-bottom: 20px; }
                li { margin-bottom: 8px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                   <img src="https://opslyhr.com/images/logocolored.svg" alt="OpslyHR" style="height: 64px; width: auto; display: block; margin: 0 auto;" />
                </div>
                <div class="content">
                  ${personalizedBody}
                </div>
                <div class="footer">
                  <p>&copy; 2026 OpslyHR</p>
                </div>
              </div>
            </body>
            </html>
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
      <DialogContent className="sm:max-w-[700px] border-none shadow-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-white/10 p-2 rounded-lg">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <DialogTitle className="text-xl">Broadcast Email</DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 font-medium">
            Compose your branded message for {selectedTalents.length} selected talent{selectedTalents.length === 1 ? "" : "s"}
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
                  className="h-12 border-slate-100 focus:ring-blue-500/10 focus:border-blue-500 font-medium bg-slate-50/30"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="body" className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Message Content</Label>
                  <TooltipProvider>
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-md border border-slate-100">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyFormat('b')}>
                            <Bold className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bold</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyFormat('i')}>
                            <Italic className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Italic</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyFormat('ul', 'Item')}>
                            <List className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bullet List</TooltipContent>
                      </Tooltip>
                      <div className="w-px h-4 bg-slate-200 mx-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-mono" onClick={() => applyFormat('first_name', '{{first_name}}')}>
                             {"{fn}"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Insert First Name</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
                <Textarea
                  ref={textareaRef}
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Hello {{first_name}}, ..."
                  disabled={isSending}
                  className="min-h-[300px] border-slate-100 focus:ring-blue-500/10 focus:border-blue-500 font-light resize-none leading-relaxed bg-white"
                />
              </div>
            </div>

            {isSending && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Sending broadcast...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-slate-100 animate-pulse" />
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
                disabled={isSending || !subject || !body || selectedTalents.length === 0}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-10 shadow-lg shadow-slate-200 h-11"
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
          <div className="p-16 flex flex-col items-center text-center space-y-6">
            <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Broadcast Complete</h3>
              <p className="text-slate-500 mt-2 text-lg">
                Your messages have been delivered to {selectedTalents.length - errors.length} talent{selectedTalents.length === 1 ? "" : "s"}.
                {errors.length > 0 && ` ${errors.length} failed.`}
              </p>
            </div>
            
            {errors.length > 0 && (
              <div className="w-full bg-red-50 p-6 rounded-2xl border border-red-100 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-xs font-bold text-red-700 uppercase tracking-widest">Delivery Failures</p>
                </div>
                <ScrollArea className="h-[120px] w-full">
                  <div className="space-y-1.5">
                    {errors.map((email, idx) => (
                      <p key={idx} className="text-xs text-red-600 font-medium flex items-center gap-2">
                        <span className="h-1 w-1 bg-red-300 rounded-full" /> {email}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <Button onClick={resetAndClose} className="w-full bg-slate-900 hover:bg-slate-800 font-bold h-14 rounded-2xl text-lg mt-4 shadow-xl shadow-slate-200">
              Return to Directory
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BatchEmailModal;
