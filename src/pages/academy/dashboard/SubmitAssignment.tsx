import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  ChevronRight,
  User,
  Zap,
  CheckCircle2,
  Calendar,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SubmitAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    repo_link: "",
    comments: "",
    file: null as File | null
  });

  useEffect(() => {
    const fetchAssignment = async () => {
      const { data } = await supabase
        .from("assignments")
        .select("*, cohorts(name), profiles:mentor_id(full_name, avatar_url)")
        .eq("id", id)
        .single();
      
      setAssignment(data);
      setLoading(false);
    };
    fetchAssignment();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum size is 50MB", variant: "destructive" });
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async (isDraft = false) => {
    const isLate = assignment.deadline_at && new Date(assignment.deadline_at) < new Date();
    if (isLate && !assignment.allow_late_submissions && !isDraft) {
      toast({ title: "Deadline Passed", description: "This assignment is no longer accepting submissions.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let file_url = null;
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const filePath = `${user.id}/${assignment.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('academy-submissions')
          .upload(filePath, formData.file);

        if (uploadError) throw uploadError;
        file_url = uploadData.path;
      }

      const { error } = await supabase
        .from("submissions")
        .insert({
          assignment_id: id,
          student_id: user.id,
          link: formData.repo_link,
          repo_link: formData.repo_link,
          student_comments: formData.comments,
          is_draft: isDraft,
          status: isDraft ? 'draft' : 'submitted',
          file_url: file_url
        });

      if (error) throw error;

      toast({
        title: isDraft ? "Draft Saved" : "Assignment Submitted",
        description: isDraft ? "You can return to finish this later." : "Your mentor will review it soon.",
      });

      if (!isDraft) navigate("/dashboard/assignments");
    } catch (err: any) {
      toast({ title: "Submission Error", description: err.message || "Failed to submit assignment.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!assignment) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <p className="text-slate-500 font-medium text-lg">Assignment not found or access denied.</p>
      <Link to="/dashboard/assignments"><Button variant="outline">Back to Assignments</Button></Link>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-in pb-20">
      <Link to="/dashboard/assignments" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold text-[10px] uppercase tracking-widest transition-colors">
        <ArrowLeft size={14} /> Back to Assignments
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Form */}
        <div className="lg:col-span-8 space-y-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              <span>Assignments</span>
              <ChevronRight size={10} />
              <span>{assignment.cohorts?.name}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Submit Assignment</h1>
            <p className="text-sm text-slate-500 font-medium">{assignment.title}</p>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-sm space-y-10">
            {/* Repo Link */}
            <div className="space-y-4">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Submission Link</label>
               <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="url"
                    value={formData.repo_link}
                    onChange={e => setFormData({...formData, repo_link: e.target.value})}
                    placeholder="https://github.com/your-username/repo"
                    className="w-full h-12 pl-12 pr-6 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-1 focus:ring-blue-600 transition-all font-medium text-sm"
                  />
               </div>
               <p className="text-[10px] text-slate-400 px-1 font-medium italic">Provide the URL to your repository, Figma file, or live prototype.</p>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Supporting Documents (Optional)</label>
               <input 
                 type="file" 
                 id="file-upload" 
                 className="hidden" 
                 onChange={handleFileChange}
                 accept=".pdf,.zip,.png,.jpg,.jpeg"
               />
               <label 
                 htmlFor="file-upload"
                 className={cn(
                   "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center group transition-all cursor-pointer",
                   formData.file ? "border-blue-600 bg-blue-50/30" : "border-slate-100 bg-slate-50/50 hover:border-blue-200"
                 )}
               >
                  <div className={cn(
                    "w-12 h-12 rounded-xl shadow-sm flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                    formData.file ? "bg-blue-600 text-white" : "bg-white text-blue-600"
                  )}>
                    {formData.file ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-1">
                    {formData.file ? formData.file.name : "Drag and drop files here"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {formData.file ? `${(formData.file.size / 1024 / 1024).toFixed(2)} MB` : "Or click to browse from your computer. Max size: 50MB."}
                  </p>
               </label>
            </div>

            {/* Comments */}
            <div className="space-y-4">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Comments to Mentor</label>
               <textarea 
                  value={formData.comments}
                  onChange={e => setFormData({...formData, comments: e.target.value})}
                  placeholder="Share any specific areas where you'd like feedback..."
                  className="w-full min-h-[140px] p-6 bg-slate-50 rounded-2xl border-transparent focus:bg-white focus:ring-1 focus:ring-blue-600 transition-all font-medium text-sm resize-none"
               />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50">
               <Button 
                 onClick={() => handleSubmit(false)}
                 disabled={submitting}
                 className="flex-grow h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 transition-all"
               >
                 {submitting ? "Submitting..." : "Submit Assignment"}
               </Button>
               <Button 
                 onClick={() => handleSubmit(true)}
                 disabled={submitting}
                 variant="outline" 
                 className="h-14 px-10 border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-50"
               >
                 Save as Draft
               </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           {/* Brief Section */}
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Assignment Brief</h4>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Core Challenge</span>
                      <p className="text-xs text-slate-500 leading-relaxed font-normal">
                        {assignment.core_challenge || "Architect a design system that supports multi-tenant enterprise applications while maintaining consistency."}
                      </p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Due Date</span>
                        <p className="text-xs font-bold text-slate-800">{new Date(assignment.deadline_at).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Points</span>
                        <p className="text-xs font-bold text-blue-600">{assignment.xp_points || 0} XP</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Requirements</span>
                      <ul className="space-y-2">
                        {assignment.requirements && Array.isArray(assignment.requirements) && assignment.requirements.length > 0 ? (
                          assignment.requirements.map((req: string, idx: number) => (
                             <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 font-medium">
                                <CheckCircle2 size={12} className="text-blue-500 shrink-0 mt-0.5" /> {req}
                             </li>
                          ))
                        ) : (
                          <li className="text-[10px] text-slate-400 font-medium italic">No specific requirements listed for this task.</li>
                        )}
                      </ul>
                   </div>
                </div>
              </div>
              <Link to="#" className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline pt-2">
                 View Full Syllabus <ChevronRight size={10} />
              </Link>
           </div>

           {/* Mentor Card */}
           {assignment.profiles && (
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <Avatar className="w-12 h-12 rounded-xl border-2 border-slate-50 shadow-sm shrink-0">
                  <AvatarImage src={assignment.profiles.avatar_url} />
                  <AvatarFallback className="bg-slate-100 text-slate-400"><User size={20} /></AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Assigned Mentor</p>
                   <h4 className="text-sm font-bold text-slate-800 truncate">{assignment.profiles.full_name}</h4>
                   <p className="text-[10px] text-slate-400 font-medium">Response time: ~ 2 hours</p>
                </div>
             </div>
           )}

           {/* Rubric Section */}
           {assignment.rubrics && assignment.rubrics.length > 0 && (
             <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Grading Rubric</h4>
                <div className="space-y-4">
                   {assignment.rubrics.map((rubric: any, idx: number) => (
                     <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{rubric.title}</span>
                           <span className="text-[10px] font-bold text-blue-600">{rubric.max_points} Pts</span>
                        </div>
                        {rubric.description && (
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                             {rubric.description}
                          </p>
                        )}
                     </div>
                   ))}
                </div>
             </div>
           )}

           {/* AI Feedback Card */}
           <div className="bg-blue-600 rounded-3xl p-6 text-white relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap size={16} className="fill-white" />
                </div>
                <h4 className="text-sm font-bold mb-1">Opsly AI Feedback</h4>
                <p className="text-white/70 text-[10px] leading-relaxed mb-4">
                  Submit your assignment now to get an instant AI-powered pre-review on your documentation structure before your mentor sees it.
                </p>
                <button className="text-[9px] font-bold uppercase tracking-widest text-white hover:underline flex items-center gap-1">
                  Learn how it works <ChevronRight size={10} />
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitAssignment;
