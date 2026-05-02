import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { FileText, Calendar, Clock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Assignments = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollData } = await supabase
        .from("academy_enrollments")
        .select("cohort_id")
        .eq("student_id", user.id)
        .in("enrollment_status", ["enrolled", "active", "completed"]);
      
      const cohortIds = enrollData?.map(e => e.cohort_id) || [];
      
      if (cohortIds.length > 0) {
        const { data: assignData } = await supabase
          .from("assignments")
          .select("*, cohorts(name)")
          .in("cohort_id", cohortIds)
          .order("deadline_at", { ascending: true });
        
        const { data: submitData } = await supabase
          .from("submissions")
          .select("*")
          .eq("student_id", user.id);
          
        setAssignments(assignData || []);
        setSubmissions(submitData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="px-1">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight mb-1">Assignments</h1>
        <p className="text-xs md:text-sm text-slate-500 font-normal">Track your tasks and deadlines.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task Name</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deadline</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assignments.map((assignment) => {
                const submission = submissions.find(s => s.assignment_id === assignment.id);
                const isOverdue = !submission && new Date(assignment.deadline_at) < new Date();
                
                return (
                  <tr key={assignment.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                             <FileText size={18} />
                          </div>
                          <div>
                             <p className="text-sm font-semibold text-slate-800">{assignment.title}</p>
                             <p className="text-xs text-slate-400 font-normal line-clamp-1">{assignment.description}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-xs font-semibold text-slate-500">{assignment.cohorts?.name}</span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-800">{new Date(assignment.deadline_at).toLocaleDateString()}</span>
                          <span className="text-[10px] text-slate-400">11:59 PM</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       {submission ? (
                         <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Submitted</span>
                         </div>
                       ) : isOverdue ? (
                         <div className="flex items-center gap-2 text-red-500">
                            <AlertCircle size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Overdue</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2 text-amber-500">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
                         </div>
                       )}
                    </td>
                    <td className="px-8 py-6 text-right">
                       {submission ? (
                         <Link to="/dashboard/grades">
                           <Button variant="ghost" className="text-blue-600 font-semibold text-xs hover:bg-blue-50 rounded-lg h-9 px-4">
                             Review
                           </Button>
                         </Link>
                       ) : (
                         <Link to={`/dashboard/assignments/${assignment.id}`}>
                           <Button variant="ghost" className="text-blue-600 font-semibold text-xs hover:bg-blue-50 rounded-lg h-9 px-4">
                             Open Task
                           </Button>
                         </Link>
                       )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {assignments.length === 0 && (
          <div className="py-20 text-center">
            <FileText className="w-12 h-12 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-medium">No assignments found across your cohorts.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;
