import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Clock, MessageSquare, Mail, Building } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const AdminConsultations = () => {
    const { toast } = useToast();
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchConsultations();
    }, [statusFilter]);

    const fetchConsultations = async () => {
        setLoading(true);
        try {
            let query = supabase.from("consultations" as any).select("*").order("created_at", { ascending: false });

            if (statusFilter !== "all") {
                query = query.eq("status", statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setConsultations(data || []);
        } catch (error: any) {
            console.error("Error fetching consultations:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase.from("consultations" as any).update({ status: newStatus }).eq("id", id);
            if (error) throw error;
            toast({ title: "Updated", description: "Consultation status updated." });
            fetchConsultations();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const filteredConsultations = consultations.filter(c =>
        filterSearch(c, searchQuery)
    );

    function filterSearch(c: any, query: string) {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
            (c.first_name + " " + c.last_name).toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.company || "").toLowerCase().includes(q)
        );
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Consultation Requests</h1>
                <p className="text-muted-foreground mt-1">Manage incoming booking requests</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4">
                {filteredConsultations.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground">No consultations found.</p>
                    </div>
                ) : (
                    filteredConsultations.map((consultation) => (
                        <Card key={consultation.id}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between md:justify-start gap-4">
                                            <h3 className="text-lg font-semibold">{consultation.first_name} {consultation.last_name}</h3>
                                            <Badge variant={
                                                consultation.status === 'pending' ? 'destructive' :
                                                    consultation.status === 'contacted' ? 'default' : 'secondary'
                                            }>
                                                {consultation.status}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                <a href={`mailto:${consultation.email}`} className="hover:underline">{consultation.email}</a>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Building className="h-4 w-4" />
                                                {consultation.company || "N/A"}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Pref: {consultation.preferred_date || "Any Date"}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                Pref: {consultation.preferred_time || "Any Time"}
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 p-3 rounded-lg text-sm">
                                            <p className="font-medium text-foreground mb-1">Objective: {consultation.objective}</p>
                                            <p className="text-muted-foreground">{consultation.details}</p>
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                            Requested: {new Date(consultation.created_at).toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col gap-2">
                                        {consultation.status === 'pending' && (
                                            <Button size="sm" onClick={() => handleStatusUpdate(consultation.id, 'contacted')}>
                                                Mark as Contacted
                                            </Button>
                                        )}
                                        {consultation.status !== 'closed' && (
                                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(consultation.id, 'closed')}>
                                                Close Request
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminConsultations;
