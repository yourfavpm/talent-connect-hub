import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Send,
    Upload,
    HelpCircle
} from "lucide-react";
import { notifyUser } from "@/utils/notifications";

const categories = [
    { value: "payment", label: "Payment" },
    { value: "job", label: "Job Related" },
    { value: "technical", label: "Technical Issue" },
    { value: "talent_issue", label: "Talent Issue" },
    { value: "billing", label: "Billing" },
    { value: "other", label: "Other" },
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
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.from("support_tickets").insert({
                user_id: user?.id,
                category: formData.category,
                priority: formData.priority,
                subject: formData.subject,
                description: formData.description,
                status: "open",
            }).select().single();

            if (error) throw error;

            await notifyUser(
                user!.id,
                "Support Ticket Created",
                `Your ticket "${formData.subject}" has been created. ID: ${data.id}`,
                "support",
                `/talent/support/${data.id}`
            );

            toast({
                title: "Ticket Created",
                description: "Your support ticket has been submitted successfully",
            });

            navigate("/talent/support");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create ticket",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/talent/support")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Create Support Ticket</h1>
                    <p className="text-muted-foreground">Describe your issue and we'll help you resolve it</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category & Priority */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Ticket Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorities.map((p) => (
                                            <SelectItem key={p.value} value={p.value}>
                                                <div>
                                                    <span className="font-medium">{p.label}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">{p.description}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Subject *</Label>
                            <Input
                                placeholder="Brief summary of your issue"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description *</Label>
                            <Textarea
                                placeholder="Please describe your issue in detail. Include any relevant information such as dates, error messages, or steps to reproduce the problem."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Attachment (Optional)</Label>
                            <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-accent transition-colors">
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                    className="hidden"
                                    id="file-upload"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        {file ? file.name : "Click to upload screenshots or documents"}
                                    </p>
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-4 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-500 text-white">
                            <HelpCircle className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="font-medium text-blue-900">What happens next?</p>
                            <p className="text-sm text-blue-700">
                                Our support team will review your ticket and respond within 24-48 hours.
                                You'll receive a notification when there's an update.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4 justify-end">
                    <Button variant="outline" type="button" onClick={() => navigate("/talent/support")}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-orange-500 to-red-500"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Ticket
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SupportTicketForm;
