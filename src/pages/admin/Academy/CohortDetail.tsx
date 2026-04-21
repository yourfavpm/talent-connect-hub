import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
    Users, 
    Calendar, 
    Bell, 
    FileText, 
    ArrowLeft, 
    Plus, 
    Video, 
    Clock, 
    CheckCircle2, 
    Trash2,
    Settings,
    ChevronRight,
    Loader2,
    MoreVertical,
    ExternalLink,
    Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Cohort {
    id: string;
    name: string;
    course_id: string;
    start_date: string;
    status: string;
    price_usd: number;
    price_naira: number;
}

interface Student {
    id: string;
    student_name: string;
    student_email: string;
    enrollment_status: string;
    is_top_grad: boolean;
    created_at: string;
}

interface Session {
    id: string;
    title: string;
    session_date: string;
    start_time: string;
    meeting_url: string;
    status: string;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    created_at: string;
}

interface Assignment {
    id: string;
    title: string;
    description: string;
    deadline_at: string;
    created_at: string;
}

interface Submission {
    id: string;
    assignment_id: string;
    student_id: string;
    link: string;
    status: string;
    feedback: string;
    grade: string;
    created_at: string;
    assignments: { title: string };
    profiles: { full_name: string; email: string };
}

const CohortDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [cohort, setCohort] = useState<Cohort | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [activeTab, setActiveTab] = useState("students");

    // Form States
    const [newSession, setNewSession] = useState({ title: '', date: '', start_time: '', url: '' });
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
    const [newAssignment, setNewAssignment] = useState({ title: '', description: '', deadline: '' });
    const [isSaving, setIsSaving] = useState(false);

    const fetchCohortData = useCallback(async () => {
        if (!id) return;
        try {
            // 1. Fetch Cohort
            const { data: cohortData, error: cohortError } = await supabase
                .from("cohorts")
                .select("*")
                .eq("id", id)
                .single();

            if (cohortError) throw cohortError;
            setCohort(cohortData as Cohort);

            // 2. Fetch All Data in Parallel
            const [studentsRes, sessionsRes, announcementsRes, assignmentsRes, submissionsRes] = await Promise.all([
                supabase.from("academy_enrollments").select("*").eq("cohort_id", id),
                supabase.from("sessions").select("*").eq("cohort_id", id).order("session_date", { ascending: true }),
                supabase.from("announcements").select("*").eq("cohort_id", id).order("created_at", { ascending: false }),
                supabase.from("assignments").select("*").eq("cohort_id", id).order("created_at", { ascending: false }),
                supabase.from("submissions").select("*, assignments(title), profiles:student_id(full_name, email)").order("created_at", { ascending: false })
            ]);

            setStudents((studentsRes.data as unknown as Student[]) || []);
            setSessions((sessionsRes.data as Session[]) || []);
            setAnnouncements((announcementsRes.data as Announcement[]) || []);
            setAssignments((assignmentsRes.data as Assignment[]) || []);
            setSubmissions((submissionsRes.data as unknown as Submission[]) || []);

        } catch (err) {
            console.error("Error fetching cohort detail:", err);
            toast({
                title: "Fetch Error",
                description: "Failed to load cohort details.",
                variant: "destructive"
            });
            navigate("/admin/academy");
        } finally {
            setLoading(false);
        }
    }, [id, navigate, toast]);

    useEffect(() => {
        fetchCohortData();
    }, [fetchCohortData]);

    const handleCreateSession = async () => {
        if (!newSession.title || !newSession.date) return;
        setIsSaving(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.from("sessions") as any).insert([{
                cohort_id: id,
                title: newSession.title,
                session_date: newSession.date,
                start_time: newSession.start_time,
                meeting_url: newSession.url,
                status: 'scheduled'
            }]).select().single();

            if (error) throw error;
            setSessions(prev => [...prev, data as Session]);
            setNewSession({ title: '', date: '', start_time: '', url: '' });
            toast({ title: "Session Created", description: "Your class has been scheduled." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to create session.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateAnnouncement = async () => {
        if (!newAnnouncement.title || !newAnnouncement.content) return;
        setIsSaving(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.from("announcements") as any).insert([{
                cohort_id: id,
                title: newAnnouncement.title,
                content: newAnnouncement.content
            }]).select().single();

            if (error) throw error;
            setAnnouncements(prev => [data as Announcement, ...prev]);
            setNewAnnouncement({ title: '', content: '' });
            toast({ title: "Posted", description: "Announcement sent to students." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to post update.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateAssignment = async () => {
        if (!newAssignment.title || !newAssignment.deadline) return;
        setIsSaving(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.from("assignments") as any).insert([{
                cohort_id: id,
                title: newAssignment.title,
                description: newAssignment.description,
                deadline_at: newAssignment.deadline
            }]).select().single();

            if (error) throw error;
            setAssignments(prev => [data as Assignment, ...prev]);
            setNewAssignment({ title: '', description: '', deadline: '' });
            toast({ title: "Assignment Created", description: "Students have been notified." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to create task.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReviewSubmission = async (subId: string) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from("submissions") as any).update({ status: 'reviewed' }).eq("id", subId);
            if (error) throw error;
            setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, status: 'reviewed' } : s));
            toast({ title: "Graded", description: "Submission marked as reviewed." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to update status." });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!cohort) return null;

    return (
        <div className="p-8 lg:p-12 bg-slate-50/50 min-h-screen font-inter">
            <div className="max-w-7xl mx-auto">
                <Link to="/admin/academy" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Academy
                </Link>

                {/* Header Card */}
                <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm mb-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[24px] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
                                <Users className="w-10 h-10" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{cohort.name}</h1>
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                        cohort.status === 'open' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'
                                    }`}>
                                        {cohort.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        <Calendar className="w-4 h-4" /> {new Date(cohort.start_date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        <Users className="w-4 h-4" /> {students.length} Enrolled
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest">
                                        ₦{cohort.price_naira.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" className="h-12 px-6 rounded-xl font-bold gap-2">
                                <Settings className="w-4 h-4" /> Cohort Settings
                            </Button>
                            <Button className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold gap-2">
                                Export List
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white p-1 rounded-2xl border border-slate-100 h-14 mb-10 shadow-sm inline-flex">
                        <TabsTrigger value="students" className="px-8 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                            Students ({students.length})
                        </TabsTrigger>
                        <TabsTrigger value="sessions" className="px-8 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                            Sessions ({sessions.length})
                        </TabsTrigger>
                        <TabsTrigger value="announcements" className="px-8 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                            Announcements
                        </TabsTrigger>
                        <TabsTrigger value="assignments" className="px-8 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                            Assignments
                        </TabsTrigger>
                        <TabsTrigger value="grading" className="px-8 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                            Submissions ({submissions.filter(s => s.status === 'submitted').length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="students" className="outline-none">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Student Name</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Email</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Enrolled On</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Status</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Top Grad</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {students.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-6 font-bold text-slate-900">{student.student_name}</td>
                                            <td className="px-8 py-6 text-sm text-slate-500 font-medium">{student.student_email}</td>
                                            <td className="px-8 py-6 text-sm text-slate-500 font-medium">{new Date(student.created_at).toLocaleDateString()}</td>
                                            <td className="px-8 py-6">
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded uppercase tracking-wider">{student.enrollment_status}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button 
                                                    onClick={async () => {
                                                        const newVal = !student.is_top_grad;
                                                        const { error } = await (supabase.from('academy_enrollments') as any).update({ is_top_grad: newVal }).eq('id', student.id);
                                                        if (!error) {
                                                            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, is_top_grad: newVal } : s));
                                                            toast({ title: newVal ? '⭐ Top Grad Assigned' : 'Top Grad Removed', description: `${student.student_name} ${newVal ? 'is now' : 'is no longer'} a Top Grad.` });
                                                        }
                                                    }}
                                                    className={`p-2 rounded-xl transition-all ${student.is_top_grad ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'bg-slate-50 text-slate-300 hover:text-amber-400 hover:bg-amber-50'}`}
                                                    title={student.is_top_grad ? 'Remove Top Grad' : 'Mark as Top Grad'}
                                                >
                                                    <Star className={`w-4 h-4 ${student.is_top_grad ? 'fill-amber-400' : ''}`} />
                                                </button>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg"><MoreVertical className="w-4 h-4 text-slate-400" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    <TabsContent value="sessions" className="outline-none">
                        <div className="space-y-10">
                            <div className="bg-white p-8 rounded-[32px] border border-blue-50 shadow-xl shadow-blue-500/5">
                                <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Schedule New Session</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Topic</label>
                                        <input 
                                            value={newSession.title} 
                                            onChange={e => setNewSession({...newSession, title: e.target.value})}
                                            placeholder="System Architecture..." 
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-blue-600 transition-all text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Date</label>
                                        <input 
                                            type="date"
                                            value={newSession.date} 
                                            onChange={e => setNewSession({...newSession, date: e.target.value})}
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-blue-600 transition-all text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Meeting URL</label>
                                        <input 
                                            value={newSession.url} 
                                            onChange={e => setNewSession({...newSession, url: e.target.value})}
                                            placeholder="Zoom link..." 
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-blue-600 transition-all text-sm font-medium"
                                        />
                                    </div>
                                    <Button onClick={handleCreateSession} disabled={isSaving} className="h-12 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100">{isSaving ? 'Scheduling...' : 'Add Class'}</Button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                {sessions.map((session, idx) => (
                                    <div key={session.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" className="w-10 h-10 p-0 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-600"><Settings className="w-4 h-4" /></Button>
                                            <Button variant="ghost" className="w-10 h-10 p-0 rounded-xl bg-slate-50 hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                                <Video className="w-6 h-6" />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session {idx+1}</span>
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900 mb-2 truncate pr-16">{session.title}</h4>
                                        <div className="flex items-center gap-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(session.session_date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {session.start_time}</span>
                                        </div>
                                        <div className="mt-8 flex items-center justify-between">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                                                session.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {session.status}
                                            </span>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">
                                                Virtual Link <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {sessions.length === 0 && (
                                    <div className="md:col-span-2 py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                                        <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold">No sessions scheduled yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="announcements" className="outline-none pb-20">
                        <div className="max-w-3xl space-y-8">
                            <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5">
                                <h4 className="text-[10px] font-bold text-slate-900 mb-4 uppercase tracking-widest">Broadcast Announcement</h4>
                                <input 
                                    value={newAnnouncement.title}
                                    onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                    placeholder="Title..."
                                    className="w-full h-12 px-6 bg-slate-50 rounded-xl border-transparent mb-4 text-sm font-bold"
                                />
                                <textarea 
                                    value={newAnnouncement.content}
                                    onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                                    placeholder="Keep your cohort informed. Start typing..." 
                                    className="w-full min-h-[140px] p-6 bg-slate-50 rounded-2xl border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium text-sm mb-6"
                                />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Notify students via email
                                    </div>
                                    <Button onClick={handleCreateAnnouncement} disabled={isSaving} className="h-12 px-8 bg-blue-600 text-white rounded-xl font-bold">{isSaving ? 'Posting...' : 'Post Update'}</Button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {announcements.map((ann) => (
                                    <div key={ann.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                                        <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" className="w-8 h-8 p-0 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                        <div className="flex items-start gap-5">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                                                <Bell className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-grow">
                                                <h5 className="font-bold text-slate-900 mb-1">{ann.title}</h5>
                                                <p className="text-slate-500 text-sm leading-relaxed mb-4">{ann.content}</p>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Posted {new Date(ann.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="assignments" className="outline-none pb-20">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-1">
                                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm sticky top-8">
                                    <h4 className="text-sm font-bold text-slate-900 mb-8 uppercase tracking-widest">Create Assignment</h4>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Title</label>
                                            <input 
                                                value={newAssignment.title}
                                                onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                                                className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent text-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Deadline</label>
                                            <input 
                                                type="datetime-local"
                                                value={newAssignment.deadline}
                                                onChange={e => setNewAssignment({...newAssignment, deadline: e.target.value})}
                                                className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent text-sm font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Description</label>
                                            <textarea 
                                                value={newAssignment.description}
                                                onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                                                className="w-full min-h-[120px] p-5 bg-slate-50 rounded-xl border-transparent text-sm font-medium"
                                            />
                                        </div>
                                        <Button onClick={handleCreateAssignment} disabled={isSaving} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200">{isSaving ? 'Creating...' : 'Create Task'}</Button>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2 space-y-6">
                                {assignments.map(asgn => (
                                    <div key={asgn.id} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm group relative">
                                        <div className="absolute top-10 right-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" className="w-10 h-10 p-0 rounded-xl bg-slate-50 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none font-bold uppercase text-[9px] px-2 py-0.5">Active</Badge>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Due {new Date(asgn.deadline_at).toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="text-2xl font-bold text-slate-900 mb-3">{asgn.title}</h4>
                                        <p className="text-slate-500 text-sm leading-relaxed mb-8">{asgn.description}</p>
                                        <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <Plus className="w-4 h-4" /> 0 Submissions
                                            </div>
                                            <Button variant="ghost" className="font-bold text-blue-600 text-xs">Edit Details</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="grading" className="outline-none pb-20">
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student / Assignment</th>
                                        <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content</th>
                                        <th className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-10 py-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {submissions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-8">
                                                <div className="font-bold text-slate-900 mb-1">{sub.profiles?.full_name || 'Student'}</div>
                                                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{sub.assignments?.title}</div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <a href={sub.link} target="_blank" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition-colors">
                                                    <ExternalLink className="w-4 h-4" /> View Work
                                                </a>
                                            </td>
                                            <td className="px-10 py-8">
                                                {sub.status === 'reviewed' ? (
                                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Reviewed</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                {sub.status !== 'reviewed' && (
                                                    <Button onClick={() => handleReviewSubmission(sub.id)} variant="outline" className="h-10 px-4 rounded-xl font-bold text-xs border-slate-200">Approve</Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {submissions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-10 py-20 text-center">
                                                <FileText className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                                <p className="text-slate-400 font-bold">No submissions yet.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default CohortDetail;
