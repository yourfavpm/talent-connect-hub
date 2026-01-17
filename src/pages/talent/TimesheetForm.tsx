import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    Clock,
    Calendar,
    Upload,
    Save,
    Send,
    ArrowLeft,
    FileText,
    Trash2
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";

interface Contract {
    id: string;
    contract_number: string;
    role_title: string;
    weekly_hours: number;
    client: {
        company_name: string;
    };
}

const TimesheetForm = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [talentId, setTalentId] = useState<string>("");

    const [formData, setFormData] = useState({
        contract_id: "",
        week_start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
        week_end: format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
        total_hours: 0,
        notes: "",
    });

    const [dailyHours, setDailyHours] = useState<Record<string, number>>({
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
    });

    const [file, setFile] = useState<File | null>(null);
    const [existingFileUrl, setExistingFileUrl] = useState<string>("");

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, id]);

    const fetchData = async () => {
        try {
            // Get talent
            const { data: talent } = await supabase
                .from("talents")
                .select("id")
                .eq("user_id", user?.id)
                .single();

            if (!talent) return;
            setTalentId(talent.id);

            // Get active contracts
            const { data: contractsData } = await supabase
                .from("contracts")
                .select(`
          id,
          contract_number,
          role_title,
          weekly_hours,
          client:clients (
            company_name
          )
        `)
                .eq("talent_id", talent.id)
                .eq("status", "active");

            setContracts(contractsData || []);

            // If editing, load existing timesheet
            if (id) {
                const { data: timesheet } = await supabase
                    .from("timesheets")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (timesheet) {
                    setFormData({
                        contract_id: timesheet.contract_id,
                        week_start: timesheet.week_start,
                        week_end: timesheet.week_end,
                        total_hours: timesheet.total_hours,
                        notes: timesheet.notes || "",
                    });

                    // Load timesheet entries
                    const { data: entries } = await supabase
                        .from("timesheet_entries")
                        .select("*")
                        .eq("timesheet_id", id);

                    if (entries) {
                        const hours: Record<string, number> = { ...dailyHours };
                        entries.forEach((entry) => {
                            const dayOfWeek = format(new Date(entry.date), "EEEE").toLowerCase();
                            hours[dayOfWeek] = entry.hours;
                        });
                        setDailyHours(hours);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleWeekChange = (date: string) => {
        const selectedDate = new Date(date);
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

        setFormData({
            ...formData,
            week_start: format(weekStart, "yyyy-MM-dd"),
            week_end: format(weekEnd, "yyyy-MM-dd"),
        });
    };

    const calculateTotalHours = () => {
        return Object.values(dailyHours).reduce((sum, hours) => sum + (hours || 0), 0);
    };

    useEffect(() => {
        setFormData((prev) => ({ ...prev, total_hours: calculateTotalHours() }));
    }, [dailyHours]);

    const handleSave = async (submit: boolean = false) => {
        if (!formData.contract_id) {
            toast({
                title: "Error",
                description: "Please select an assignment",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            const timesheetData = {
                talent_id: talentId,
                contract_id: formData.contract_id,
                week_start: formData.week_start,
                week_end: formData.week_end,
                total_hours: formData.total_hours,
                status: submit ? "submitted" : "draft",
                submitted_at: submit ? new Date().toISOString() : null,
            };

            let timesheetId = id;

            if (id) {
                // Update existing
                await supabase
                    .from("timesheets")
                    .update(timesheetData)
                    .eq("id", id);
            } else {
                // Create new
                const { data, error } = await supabase
                    .from("timesheets")
                    .insert(timesheetData)
                    .select()
                    .single();

                if (error) throw error;
                timesheetId = data.id;
            }

            // Save daily entries
            if (timesheetId) {
                // Delete existing entries
                await supabase
                    .from("timesheet_entries")
                    .delete()
                    .eq("timesheet_id", timesheetId);

                // Insert new entries
                const entries = Object.entries(dailyHours)
                    .filter(([_, hours]) => hours > 0)
                    .map(([day, hours], index) => ({
                        timesheet_id: timesheetId,
                        date: format(addDays(new Date(formData.week_start), index), "yyyy-MM-dd"),
                        hours,
                        description: formData.notes,
                    }));

                if (entries.length > 0) {
                    await supabase.from("timesheet_entries").insert(entries);
                }
            }

            toast({
                title: submit ? "Timesheet Submitted" : "Timesheet Saved",
                description: submit
                    ? "Your timesheet has been submitted for approval"
                    : "Your timesheet has been saved as draft",
            });

            navigate("/talent/timesheets");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save timesheet",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/talent/timesheets")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{id ? "Edit Timesheet" : "New Timesheet"}</h1>
                    <p className="text-muted-foreground">Submit your weekly work hours</p>
                </div>
            </div>

            {contracts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Active Assignments</h3>
                        <p className="text-muted-foreground text-center">
                            You need an active assignment to submit timesheets.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Assignment Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Assignment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Assignment *</Label>
                                    <Select
                                        value={formData.contract_id}
                                        onValueChange={(value) => setFormData({ ...formData, contract_id: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an assignment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {contracts.map((contract) => (
                                                <SelectItem key={contract.id} value={contract.id}>
                                                    {contract.client?.company_name} — {contract.role_title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Week Starting</Label>
                                    <Input
                                        type="date"
                                        value={formData.week_start}
                                        onChange={(e) => handleWeekChange(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-indigo-600" />
                                        <span className="font-medium text-indigo-900">
                                            Week: {format(new Date(formData.week_start), "MMM d")} — {format(new Date(formData.week_end), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Daily Hours */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-accent" />
                                Daily Hours
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                                    <div key={day} className="space-y-2">
                                        <Label className="capitalize text-xs">{day.slice(0, 3)}</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="24"
                                            step="0.5"
                                            value={dailyHours[day] || ""}
                                            onChange={(e) => setDailyHours({
                                                ...dailyHours,
                                                [day]: parseFloat(e.target.value) || 0
                                            })}
                                            className="text-center"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Total Hours This Week</span>
                                    <span className="text-3xl font-bold">{formData.total_hours}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes & File */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea
                                    placeholder="Add any notes about your work this week..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Upload Proof (Optional)</Label>
                                <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-accent transition-colors">
                                    <input
                                        type="file"
                                        accept=".pdf,.csv,.png,.jpg,.jpeg"
                                        className="hidden"
                                        id="file-upload"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            {file ? file.name : "Click to upload PDF, CSV, or image"}
                                        </p>
                                    </label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-4 justify-end">
                        <Button variant="outline" onClick={() => navigate("/talent/timesheets")}>
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Draft
                        </Button>
                        <Button
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Submit Timesheet
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimesheetForm;
