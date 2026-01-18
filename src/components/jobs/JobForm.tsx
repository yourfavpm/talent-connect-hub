import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface JobFormData {
    title: string;
    role_needed: string;
    service_model: string;
    work_mode: string;
    location: string;
    preferred_currency: string;
    salary_type: string;
    budget_min: string;
    budget_max: string;
    weekly_hours: string;
    duration: string;
    experience_required: string;
    required_skills: string[];
    responsibilities: string;
    special_notes: string;
}

interface JobFormProps {
    initialData?: JobFormData;
    onSubmit: (data: JobFormData, timeTrackingRequired: boolean) => Promise<void>;
    submitting: boolean;
    isClient?: boolean;
}

const SERVICE_MODELS = [
    { value: "full_time", label: "Full-Time Hire", description: "One-Time Buyout, 15% of talent monthly salary, no time tracking." },
    { value: "trial_to_hire", label: "Trial-to-Hire", description: "Taskive-managed, optional time tracking, buyout possible." },
    { value: "one_time_project", label: "One-Time Project", description: "Taskive-managed, milestone/fixed payment, optional time tracking." },
];

const CURRENCIES = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "NGN", label: "NGN (₦)" },
    { value: "KES", label: "KES (KSh)" },
    { value: "ZAR", label: "ZAR (R)" },
];

const WORK_MODES = [
    { value: "remote", label: "Remote" },
    { value: "onsite", label: "Onsite" },
    { value: "hybrid", label: "Hybrid" },
    { value: "asynchronous", label: "Asynchronous (Any Timezone)" },
];

const SALARY_TYPES = [
    { value: "hourly", label: "Hourly" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "fixed", label: "Fixed Price" },
];

