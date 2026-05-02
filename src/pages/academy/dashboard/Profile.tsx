import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  User, 
  Settings, 
  Bell, 
  Lock, 
  CreditCard, 
  Languages, 
  ChevronRight, 
  Download, 
  Edit3,
  Award,
  BookOpen,
  Zap,
  TrendingUp,
  Calendar,
  Clock,
  ShieldCheck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAuthUser(user);
        // Fetch profile with new preference fields
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        setProfile(profileData);

        // Fetch enrollments to get track and cohort names
        const { data: enrollData } = await supabase
          .from("academy_enrollments")
          .select("*, cohorts(name, start_date)")
          .eq("student_id", user.id)
          .eq("enrollment_status", "active");
        
        setEnrollments(enrollData || []);

        const cohortIds = enrollData?.map(e => e.cohort_id) || [];
        if (cohortIds.length > 0) {
          // Fetch upcoming sessions
          const { data: sessionData } = await supabase
            .from("sessions")
            .select("*, cohorts(name)")
            .in("cohort_id", cohortIds)
            .gte("session_date", new Date().toISOString())
            .order("session_date", { ascending: true })
            .limit(2);
          setUpcomingSessions(sessionData || []);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  const activeCohort = enrollments[0]?.cohorts;
  const learningTrack = profile?.learning_track || (enrollments[0] ? "Active Student" : "New Student");

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 animate-fade-in pb-20">
      
      {/* Header Section */}
      <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="relative group shrink-0">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-slate-50 shadow-sm overflow-hidden bg-slate-100">
            <AvatarImage src={profile?.avatar_url} className="object-cover" />
            <AvatarFallback className="bg-blue-600 text-white text-3xl font-bold uppercase">
              {profile?.full_name?.[0] || profile?.email?.[0] || "S"}
            </AvatarFallback>
          </Avatar>
          <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg border-2 border-white hover:scale-110 transition-transform">
            <Edit3 size={14} />
          </button>
        </div>

        <div className="flex-grow space-y-4 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight truncate">
                {profile?.full_name || authUser?.user_metadata?.full_name || "Academy Student"}
              </h1>
              <p className="text-sm text-slate-400 font-medium truncate">
                {profile?.email || authUser?.email || "No email provided"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-9 px-4 rounded-xl text-xs font-bold gap-2 border-slate-100">
                Edit Profile
              </Button>
              <Button className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold gap-2 shadow-sm">
                <Download size={14} /> Download Transcript
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-100/50 rounded-lg text-[10px] uppercase tracking-widest px-3 py-1 font-bold">
              {learningTrack}
            </Badge>
            {activeCohort && (
              <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-100 rounded-lg text-[10px] uppercase tracking-widest px-3 py-1 font-bold">
                {activeCohort.name}
              </Badge>
            )}
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 rounded-lg text-[10px] uppercase tracking-widest px-3 py-1 font-bold">
              {profile?.subscription_tier || "Standard"} Student
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <BookOpen size={64} className="text-blue-600" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
               <BookOpen size={16} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Activity Score</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">{profile?.courses_completed || 0}</p>
          <p className="text-xs font-medium text-slate-400">Courses Completed</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Award size={64} className="text-amber-600" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
               <Award size={16} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Global Rank: #{profile?.global_rank || 'N/A'}</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">{profile?.certificates_count || 0}</p>
          <p className="text-xs font-medium text-slate-400">Certificates Earned</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Zap size={64} className="text-blue-600" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
               <Zap size={16} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Active Streak</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-1">{profile?.streak_count || 0}</p>
          <p className="text-xs font-medium text-slate-400">Learning Streak Days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Account Settings */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 px-1">Account Settings</h2>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {[
              { 
                icon: Bell, 
                label: "Notifications", 
                sub: profile?.notification_email ? "Email & Push enabled" : "Notifications disabled" 
              },
              { 
                icon: Lock, 
                label: "Password & Security", 
                sub: "Last changed 3 months ago" 
              },
              { 
                icon: CreditCard, 
                label: "Payment Methods", 
                sub: profile?.last_four_digits ? `Visa ending in ${profile.last_four_digits}` : "No payment method on file",
                active: profile?.last_four_digits ? "Active" : null
              },
              { 
                icon: Languages, 
                label: "Language", 
                sub: profile?.preferred_language || "English (US)" 
              }
            ].map((item, idx) => (
              <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{item.label}</h4>
                    <p className="text-xs text-slate-400 font-medium">{item.sub}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {item.active && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">{item.active}</Badge>}
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Academic Standing</h4>
            <div className="flex items-center gap-2">
               <span className="text-2xl font-bold text-slate-800">{profile?.academic_gpa?.toFixed(2) || "0.00"}</span>
               <span className="text-slate-300">|</span>
               <Badge variant="outline" className={cn(
                 "border-none font-bold text-[9px] uppercase tracking-widest",
                 profile?.honors_list ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"
               )}>
                 {profile?.honors_list ? "Honors List" : "In Good Standing"}
               </Badge>
            </div>
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="lg:col-span-4 space-y-8">
          {/* Opsly Plus */}
          {profile?.subscription_tier !== 'Premium' && (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                  <Zap size={20} className="fill-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Opsly Plus</h3>
                <p className="text-white/70 text-xs mb-8 leading-relaxed">
                  Get unlimited access to advanced workshops and professional mentoring.
                </p>
                <Button className="w-full bg-white text-blue-600 hover:bg-white/90 rounded-xl font-bold text-xs h-11 transition-all active:scale-95">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          )}

          {profile?.subscription_tier === 'Premium' && (
            <div className="bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden group">
               <div className="relative z-10">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                   <ShieldCheck size={20} className="fill-white" />
                 </div>
                 <h3 className="text-xl font-bold mb-1">Premium Active</h3>
                 <p className="text-white/70 text-xs mb-0 leading-relaxed">
                    You have full access to all Opsly features.
                 </p>
               </div>
            </div>
          )}

          {/* Upcoming Sessions */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest px-1">Upcoming Sessions</h3>
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-100 transition-colors">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-100">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(session.session_date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-base font-bold text-slate-800 leading-tight">{new Date(session.session_date).getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-800 mb-0.5 truncate">{session.title}</h4>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium truncate">
                      <Clock size={10} /> {session.start_time} • {session.cohorts?.name}
                    </div>
                  </div>
                </div>
              ))}
              {upcomingSessions.length === 0 && (
                <div className="p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
                  <Calendar size={24} className="text-slate-200" />
                  <p className="text-[10px] text-slate-400 font-medium">No sessions scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
