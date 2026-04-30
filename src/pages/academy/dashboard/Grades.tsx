import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Star, MessageSquare, TrendingUp, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

const Grades = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Submissions with Rubric Data
      const { data: subData } = await supabase
        .from("submissions")
        .select(`
          *,
          assignments(
            title, 
            rubrics,
            cohorts(id, name)
          )
        `)
        .eq("student_id", user.id)
        .not("grade", "is", null)
        .order('created_at', { ascending: false });
        
      setSubmissions(subData || []);

      // 2. Fetch Enrollments for Overall Grade
      const { data: enrollData } = await supabase
        .from("academy_enrollments")
        .select("*, cohorts(name)")
        .eq("user_id", user.id);
      
      setEnrollments(enrollData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      <div className="px-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Academic Record</h1>
        <p className="text-sm text-slate-500 font-medium">Detailed performance breakdown and mentor feedback.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Submissions Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Assignment Feedback</h3>
          {submissions.length > 0 ? (
            submissions.map((sub) => (
              <div key={sub.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div 
                  onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}
                  className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                      <Star size={24} className={sub.grade >= 80 ? "fill-blue-600" : ""} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">{sub.assignments?.cohorts?.name}</span>
                      <h4 className="font-bold text-slate-900 text-lg">{sub.assignments?.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">
                        Reviewed {new Date(sub.updated_at || sub.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                       <div className="text-3xl font-bold text-blue-600">{sub.grade}%</div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
                    </div>
                    <div className="text-slate-300">
                      {expandedSub === sub.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedSub === sub.id && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-slate-50"
                    >
                      <div className="p-8 space-y-8 bg-slate-50/30">
                        {/* Overall Feedback */}
                        {sub.feedback && (
                          <div className="space-y-3">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <MessageSquare size={12} /> Mentor's Summary
                            </h5>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                              "{sub.feedback}"
                            </div>
                          </div>
                        )}

                        {/* Rubric Breakdown */}
                        {sub.rubric_grades && sub.rubric_grades.length > 0 && (
                          <div className="space-y-4">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grading Breakdown</h5>
                            <div className="grid gap-4">
                              {sub.assignments?.rubrics?.map((rubric: any) => {
                                const score = sub.rubric_grades.find((rg: any) => rg.rubric_id === rubric.id);
                                return (
                                  <div key={rubric.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-start justify-between gap-6">
                                    <div className="space-y-1">
                                      <h6 className="text-sm font-bold text-slate-800">{rubric.title}</h6>
                                      <p className="text-xs text-slate-500 leading-relaxed">{score?.comment || rubric.description}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className="text-sm font-bold text-slate-900">{score?.score || 0} <span className="text-slate-400 text-[10px]">/ {rubric.max_points}</span></div>
                                      <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                        <div 
                                          className="h-full bg-blue-500 rounded-full" 
                                          style={{ width: `${(score?.score / rubric.max_points) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[40px] border border-dashed border-slate-200 py-24 text-center">
               <Award className="w-16 h-16 text-slate-100 mx-auto mb-6" />
               <p className="text-slate-400 text-sm font-medium italic">Your assessments will appear here once graded.</p>
            </div>
          )}
        </div>

        {/* Right Column: Overall Standing */}
        <div className="lg:col-span-4 space-y-8">
           <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Program Standing</h3>
           {enrollments.map((enroll) => (
             <div key={enroll.id} className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                <TrendingUp className="text-blue-400 mb-6 w-8 h-8" />
                <h4 className="text-xl font-bold mb-1">{enroll.cohorts?.name}</h4>
                <p className="text-white/50 text-xs mb-8">Overall Academic Performance</p>
                
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-5xl font-bold mb-2">{enroll.progress_percent || 0}%</div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${enroll.progress_percent >= 50 ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                        {enroll.progress_percent >= 70 ? "Excellent" : enroll.progress_percent >= 50 ? "Good" : "Needs Review"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    <span>Grading Status</span>
                    <span className="text-white/80">{enroll.enrollment_status}</span>
                  </div>
                  {enroll.progress_percent >= 70 && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      <CheckCircle2 size={14} /> Certificate Eligible
                    </div>
                  )}
                </div>
             </div>
           ))}
           
           {enrollments.length === 0 && (
             <div className="bg-slate-50 p-8 rounded-[32px] border border-dashed border-slate-200 text-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No Active Enrollments</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Grades;