export const JobForm = ({ initialData, onSubmit, submitting, isClient = true }: JobFormProps) => {
    const [formData, setFormData] = useState<JobFormData>(initialData || {
        title: "",
        role_needed: "",
        service_model: "",
        work_mode: "",
        location: "",
        preferred_currency: "USD",
        salary_type: "hourly",
        budget_min: "",
        budget_max: "",
        weekly_hours: "",
        duration: "",
        experience_required: "",
        required_skills: [],
        responsibilities: "",
        special_notes: "",
    });
    const [timeTrackingRequired, setTimeTrackingRequired] = useState(false);
    const [skillInput, setSkillInput] = useState("");
    const [formErrors, setFormErrors] = useState<string[]>([]);

    const handleAddSkill = () => {
        if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
            setFormData(prev => ({
                ...prev,
                required_skills: [...prev.required_skills, skillInput.trim()]
            }));
            setSkillInput("");
        }
    };

    const handleRemoveSkill = (skill: string) => {
        setFormData(prev => ({
            ...prev,
            required_skills: prev.required_skills.filter(s => s !== skill)
        }));
    };

    const getCurrencySymbol = (currency: string) => {
        const symbols: Record<string, string> = {
            USD: "$", EUR: "€", GBP: "£", NGN: "₦", KES: "KSh", ZAR: "R"
        };
        return symbols[currency] || "$";
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors([]);

        const missingFields = [];
        if (!formData.title) missingFields.push("Job Title");
        if (!formData.role_needed) missingFields.push("Role Category");
        if (!formData.service_model) missingFields.push("Service Model");
        if (!formData.work_mode) missingFields.push("Work Mode");
        if (!formData.responsibilities) missingFields.push("Job Responsibilities");

        if (missingFields.length > 0) {
            setFormErrors(missingFields);
            return;
        }

        onSubmit(formData, timeTrackingRequired);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {formErrors.length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Missing Information</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-5 mt-2 text-sm">
                            {formErrors.map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
                <h3 className="font-medium text-foreground">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Job Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Senior Virtual Assistant"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role_needed">Role Category *</Label>
                        <Select
                            value={formData.role_needed}
                            onValueChange={(value) => setFormData({ ...formData, role_needed: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="virtual_assistant">Virtual Assistant</SelectItem>
                                <SelectItem value="customer_support">Customer Support</SelectItem>
                                <SelectItem value="social_media_manager">Social Media Manager</SelectItem>
                                <SelectItem value="product_manager">Product Manager</SelectItem>
                                <SelectItem value="operations_manager">Operations Manager</SelectItem>
                                <SelectItem value="project_manager">Project Manager</SelectItem>
                                <SelectItem value="executive_assistant">Executive Assistant</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-2">
                        <Label htmlFor="service_model">Hiring Model *</Label>
                        <Select
                            value={formData.service_model}
                            onValueChange={(value) => setFormData({ ...formData, service_model: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select hiring model" />
                            </SelectTrigger>
                            <SelectContent>
                                {SERVICE_MODELS.map((model) => (
                                    <SelectItem key={model.value} value={model.value}>
                                        {model.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {formData.service_model && (
                            <p className="text-sm text-muted-foreground mt-1 px-1">
                                {SERVICE_MODELS.find(m => m.value === formData.service_model)?.description}
                            </p>
                        )}
                    </div>

                    {(formData.service_model === 'trial_to_hire' || formData.service_model === 'one_time_project') && (
                        <div className="flex items-center justify-between border-t pt-4 border-border">
                            <div className="space-y-0.5">
                                <Label>Require Time Tracking?</Label>
                                <p className="text-xs text-muted-foreground">
                                    Toggle if you want to see detailed timesheets.
                                </p>
                            </div>
                            <Switch
                                checked={timeTrackingRequired}
                                onCheckedChange={setTimeTrackingRequired}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Work Mode & Location */}
            <div className="space-y-4">
                <h3 className="font-medium text-foreground">Work Mode & Location</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="work_mode">Work Mode *</Label>
                        <Select
                            value={formData.work_mode}
                            onValueChange={(value) => setFormData({ ...formData, work_mode: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select work mode" />
                            </SelectTrigger>
                            <SelectContent>
                                {WORK_MODES.map((mode) => (
                                    <SelectItem key={mode.value} value={mode.value}>
                                        {mode.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            placeholder="e.g., Lagos, Nigeria or Remote"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Compensation */}
            <div className="space-y-4">
                <h3 className="font-medium text-foreground">Compensation</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="preferred_currency">Currency</Label>
                        <Select
                            value={formData.preferred_currency}
                            onValueChange={(value) => setFormData({ ...formData, preferred_currency: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map((curr) => (
                                    <SelectItem key={curr.value} value={curr.value}>
                                        {curr.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="salary_type">Salary Type</Label>
                        <Select
                            value={formData.salary_type}
                            onValueChange={(value) => setFormData({ ...formData, salary_type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {SALARY_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="weekly_hours">Weekly Hours</Label>
                        <Input
                            id="weekly_hours"
                            type="number"
                            placeholder="40"
                            value={formData.weekly_hours}
                            onChange={(e) => setFormData({ ...formData, weekly_hours: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="budget_min">Budget Min ({getCurrencySymbol(formData.preferred_currency)})</Label>
                        <Input
                            id="budget_min"
                            type="number"
                            placeholder="15"
                            value={formData.budget_min}
                            onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="budget_max">Budget Max ({getCurrencySymbol(formData.preferred_currency)})</Label>
                        <Input
                            id="budget_max"
                            type="number"
                            placeholder="25"
                            value={formData.budget_max}
                            onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Requirements */}
            <div className="space-y-4">
                <h3 className="font-medium text-foreground">Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="experience_required">Years of Experience</Label>
                        <Input
                            id="experience_required"
                            type="number"
                            placeholder="3"
                            value={formData.experience_required}
                            onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration</Label>
                        <Select
                            value={formData.duration}
                            onValueChange={(value) => setFormData({ ...formData, duration: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1-3 months">1-3 months</SelectItem>
                                <SelectItem value="3-6 months">3-6 months</SelectItem>
                                <SelectItem value="6-12 months">6-12 months</SelectItem>
                                <SelectItem value="12+ months">12+ months</SelectItem>
                                <SelectItem value="Ongoing">Ongoing</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                    <Label>Required Skills</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add a skill (e.g., Excel, Notion)"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddSkill();
                                }
                            }}
                        />
                        <Button type="button" variant="outline" onClick={handleAddSkill}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    {formData.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.required_skills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="gap-1">
                                    {skill}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => handleRemoveSkill(skill)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
                <h3 className="font-medium text-foreground">Description</h3>
                <div className="space-y-2">
                    <Label htmlFor="responsibilities">Job Responsibilities *</Label>
                    <Textarea
                        id="responsibilities"
                        placeholder="Describe the main responsibilities and day-to-day tasks..."
                        rows={4}
                        value={formData.responsibilities}
                        onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="special_notes">Special Notes (Optional)</Label>
                    <Textarea
                        id="special_notes"
                        placeholder="Any additional requirements or preferences..."
                        rows={3}
                        value={formData.special_notes}
                        onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : isClient ? "Submit for Review" : "Publish Job"}
                </Button>
            </div>
        </form>
    );
};
