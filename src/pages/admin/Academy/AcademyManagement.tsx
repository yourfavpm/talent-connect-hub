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
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 lg:p-12 bg-slate-50/50 min-h-screen font-inter">
            <div className="max-w-[1600px] mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4 w-fit">
                            Admin Portal
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Academy Management</h1>
                        <p className="text-slate-500 font-medium mt-2">Oversee cohorts, sessions, and academic performance.</p>
                    </div>
                    
                    <div className="flex flex-wrap flex-col sm:flex-row items-center gap-4">
                        <Button 
                            variant="outline" 
                            onClick={() => navigate("/academy/courses")}
                            className="h-12 px-6 rounded-xl font-bold gap-2 text-slate-700 bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                        >
                            <BookOpen className="w-4 h-4" /> Manage Courses
                        </Button>
                        <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-2 shadow-lg shadow-blue-200">
                            <Plus className="w-4 h-4" /> Create New Cohort
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {[
                        { label: "Active Students", value: stats.totalStudents, icon: Users, color: "bg-blue-500", trend: "+12%" },
                        { label: "Open Cohorts", value: stats.activeCohorts, icon: BookOpen, color: "bg-emerald-500", trend: "Stable" },
                        { label: "Est. Revenue", value: `₦${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "bg-indigo-500", trend: "+8%" },
                        { label: "Graduations", value: stats.pendingGraduations, icon: CheckCircle2, color: "bg-amber-500", trend: "Pending" }
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="flex items-start justify-between mb-6">
                                <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {stat.trend}
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden mb-12">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-900">Academic Cohorts</h2>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search cohorts..." 
                                className="h-11 pl-12 pr-6 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-blue-600 transition-all font-medium text-sm w-72"
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Course & Cohort Name</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Start Date</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Students</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Progress</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cohorts.map((cohort) => (
                                    <tr key={cohort.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                                    {cohort.course_id.substring(0,2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 tracking-tight">{cohort.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cohort.course_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                cohort.status === 'open' 
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                : cohort.status === 'in-progress' 
                                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                : 'bg-slate-50 text-slate-400 border border-slate-100'
                                            }`}>
                                                {cohort.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 font-bold text-slate-600 text-sm">
                                            {new Date(cohort.start_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-6 font-bold text-slate-600 text-sm">
                                            0 / 50
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 w-[20%]" />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Button variant="ghost" className="h-10 px-4 rounded-lg font-bold text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => navigate(`/admin/academy/cohorts/${cohort.id}`)}>
                                                Manage <ArrowUpRight className="ml-2 w-3.5 h-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {cohorts.length === 0 && (
                            <div className="p-20 text-center">
                                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold">No academic cohorts found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center justify-between">
                            Upcoming Live Sessions
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest cursor-pointer hover:underline">View All</span>
                        </h3>
                        <div className="space-y-6">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-6 p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center text-indigo-600">
                                        <span className="text-[10px] font-bold uppercase">APR</span>
                                        <span className="text-xl font-black">{15 + s}</span>
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-slate-900 tracking-tight">AI Operations Advanced Class</h4>
                                        <p className="text-xs font-bold text-slate-400 flex items-center gap-2 mt-1 uppercase tracking-widest">
                                            <Clock className="w-3.5 h-3.5" /> 7:00 PM - 9:00 PM GMT
                                        </p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="rounded-xl font-bold text-[10px] uppercase text-slate-400">Join</Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center justify-between">
                            Pending Submissions
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest cursor-pointer hover:underline">Grade (8)</span>
                        </h3>
                        <div className="space-y-6">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-5 p-4 rounded-3xl hover:bg-slate-50 transition-all">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-slate-900 tracking-tight">Final Roadmap Proposal</h4>
                                        <p className="text-xs font-bold text-slate-500 mt-1">Ama Mensah submitted 2h ago</p>
                                    </div>
                                    <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
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
