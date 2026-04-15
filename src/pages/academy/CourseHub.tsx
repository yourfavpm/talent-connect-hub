import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ACADEMY_COURSES } from "@/data/academy-courses";
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

interface CourseData {
    id: string;
    title: string;
    description: string;
    image: string;
}

interface Cohort {
    id: string;
    name: string;
    start_date: string;
    status: string;
}

interface Session {
    id: string;
    title: string;
    description: string;
    session_date: string;
    start_time: string;
    meeting_url: string;
    recording_url: string;
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
    due_date: string;
    status: string;
}

interface Submission {
    assignment_id: string;
    status: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  course_name: string;
  enrollment_status: string;
  cohort_id: string;
}

const CourseHub = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [enrollment, setEnrollment] = useState<(Enrollment & { cohorts: Cohort }) | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [activeTab, setActiveTab] = useState("schedule");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionContent, setSubmissionContent] = useState("");
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

    const courseInfo = ACADEMY_COURSES.find(c => c.slug === slug);

    useEffect(() => {
        const fetchHubData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/auth/login?returnTo=" + window.location.pathname);
                return;
            }

            // 1. Fetch Enrollment & Cohort
            const { data: enrollData, error: enrollError } = await (supabase
                .from("academy_enrollments")
                .select("*, cohorts!cohort_id(*)")
                .eq("user_id", user.id)
                .eq("course_id", slug)
                .single() as Promise<{ data: Enrollment & { cohorts: Cohort } | null; error: any }>);

            if (enrollError || !enrollData) {
                toast({
                    title: "Access Denied",
                    description: "You are not enrolled in this program.",
                    variant: "destructive"
                });
                navigate("/dashboard");
                return;
            }

            const typedEnrollData = enrollData as (Enrollment & { cohorts: Cohort });
            setEnrollment(typedEnrollData);
            const cohortId = typedEnrollData.cohort_id;

            // 2. Fetch Sessions, Announcements, Assignments & Submissions in Parallel
            const [sessionsRes, announcementsRes, assignmentsRes, submissionsRes] = await Promise.all([
                supabase.from("sessions").select("*").eq("cohort_id", cohortId).order("session_date", { ascending: true }),
                supabase.from("announcements").select("*").eq("cohort_id", cohortId).order("created_at", { ascending: false }),
                supabase.from("assignments").select("*").eq("cohort_id", cohortId).order("due_date", { ascending: true }),
                supabase.from("submissions").select("*").eq("user_id", user.id)
            ]);

            setSessions(sessionsRes.data || []);
            setAnnouncements(announcementsRes.data || []);
            setAssignments(assignmentsRes.data || []);
            setSubmissions(submissionsRes.data || []);
            setLoading(false);
        };

        if (slug) fetchHubData();
    }, [slug, navigate, toast]);

    const handleSubmitAssignment = async () => {
        if (!selectedAssignment || !submissionContent) return;
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await (supabase.from("submissions" as any).insert({
                assignment_id: selectedAssignment.id,
                user_id: user?.id,
                submission_content: submissionContent,
                status: 'submitted'
            }) as Promise<{ error: any }>);

            if (error) throw error;

            toast({
                title: "Assignment Submitted!",
                description: "Your work has been sent to your mentor for review."
            });
            
            setSubmissions(prev => [...prev, { assignment_id: selectedAssignment.id, status: 'submitted' }]);
            setSelectedAssignment(null);
            setSubmissionContent("");
        } catch (err) {
            console.error("Submission error:", err);
            toast({
                title: "Submission Failed",
                description: "There was an error uploading your work.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Preparing your hub...</p>
                </div>
            </div>
        );
    }

    const nextSession = sessions.find(s => new Date(s.session_date) >= new Date() && s.status === 'scheduled');
    const pastSessions = sessions.filter(s => s.status === 'completed' || s.recording_url);

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 font-inter">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="w-full px-6 lg:px-10 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link to="/dashboard" className="p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
                        </Link>
                        <div className="h-10 w-px bg-slate-100 hidden md:block" />
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none mb-1">{courseInfo?.title}</h1>
                            <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded uppercase tracking-wider border border-blue-100">
                                    {enrollment?.cohorts?.name}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cohort 2024.1</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex flex-col items-end mr-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Progress</div>
                            <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full w-[35%]" />
                            </div>
                        </div>
                        <Button variant="outline" className="h-11 px-5 rounded-xl font-bold text-xs gap-2 border-slate-200">
                            <FileText className="w-4 h-4" /> Syllabus
                        </Button>
                    </div>
                </div>
            </div>

            <div className="w-full px-6 lg:px-10 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Main Content Area */}
                    <div className="lg:col-span-8">
                        <Tabs defaultValue="schedule" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="bg-white p-1 rounded-2xl border border-slate-200 h-14 mb-10 w-full lg:w-auto shadow-sm">
                                <TabsTrigger value="schedule" className="px-6 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                                    Live Classes
                                </TabsTrigger>
                                <TabsTrigger value="announcements" className="px-6 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                                    Announcements
                                </TabsTrigger>
                                <TabsTrigger value="assignments" className="px-6 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                                    Assignments
                                </TabsTrigger>
                                <TabsTrigger value="recordings" className="px-6 rounded-xl font-bold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
                                    Library
                                </TabsTrigger>
                            </TabsList>

                            <AnimatePresence mode="wait">
                                <TabsContent value="schedule" className="outline-none">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-8 px-2">
                                            <h2 className="text-2xl font-bold text-slate-900">Program Timeline</h2>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{sessions.length} Total Sessions</span>
                                        </div>
                                        
                                        {sessions.map((session, idx) => {
                                            const isNext = nextSession?.id === session.id;
                                            const isPast = new Date(session.session_date) < new Date() || session.status === 'completed';
                                            
                                            return (
                                                <motion.div 
                                                    key={session.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={`p-6 rounded-3xl border transition-all ${
                                                        isNext 
                                                        ? "bg-white border-blue-200 shadow-xl shadow-blue-500/5 ring-1 ring-blue-100" 
                                                        : "bg-white border-slate-100 shadow-sm"
                                                    } ${isPast ? "opacity-75" : ""}`}
                                                >
                                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                        <div className="flex items-center gap-6">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                                                isNext ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : isPast ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                                                            }`}>
                                                                {isPast ? <CheckCircle2 className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                                                        Session {idx + 1}
                                                                    </span>
                                                                    {isNext && (
                                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-bold rounded-full uppercase tracking-wider">Next Up</span>
                                                                    )}
                                                                </div>
                                                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{session.title}</h3>
                                                                <div className="flex items-center gap-4 mt-1.5 font-medium text-slate-500 text-xs">
                                                                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-slate-400" /> {new Date(session.session_date).toLocaleDateString()}</span>
                                                                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-slate-400" /> {session.start_time}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                                            {isPast ? (
                                                                <Button variant="outline" className="rounded-xl border-slate-200 group h-11 px-5 text-slate-600 font-bold text-xs gap-2">
                                                                    <Play className="w-3.5 h-3.5 fill-slate-400" /> Watch Recording
                                                                </Button>
                                                            ) : isNext ? (
                                                                <Button 
                                                                    onClick={() => window.open(session.meeting_url, '_blank')}
                                                                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 font-bold text-xs gap-2 shadow-lg shadow-blue-200"
                                                                >
                                                                    <Play className="w-3.5 h-3.5 fill-white" /> Join Live Room
                                                                </Button>
                                                            ) : (
                                                                <Button disabled className="rounded-xl bg-slate-100 text-slate-400 h-11 px-6 font-bold text-xs gap-2">
                                                                    <Lock className="w-3.5 h-3.5" /> Room Locked
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}

                                        {sessions.length === 0 && (
                                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                <p className="text-slate-500 font-bold">No sessions scheduled for this cohort yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="announcements">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-8 px-2">
                                            <h2 className="text-2xl font-bold text-slate-900">Communication Hub</h2>
                                        </div>
                                        
                                        {announcements.map((ann, idx) => (
                                            <motion.div 
                                                key={ann.id}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                                            >
                                                <div className="flex items-start gap-5">
                                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                                                        <Bell className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="text-lg font-bold text-slate-900">{ann.title}</h3>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(ann.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {announcements.length === 0 && (
                                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                <p className="text-slate-500 font-bold">No announcements yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="assignments">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {assignments.map((assignment) => {
                                                const submission = submissions.find(s => s.assignment_id === assignment.id);
                                                const isSubmitted = !!submission;

                                                return (
                                                    <div key={assignment.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                                                <FileText className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                                            </div>
                                                            {isSubmitted ? (
                                                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Submitted</span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Pending Submission</span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{assignment.title}</h3>
                                                        <p className="text-slate-500 text-sm line-clamp-2 mb-6">{assignment.description}</p>
                                                        
                                                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due {new Date(assignment.due_date).toLocaleDateString()}</div>
                                                            {!isSubmitted && (
                                                                <Button 
                                                                    onClick={() => setSelectedAssignment(assignment)}
                                                                    variant="ghost" 
                                                                    className="text-blue-600 font-bold text-xs p-0 hover:bg-transparent hover:text-blue-700 h-auto gap-1"
                                                                >
                                                                    Submit Work <ArrowRight size={14} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Submission Modal/Panel (Simplified for now) */}
                                        {selectedAssignment && (
                                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-white w-full max-w-xl rounded-[32px] p-10 shadow-2xl"
                                                >
                                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Submit: {selectedAssignment.title}</h3>
                                                    <p className="text-slate-500 text-sm mb-8">Paste your work link or provide a summary of your task below.</p>
                                                    
                                                    <textarea 
                                                        value={submissionContent}
                                                        onChange={(e) => setSubmissionContent(e.target.value)}
                                                        placeholder="Provide your solution link or explanation here..."
                                                        className="w-full min-h-[160px] p-6 bg-slate-50 rounded-2xl border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium text-sm mb-8"
                                                    />

                                                    <div className="flex gap-4">
                                                        <Button 
                                                            variant="outline" 
                                                            className="flex-grow h-14 rounded-2xl font-bold border-slate-200"
                                                            onClick={() => setSelectedAssignment(null)}
                                                            disabled={isSubmitting}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button 
                                                            className="flex-grow-[2] h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold gap-2"
                                                            onClick={handleSubmitAssignment}
                                                            disabled={isSubmitting || !submissionContent}
                                                        >
                                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Submission"}
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </AnimatePresence>
                        </Tabs>
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Instructor Card */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">Program Mentor</h4>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
                                    BA
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-900 leading-none mb-1">Benedicta Amaral</h5>
                                    <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Sr. Operations Architect</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 font-bold text-xs gap-2">
                                <ExternalLink className="w-4 h-4" /> Message Mentor
                            </Button>
                        </div>

                        {/* Graduation Progress */}
                        <div className="bg-slate-900 p-8 rounded-[32px] text-white overflow-hidden relative">
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                    <Award className="w-6 h-6 text-blue-400" />
                                </div>
                                <h4 className="text-lg font-bold mb-2">Graduation Status</h4>
                                <p className="text-white/50 text-xs font-medium leading-relaxed mb-6">Complete all assignments and attend 80% of live classes to earn your certificate.</p>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-white/60">Sessions Attended</span>
                                        <span>0/12</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 w-0" />
                                    </div>
                                </div>

                                <Button disabled className="w-full h-12 mt-8 rounded-xl bg-white/10 text-white/40 font-bold text-xs gap-2 border-transparent">
                                    <Lock className="w-4 h-4" /> Claim Certificate
                                </Button>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">Program Links</h4>
                            <div className="space-y-4">
                                <a href="#" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                            <Download className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">Course Materials</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300" />
                                </a>
                                <a href="#" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                            <Globe className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">Community Hub</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseHub;
