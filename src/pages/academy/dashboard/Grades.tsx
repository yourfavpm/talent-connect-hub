import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Award, Star, MessageSquare, TrendingUp } from "lucide-react";

const Grades = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpa, setGpa] = useState<string>("N/A");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("submissions")
        .select("*, assignments(title, cohorts(name))")
        .eq("student_id", user.id)
        .not("grade", "is", null);
        
      setSubmissions(data || []);
      
      if (data && data.length > 0) {
        const sum = data.reduce((acc, curr) => {
          const val = parseFloat(curr.grade);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        const avg = sum / data.length;
        // Convert percentage to 4.0 scale for GPA
        const calculatedGpa = (avg / 100) * 4.0;
        setGpa(calculatedGpa.toFixed(2));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="px-1">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight mb-1">Academic Record</h1>
        <p className="text-xs md:text-sm text-slate-500 font-normal">View your performance and assessments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {submissions.length > 0 ? (
            submissions.map((sub) => (
              <div key={sub.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                    <Star size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">{sub.assignments?.cohorts?.name}</span>
                    <h4 className="font-semibold text-slate-800">{sub.assignments?.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <MessageSquare size={12} /> {sub.feedback || "No specific feedback provided"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                   <div className="text-2xl font-bold text-blue-600">{sub.grade}</div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final Score</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
               <Award className="w-10 h-10 text-slate-100 mx-auto mb-3" />
               <p className="text-slate-400 text-xs font-medium italic">Your assessments will appear here once graded.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 rounded-3xl p-6 text-white">
              <TrendingUp className="text-blue-400 mb-4" />
              <h4 className="text-lg font-semibold mb-1">Overall GPA</h4>
              <p className="text-white/50 text-xs mb-6">Based on all graded assignments</p>
              <div className="text-4xl font-bold mb-2">{gpa}</div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
                {gpa !== "N/A" ? "Academic Standing" : "In Progress"}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Grades;
