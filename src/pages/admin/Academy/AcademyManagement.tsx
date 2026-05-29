import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
    Users, 
    BookOpen, 
    Calendar, 
    TrendingUp, 
    Plus, 
    MoreVertical,
    Search,
    Filter,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getInternalPath } from "@/utils/subdomain";

interface CohortStats {
    totalStudents: number;
    activeCohorts: number;
    totalRevenue: number;
    pendingGraduations: number;
}

interface Cohort {
    id: string;
    name: string;
    course_id: string;
    start_date: string;
    status: string;
    current_slots: number;
    max_slots: number;
}

const AcademyManagement = () => {
    const [stats, setStats] = useState<CohortStats>({
        totalStudents: 0,
        activeCohorts: 0,
        totalRevenue: 0,
        pendingGraduations: 0
    });
    const [cohorts, setCohorts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                // 1. Fetch Cohorts
                const { data: cohortsData, error: cohortsError } = await supabase
                    .from("cohorts")
                    .select("*")
                    .order("start_date", { ascending: false });

                if (cohortsError) throw cohortsError;
                const typedCohorts = cohortsData as Cohort[];
                setCohorts(typedCohorts || []);

                // 2. Fetch Stats
                const { count: studentCount } = await supabase
                    .from("academy_enrollments")
                    .select("*", { count: 'exact', head: true })
                    .eq("enrollment_status", "active");

                const { data: revenueData } = await supabase
                    .from("academy_enrollments")
                    .select("price_naira")
                    .eq("enrollment_status", "active");

                const typedRevData = revenueData as { price_naira: number }[];
                const totalRev = typedRevData?.reduce((acc, curr) => acc + (curr.price_naira || 0), 0) || 0;

                setStats({
                    totalStudents: studentCount || 0,
                    activeCohorts: typedCohorts?.filter(c => c.status === 'open').length || 0,
                    totalRevenue: totalRev,
                    pendingGraduations: 12 // Mocked for now
                });

            } catch (err) {
                console.error("Error fetching admin data:", err);
                toast({
                    title: "Fetch Error",
                    description: "Failed to load Academy management data.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [toast]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fc] py-8 px-4 sm:px-6 lg:px-8 font-inter">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                            <span>Admin Portal</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-blue-600">Academy</span>
                        </div>
                        <h1 className="text-xl font-semibold text-slate-800 mt-1">Academy Management</h1>
                        <p className="text-xs text-slate-400 mt-0.5">Oversee cohorts, sessions, and academic performance.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            className="h-9 px-4 rounded-lg text-xs font-medium text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
                            onClick={() => navigate(getInternalPath("/admin/academy/courses"))}
                        >
                            <BookOpen className="mr-2 w-3.5 h-3.5 text-blue-600" />
                            Manage Courses
                        </Button>
                        <Button 
                            className="h-9 px-4 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            onClick={() => navigate(getInternalPath("/admin/academy/courses"))}
                        >
                            <Plus className="mr-1.5 w-3.5 h-3.5" />
                            Create Cohort
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Active Students", value: stats.totalStudents, icon: Users, color: "text-blue-600 bg-blue-50/50", trend: "+12%" },
                        { label: "Open Cohorts", value: stats.activeCohorts, icon: BookOpen, color: "text-emerald-600 bg-emerald-50/50", trend: "Stable" },
                        { label: "Est. Revenue", value: `₦${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-indigo-600 bg-indigo-50/50", trend: "+8%" },
                        { label: "Graduations", value: stats.pendingGraduations, icon: CheckCircle2, color: "text-amber-600 bg-amber-50/50", trend: "Pending" }
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center shrink-0`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                    <h3 className="text-lg font-bold text-slate-800 mt-0.5">{stat.value}</h3>
                                </div>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                                {stat.trend}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Academic Cohorts</h2>
                            <p className="text-xs text-slate-400 mt-0.5">List of all scheduled, active, and completed cohorts</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search cohorts..." 
                                className="h-8 pl-9 pr-4 bg-white rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-600 transition-all font-normal text-xs w-full sm:w-60"
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/40">
                                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Course & Cohort Name</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Start Date</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Students</th>
                                    <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Progress</th>
                                    <th className="px-5 py-3 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {cohorts.map((cohort) => (
                                    <tr key={cohort.id} className="hover:bg-slate-50/40 transition-colors group">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50/70 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                                                    {cohort.course_id.substring(0,2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-slate-800">{cohort.name}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{cohort.course_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                cohort.status === 'open' 
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' 
                                                : cohort.status === 'in-progress' 
                                                ? 'bg-blue-50 text-blue-600 border border-blue-100/50'
                                                : 'bg-slate-50 text-slate-400 border border-slate-100/50'
                                            }`}>
                                                {cohort.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500">
                                            {new Date(cohort.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">
                                            {cohort.current_slots || 0} / {cohort.max_slots || 25}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-[20%]" />
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Button 
                                                variant="ghost" 
                                                className="h-7 px-2.5 rounded-md text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 gap-1" 
                                                onClick={() => navigate(getInternalPath(`/admin/academy/cohorts/${cohort.id}`))}
                                            >
                                                Manage <ArrowUpRight className="w-3 h-3" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {cohorts.length === 0 && (
                            <div className="py-12 text-center">
                                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs text-slate-400 font-medium">No academic cohorts found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Upcoming Live Sessions</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Classes scheduled for this week</p>
                            </div>
                            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest cursor-pointer hover:underline">View All</span>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-4 p-3 rounded-lg border border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50/60 flex flex-col items-center justify-center text-indigo-600 shrink-0">
                                        <span className="text-[9px] font-semibold uppercase">APR</span>
                                        <span className="text-sm font-bold leading-none mt-0.5">{15 + s}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-medium text-slate-800 truncate">AI Operations Advanced Class</h4>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                                            <Clock className="w-3 h-3 text-slate-400" /> 7:00 PM - 9:00 PM GMT
                                        </p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-7 px-2.5 rounded-md text-[10px] uppercase text-slate-400 hover:text-slate-600">Join</Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Pending Submissions</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Assignment uploads awaiting grade</p>
                            </div>
                            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest cursor-pointer hover:underline">Grade (8)</span>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-3.5 p-3 rounded-lg border border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <div className="w-9 h-9 bg-emerald-50/70 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                                        <Users className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-medium text-slate-800 truncate">Final Roadmap Proposal</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Ama Mensah submitted 2h ago</p>
                                    </div>
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AcademyManagement;
