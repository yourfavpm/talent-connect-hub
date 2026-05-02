import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Award, Lock, Download, Copy, ExternalLink, Loader2, CheckCircle2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Certificate {
  id: string;
  certificate_id: string;
  course_title: string;
  course_description: string;
  completion_date: string;
  issued_at: string;
  status: string;
  verification_url: string;
  student_name: string;
}

interface Enrollment {
  id: string;
  course_name: string;
  cohort_id: string;
  enrollment_status: string;
  cohorts?: { name: string; status: string; is_closed: boolean };
}

const Certificates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [certsRes, enrollRes] = await Promise.all([
          supabase
            .from("certificates")
            .select("*")
            .eq("student_id", user.id)
            .order("issued_at", { ascending: false }),
          supabase
            .from("academy_enrollments")
            .select("*, cohorts(name, status, is_closed)")
            .eq("student_id", user.id)
            .eq("enrollment_status", "active")
        ]);

        setCertificates((certsRes.data as unknown as Certificate[]) || []);
        setEnrollments((enrollRes.data as unknown as Enrollment[]) || []);
      } catch (err) {
        console.error("Failed to fetch certificates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied", description: "Certificate verification link copied to clipboard." });
  };

  const handleShareLinkedIn = (cert: Certificate) => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cert.verification_url)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Build a map of cohort_id → certificate for checking earned status
  const certByCohort = new Map<string, Certificate>();
  certificates.forEach(c => certByCohort.set(c.id, c));

  // Find enrollments that don't have certificates (locked)
  const enrolledCohortIds = new Set(enrollments.map(e => e.cohort_id));
  const certCohortIds = new Set(certificates.map((c: any) => c.cohort_id));
  const lockedEnrollments = enrollments.filter(e => !certCohortIds.has(e.cohort_id));

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">My Certificates</h1>
        <p className="text-sm text-slate-500 font-medium">View, download, and share your earned credentials.</p>
      </div>

      {/* Earned Certificates */}
      {certificates.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Earned</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert, i) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                {/* Decorative accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">
                        🎉 Certificate Ready
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight">{cert.course_title}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-6">
                    Earned on {new Date(cert.completion_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>

                  <div className="flex items-center gap-2 mb-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ID: {cert.certificate_id}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link to={`/certificate/${cert.certificate_id}`}>
                      <Button size="sm" className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs gap-2">
                        <ExternalLink className="w-3.5 h-3.5" /> View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(cert.verification_url)}
                      className="h-10 px-5 rounded-xl font-bold text-xs gap-2 border-slate-200"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShareLinkedIn(cert)}
                      className="h-10 px-5 rounded-xl font-bold text-xs gap-2 border-slate-200"
                    >
                      <Share2 className="w-3.5 h-3.5" /> LinkedIn
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Certificates */}
      {lockedEnrollments.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">In Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lockedEnrollments.map((enrollment, i) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-50/50 rounded-[32px] border border-slate-100 p-8 relative"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">
                    Certificate Locked
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-600 mb-2">{enrollment.course_name}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Complete your assignments and meet the certification requirements to unlock your certificate.
                </p>
                
                {enrollment.cohorts && (
                  <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Cohort: {enrollment.cohorts.name}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {certificates.length === 0 && lockedEnrollments.length === 0 && (
        <div className="py-32 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No certificates yet</h3>
          <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
            Enroll in a program and complete the requirements to earn your first Opsly certificate.
          </p>
        </div>
      )}
    </div>
  );
};

export default Certificates;
