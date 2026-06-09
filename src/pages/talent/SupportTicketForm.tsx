import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Paperclip,
  CheckCircle2
} from "lucide-react";
import { notifyUser } from "@/utils/notifications";
import { sendSupportTicketCreatedEmail } from "@/lib/email/triggers";

const categories = [
  { value: "payment", label: "Payment & Invoicing" },
  { value: "job", label: "Job & Contracts" },
  { value: "technical", label: "Platform Technical Issue" },
  { value: "talent_issue", label: "Account Support" },
  { value: "billing", label: "Billing" },
  { value: "other", label: "Other Inquiry" },
];

const priorities = [
  { value: "low", label: "Low", description: "General inquiry, no urgency" },
  { value: "medium", label: "Medium", description: "Needs attention within a few days" },
  { value: "high", label: "High", description: "Urgent, needs quick resolution" },
  { value: "urgent", label: "Urgent", description: "Critical issue, immediate attention needed" },
];

const SupportTicketForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    priority: "medium",
    subject: "",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.subject || !formData.description) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields to submit your request.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Session expired",
        description: "Please sign in again to submit a support request.",
        variant: "destructive",
      });
      navigate("/auth/login?portal=talent");
      return;
    }

    setLoading(true);
    try {
      // NOTE: We are intentionally preserving the exact DB insert logic as instructed
      const { data, error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject,
        description: formData.description,
        status: "open",
      }).select().single();

      if (error) throw error;

      await notifyUser(
        user.id,
        "Support Ticket Created",
        `Your ticket "${formData.subject}" has been created. ID: ${data.id}`,
        "support",
        `/talent/support/${data.id}`
      );

      try {
          await sendSupportTicketCreatedEmail({
              email: user.email || '',
              ticketId: data.id,
              isTalent: true,
              subject: formData.subject,
              description: formData.description
          });
      } catch (e) {
          console.error("Failed to send support ticket email", e);
      }

      toast({
        title: "Support ticket created.",
        description: "Our team will review your request shortly.",
      });

      navigate(`/talent/support/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/talent/support")} className="h-8 w-8 text-gray-400 hover:text-gray-900 -ml-2 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Submit a request</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-8">
            
            {/* Category */}
            <div className="space-y-2.5 max-w-lg">
              <Label className="text-gray-900 font-medium">Issue Category <span className="text-red-500">*</span></Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="border-gray-300 shadow-sm h-10 w-full focus:ring-brand-primary/20">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2.5">
              <Label className="text-gray-900 font-medium">Subject <span className="text-red-500">*</span></Label>
              <Input
                placeholder=""
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="border-gray-300 shadow-sm h-10 w-full focus:ring-brand-primary/20 transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-2.5">
              <Label className="text-gray-900 font-medium">Description <span className="text-red-500">*</span></Label>
              <p className="text-sm text-gray-500 mb-2">Please enter the details of your request. A member of our support staff will respond as soon as possible.</p>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 shadow-sm min-h-[160px] resize-y focus:ring-brand-primary/20 transition-all text-base sm:text-sm"
              />
            </div>

            {/* Priority & Upload Row */}
            <div className="grid sm:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
               
               {/* Priority */}
               <div className="space-y-2.5">
                  <Label className="text-gray-900 font-medium">Priority Level</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="border-gray-300 shadow-sm h-10 w-full focus:ring-brand-primary/20">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {priorities.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center">
                           <span className="font-medium text-gray-900">{p.label}</span>
                           <span className="text-xs text-gray-400 ml-2 hidden sm:inline-block">({p.description})</span>
                        </div>
                        </SelectItem>
                     ))}
                  </SelectContent>
                  </Select>
               </div>

               {/* Attachments */}
               <div className="space-y-2.5">
                  <Label className="text-gray-900 font-medium">Attachments</Label>
                  <div className="relative">
                     <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                     />
                     <label 
                        htmlFor="file-upload" 
                        className="flex items-center justify-center w-full h-10 px-4 border border-gray-300 border-dashed rounded-md text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-colors shadow-sm"
                     >
                        <Paperclip className="h-4 w-4 mr-2 text-gray-400" />
                        {file ? <span className="truncate max-w-[200px]">{file.name}</span> : <span>Add file</span>}
                     </label>
                  </div>
               </div>

            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-6">
           <Button type="button" variant="ghost" onClick={() => navigate("/talent/support")} className="text-gray-500 hover:text-gray-900">
              Cancel
           </Button>
           <Button 
              type="submit" 
              disabled={loading || !formData.category || !formData.subject || !formData.description}
              className="bg-brand-primary text-white hover:bg-brand-primary/90 shadow-sm min-w-[120px]"
           >
              {loading ? "Submitting..." : "Submit request"}
           </Button>
        </div>
      </form>
    </div>
  );
};

export default SupportTicketForm;
