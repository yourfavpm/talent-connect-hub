import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, Mail, ExternalLink, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const Mentors = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollData } = await supabase
        .from("academy_enrollments")
        .select("course_name, cohorts(mentors)")
        .eq("user_id", user.id)
        .eq("enrollment_status", "active");
      
      const allMentors: any[] = [];
      enrollData?.forEach(e => {
        if (e.cohorts?.mentors) {
          (e.cohorts.mentors as any[]).forEach(m => {
            // Check if this mentor already exists in our list for this course
            const existing = allMentors.find(ex => ex.name === m.name && ex.course === e.course_name);
            if (!existing) {
              allMentors.push({
                ...m,
                course: e.course_name
              });
            }
          });
        }
      });
          
      setMentors(allMentors);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight mb-1">Program Mentors</h1>
        <p className="text-xs md:text-sm text-slate-500 font-normal">Connect with industry experts who guide your journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map((mentor, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group">
            <div className="p-6 flex flex-col items-center text-center">
              <Avatar className="w-20 h-20 mb-4 border-4 border-slate-50 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xl font-bold">
                   {mentor.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold text-slate-800 mb-0.5">{mentor.name}</h3>
              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1">{mentor.title || "Industry Mentor"}</p>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Assigned: {mentor.course}</p>
              <p className="text-xs text-slate-500 font-normal line-clamp-3 mb-6 px-2">
                 Industry expert with extensive experience in operations and product management. Dedicated to guiding the next generation of talent.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full">
                 <Button variant="outline" className="rounded-lg border-slate-100 text-[10px] font-bold uppercase tracking-wider h-9 gap-1.5">
                    <Mail size={12} /> Email
                 </Button>
                 <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider h-9 gap-1.5">
                    <MessageSquare size={12} /> Chat
                 </Button>
              </div>
            </div>
            {mentor.link && (
               <div className="bg-slate-50 py-4 px-8 border-t border-slate-100">
                  <a href={mentor.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors">
                     View Professional Profile <ExternalLink size={12} />
                  </a>
               </div>
            )}
          </div>
        ))}

        {mentors.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[40px] border border-dashed border-slate-200 text-center px-8">
            <Users className="w-16 h-16 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-500 font-medium italic">Mentor assignments will appear here once your cohort starts.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mentors;
