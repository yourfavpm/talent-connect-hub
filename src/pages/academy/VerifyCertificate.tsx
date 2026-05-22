import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface CertificateData {
  id: string;
  certificate_id: string;
  student_name: string;
  course_title: string;
  completion_date: string;
  issued_at: string;
  status: string;
}

const VerifyCertificate = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const { data, error } = await supabase
          .from("certificates")
          .select("id, certificate_id, student_name, course_title, completion_date, issued_at, status")
          .eq("certificate_id", certificateId)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setCert(data as unknown as CertificateData);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) fetchCert();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-inter">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center">
          <img
            src="https://opslyhr.com/images/logocolored.svg"
            alt="OPSlyHR"
            className="h-8 mx-auto mb-4"
          />
          <h1 className="text-white font-bold text-lg tracking-tight">Certificate Verification</h1>
        </div>

        {/* Body */}
        <div className="p-10">
          {notFound && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Certificate Not Found</h2>
              <p className="text-sm text-slate-500 font-medium">
                The certificate ID <span className="font-mono font-bold text-slate-700">{certificateId}</span> does not match any record in our system.
              </p>
            </div>
          )}

          {cert && cert.status === "revoked" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Certificate Revoked</h2>
              <p className="text-sm text-slate-500 font-medium mb-8">
                This certificate has been revoked by the issuing institution.
              </p>
              <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4">
                <InfoRow label="Certificate ID" value={cert.certificate_id} />
                <InfoRow label="Student Name" value={cert.student_name} />
                <InfoRow label="Program" value={cert.course_title} />
                <InfoRow label="Status" value="Revoked" valueClassName="text-amber-600 font-bold" />
              </div>
            </div>
          )}

          {cert && cert.status === "active" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Verified ✓</h2>
              <p className="text-sm text-slate-500 font-medium mb-8">
                This certificate is authentic and was issued by Opsly Academy.
              </p>

              <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-5">
                <InfoRow label="Student Name" value={cert.student_name} />
                <InfoRow label="Program Completed" value={cert.course_title} />
                <InfoRow
                  label="Completion Date"
                  value={new Date(cert.completion_date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
                <InfoRow label="Certificate ID" value={cert.certificate_id} mono />
                <InfoRow label="Status" value="✅ Verified" valueClassName="text-emerald-600 font-bold" />
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Issued by Opsly Academy
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            © {new Date().getFullYear()} OPSlyHR Academy. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const InfoRow = ({
  label,
  value,
  mono,
  valueClassName,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClassName?: string;
}) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-sm font-bold text-slate-900 ${mono ? "font-mono" : ""} ${valueClassName || ""}`}>{value}</p>
  </div>
);

export default VerifyCertificate;
