import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
    Calendar, 
    Video, 
    FileText, 
    Bell, 
    Award, 
    ArrowRight,
    ArrowLeft, 
    ExternalLink,
    Play,
    Clock,
    CheckCircle2,
    Lock,
    Download,
    Globe,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const CohortWorkspace = () => {
    const { enrollmentId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [enrollment, setEnrollment] = useState<any | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("sessions");

    useEffect(() => {
        const fetchWorkspaceData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Enrollment & Cohort
            const { data: enrollData } = await supabase
                .from("academy_enrollments")
                .select("*, cohorts(*)") 
                .eq("id", enrollmentId)
                .single();

            if (!enrollData) {
                toast({ title: "Workspace not found", variant: "destructive" });
                navigate("/dashboard/cohorts");
                return;
            }

            setEnrollment(enrollData);
            const cohortId = enrollData.cohort_id;

            // 2. Fetch Sessions, Announcements, Assignments in Parallel
            const [sessionsRes, announcementsRes, assignmentsRes, submissionsRes] = await Promise.all([
                supabase.from("sessions").select("*").eq("cohort_id", cohortId).order("session_date", { ascending: true }),
                supabase.from("announcements").select("*").eq("cohort_id", cohortId).order("created_at", { ascending: false }),
                supabase.from("assignments").select("*").eq("cohort_id", cohortId).order("deadline_at", { ascending: true }),
                supabase.from("submissions").select("*").eq("student_id", user.id)
            ]);

            setSessions(sessionsRes.data || []);
            setAnnouncements(announcementsRes.data || []);
            setAssignments(assignmentsRes.data || []);
            setSubmissions(submissionsRes.data || []);
            setLoading(false);
        };

        if (enrollmentId) fetchWorkspaceData();
    }, [enrollmentId, navigate, toast]);

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-10 animate-fade-in">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                        <Link to="/dashboard/cohorts" className="hover:text-blue-600">My Cohorts</Link>
                        <ChevronRight size={12} />
                        <span className="text-slate-800">{enrollment.course_name}</span>
                    </div>
                    <h1 className="text-3xl font-semibold text-slate-800 tracking-tight leading-tight">{enrollment.course_name}</h1>
                    <p className="text-slate-500 font-normal mt-1">{enrollment.cohorts?.name} • Next session on Wednesday</p>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="hidden md:block text-right mr-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Progress</p>
                      <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 w-[20%]" />
                      </div>
                   </div>
                   <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold gap-2">
                     <Play size={14} className="fill-current" /> Join Live
                   </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent border-b border-slate-200 h-auto p-0 mb-10 w-full justify-start rounded-none gap-10">
                    <TabsTrigger value="sessions" className="px-0 pb-4 rounded-none font-semibold text-sm data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-all shadow-none border-none">
                        Sessions
                    </TabsTrigger>
                    <TabsTrigger value="assignments" className="px-0 pb-4 rounded-none font-semibold text-sm data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-all shadow-none border-none">
                        Assignments
                    </TabsTrigger>
                    <TabsTrigger value="grades" className="px-0 pb-4 rounded-none font-semibold text-sm data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-all shadow-none border-none">
                        Grades
                    </TabsTrigger>
                </TabsList>

                <div className="max-w-6xl">
                    <TabsContent value="overview" className="space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Program Description</h3>
                                    <p className="text-slate-500 font-normal leading-relaxed">
                                        This cohort-based program is designed to take you from foundational concepts to advanced execution in {enrollment.course_name}. 
                                        You will work on real-world projects, attend live sessions with industry mentors, and join a global community of operations professionals.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xl font-semibold text-slate-800">Recent Announcements</h3>
                                    {announcements.slice(0, 2).map((ann) => (
                                        <div key={ann.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-start gap-5">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 text-blue-600">
                                                <Bell size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-slate-800">{ann.title}</h4>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(ann.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-slate-500 text-sm line-clamp-2">{ann.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="bg-slate-900 p-8 rounded-[32px] text-white">
                                    <Award size={32} className="text-blue-400 mb-6" />
                                    <h4 className="text-lg font-semibold mb-2">Graduation Status</h4>
                                    <p className="text-white/50 text-xs leading-relaxed mb-6">Complete all assignments and attend 80% of sessions to earn your certificate.</p>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-8">
                                        <div className="h-full bg-blue-600 w-0" />
                                    </div>
                                    <Button disabled className="w-full bg-white/10 hover:bg-white/20 text-white/40 border-none rounded-xl font-semibold text-xs">
                                        Claim Certificate
                                    </Button>
                                </div>

                                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Resources</h4>
                                    <div className="space-y-4">
                                        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                                    <Download size={14} />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700">Course Syllabus</span>
                                            </div>
                                            <ArrowRight size={14} className="text-slate-300" />
                                        </button>
                                        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                                    <Globe size={14} />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700">Student Community</span>
                                            </div>
                                            <ArrowRight size={14} className="text-slate-300" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="sessions" className="space-y-6">
                         <div className="flex items-center justify-between px-2 mb-4">
                            <h2 className="text-xl font-semibold text-slate-800">Weekly Live Classes</h2>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{sessions.length} Total Sessions</span>
                         </div>
                         {sessions.map((session, idx) => (
                             <div key={session.id} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                 <div className="flex items-center gap-6">
                                     <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                         <Calendar size={24} />
                                     </div>
                                     <div>
                                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Session {idx + 1}</span>
                                         <h4 className="font-semibold text-slate-800">{session.title}</h4>
                                         <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                             <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(session.session_date).toLocaleDateString()}</span>
                                             <span className="flex items-center gap-1.5"><Clock size={12} /> {session.start_time}</span>
                                         </div>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    {session.meeting_url && (
                                        <Button 
                                            onClick={() => window.open(session.meeting_url, '_blank')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs h-11 px-6 shadow-sm shadow-blue-500/10"
                                        >
                                            Join Class
                                        </Button>
                                    )}
                                    <Button variant="outline" className="border-slate-100 rounded-xl font-semibold text-xs h-11 px-6 hover:bg-slate-50">
                                        Details
                                    </Button>
                                 </div>
                             </div>
                         ))}
                    </TabsContent>

                    <TabsContent value="assignments" className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {assignments.map((assignment) => {
                                const submission = submissions.find(s => s.assignment_id === assignment.id);
                                return (
                                    <div key={assignment.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                                <FileText size={20} />
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${submission ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {submission ? 'Submitted' : 'Pending'}
                                            </span>
                                        </div>
                                        <h4 className="text-xl font-semibold text-slate-800 mb-2">{assignment.title}</h4>
                                        <p className="text-sm text-slate-500 font-normal line-clamp-2 mb-8">{assignment.description}</p>
                                        
                                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due {new Date(assignment.deadline_at).toLocaleDateString()}</span>
                                            <Link to={`/dashboard/assignments/${assignment.id}`}>
                                                <Button variant="ghost" className="text-blue-600 font-semibold text-sm hover:bg-transparent hover:text-blue-700 p-0 h-auto gap-2">
                                                    {submission ? 'View Submission' : 'Submit Work'} <ArrowRight size={14} />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

const ChevronRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

export default CohortWorkspace;
