import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Briefcase } from "lucide-react";

interface InternalJobModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onJobCreated: (jobId: string) => void;
}

const InternalJobModal = ({
    open,
    onOpenChange,
    onJobCreated,
}: InternalJobModalProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [talents, setTalents] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        client_id: "",
        talent_id: "",
        title: "",
        role_summary: "",
        responsibilities: "",
        skills_required: "",
        working_arrangement: "remote",
        expected_hours: "",
    });

    useEffect(() => {
        if (open) {
            fetchClientsAndTalents();
        }
    }, [open]);

    const fetchClientsAndTalents = async () => {
        setLoading(true);
        try {
            // Fetch clients
            const { data: clientsData, error: clientsError } = await supabase
                .from("clients")
                .select("id, company_name")
                .order("company_name");

            if (clientsError) throw clientsError;
            setClients(clientsData || []);

            // Fetch talents
            const { data: talentsData, error: talentsError } = await supabase
                .from("talents")
                .select("id, first_name, last_name")
                .order("first_name");

            if (talentsError) throw talentsError;
            setTalents(talentsData || []);

            // Set default client/talent if available
            if (clientsData && clientsData.length > 0) {
                setFormData(prev => ({ ...prev, client_id: clientsData[0].id }));
            }
            if (talentsData && talentsData.length > 0) {
                setFormData(prev => ({ ...prev, talent_id: talentsData[0].id }));
            }

        } catch (error: any) {
            console.error("Error fetching clients and talents:", error);
            toast({
                title: "Error",
                description: `Failed to load clients or talents: ${error.message}`,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.client_id || !formData.talent_id) {
            toast({
                title: "Missing Information",
                description: "Please select both client and talent",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            // Get current admin user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Create internal job
            const { data: job, error: jobError } = await supabase
                .from("jobs")
                .insert({
                    title: formData.title,
                    description: formData.role_summary,
                    responsibilities: formData.responsibilities,
                    required_skills: formData.skills_required.split(",").map(s => s.trim()),
                    location: formData.working_arrangement,
                    expected_hours: formData.expected_hours || null,
                    client_id: formData.client_id,
                    job_type: "internal",
                    visibility: "private",
                    created_by_admin_id: user.id,
                    status: "internal",
                })
                .select()
                .single();

            if (jobError) throw jobError;

            toast({
                title: "Success",
                description: "Internal job created successfully",
            });

            // Reset form
            setFormData({
                client_id: "",
                talent_id: "",
                title: "",
                role_summary: "",
                responsibilities: "",
                skills_required: "",
                working_arrangement: "remote",
                expected_hours: "",
            });

            onJobCreated(job.id);
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error creating internal job:", error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <DialogTitle>Create Internal Job</DialogTitle>
                            <DialogDescription>
                                This offer has no job posting. Create an internal job record to proceed with contract configuration.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* Client Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="client_id">
                                Client <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.client_id}
                                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.company_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Talent Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="talent_id">
                                Talent <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.talent_id}
                                onValueChange={(value) => setFormData({ ...formData, talent_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select talent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {talents.map((talent) => (
                                        <SelectItem key={talent.id} value={talent.id}>
                                            {talent.first_name} {talent.last_name} ({talent.talent_id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Job Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Job Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Senior Product Manager"
                                required
                            />
                        </div>

                        {/* Role Summary */}
                        <div className="space-y-2">
                            <Label htmlFor="role_summary">
                                Role Summary <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="role_summary"
                                value={formData.role_summary}
                                onChange={(e) => setFormData({ ...formData, role_summary: e.target.value })}
                                placeholder="Brief overview of the role and its purpose..."
                                rows={3}
                                required
                            />
                        </div>

                        {/* Responsibilities */}
                        <div className="space-y-2">
                            <Label htmlFor="responsibilities">
                                Key Responsibilities <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="responsibilities"
                                value={formData.responsibilities}
                                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                                placeholder="List the main responsibilities and duties..."
                                rows={4}
                                required
                            />
                        </div>

                        {/* Required Skills */}
                        <div className="space-y-2">
                            <Label htmlFor="skills_required">
                                Required Skills <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="skills_required"
                                value={formData.skills_required}
                                onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                                placeholder="e.g., Product Strategy, Agile, Stakeholder Management (comma-separated)"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Separate skills with commas
                            </p>
                        </div>

                        {/* Working Arrangement */}
                        <div className="space-y-2">
                            <Label htmlFor="working_arrangement">
                                Working Arrangement <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.working_arrangement}
                                onValueChange={(value) => setFormData({ ...formData, working_arrangement: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="remote">Remote</SelectItem>
                                    <SelectItem value="hybrid">Hybrid</SelectItem>
                                    <SelectItem value="onsite">Onsite</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Expected Weekly Hours */}
                        <div className="space-y-2">
                            <Label htmlFor="expected_hours">Expected Weekly Hours (Optional)</Label>
                            <Input
                                id="expected_hours"
                                type="number"
                                value={formData.expected_hours}
                                onChange={(e) => setFormData({ ...formData, expected_hours: e.target.value })}
                                placeholder="e.g., 40"
                                min="1"
                                max="168"
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave empty if not applicable
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Internal Job"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default InternalJobModal;
