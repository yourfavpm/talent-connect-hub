import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const certRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const { data, error } = await supabase
          .from("certificates")
          .select("id, certificate_id, student_name, course_title, course_description, completion_date, issued_at, mentors, verification_url, status")
          .eq("certificate_id", certificateId)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setCert(data as unknown as CertificateData);
        }
      } catch (e) {
        console.error(e);
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
              <p className="text-sm text-slate-500 font-medium mb-6">
                This certificate is authentic and was issued by Opsly Academy.
              </p>

              <div className="mb-8 flex items-center justify-center gap-3">
                <Button
                  onClick={async () => {
                    if (!cert) return;
                    try {
                      const html2canvas = (await import("html2canvas")).default;
                      const { jsPDF } = await import("jspdf");

                      const temp = document.createElement('div');
                      temp.style.width = '1120px';
                      temp.style.height = '800px';
                      temp.style.padding = '40px';
                      temp.style.boxSizing = 'border-box';
                      temp.innerHTML = `
                        <div style="font-family: Georgia, 'Times New Roman', serif; width:1040px; height:720px; display:flex; align-items:center; justify-content:center; background:#ffffff; position:relative; overflow:hidden;">
                          <!-- Decorative borders -->
                          <div style="position:absolute; inset:20px; border:8px solid #2563eb; border-radius:12px;"></div>
                          <div style="position:absolute; inset:34px; border:1px solid #94a3b8; border-radius:4px;"></div>
                          
                          <!-- Watermark / Background Accent -->
                          <div style="position:absolute; inset:0; opacity:0.02; background-image:url('https://opslyhr.com/images/logocolored.svg'); background-size:50%; background-position:center; background-repeat:no-repeat; mix-blend-mode:multiply;"></div>
                          
                          <div style="position:relative; z-index:10; width:800px; text-align:center;">
                            <!-- Header / Logo -->
                            <img src="https://opslyhr.com/images/logocolored.svg" style="height:56px; margin-bottom:30px;" />
                            
                            <h1 style="font-size:48px; font-weight:700; color:#1e293b; margin:0 0 16px 0; letter-spacing:2px; text-transform:uppercase;">Certificate of Completion</h1>
                            
                            <p style="font-size:18px; color:#64748b; font-style:italic; margin:0 0 32px 0;">This is to certify that</p>
                            
                            <h2 style="font-size:54px; font-weight:700; color:#0f172a; margin:0 0 24px 0; border-bottom:2px solid #cbd5e1; padding-bottom:12px; display:inline-block; min-width:600px;">${cert.student_name}</h2>
                            
                            <p style="font-size:16px; color:#475569; line-height:1.6; margin:0 auto 24px auto; max-width:600px;">
                              has successfully completed the program and demonstrated the required skills and competencies in
                            </p>
                            
                            <h3 style="font-size:32px; font-weight:600; color:#2563eb; margin:0 0 40px 0;">${cert.course_title}</h3>
                            
                            <!-- Signatures & Stamps Footer -->
                            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:60px; padding:0 40px;">
                              
                              <!-- Date Section -->
                              <div style="text-align:center; width:200px;">
                                <div style="font-size:18px; font-weight:600; color:#334155; margin-bottom:8px; border-bottom:1px solid #94a3b8; padding-bottom:4px;">
                                  ${new Date(cert.completion_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                </div>
                                <div style="font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:1px;">Date Issued</div>
                              </div>
                              
                              <!-- Stamp -->
                              <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
                                <div style="width:100px; height:100px; border-radius:50%; border:3px solid #2563eb; display:flex; align-items:center; justify-content:center; position:relative; box-shadow:0 0 0 4px white, 0 0 0 6px #bfdbfe;">
                                  <div style="text-align:center; color:#2563eb;">
                                    <div style="font-size:10px; font-weight:800; font-family:sans-serif; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Verified</div>
                                    <div style="font-size:24px; line-height:1;">✓</div>
                                    <div style="font-size:9px; font-weight:700; font-family:sans-serif; text-transform:uppercase; margin-top:2px;">Opsly Academy</div>
                                  </div>
                                </div>
                              </div>
                              
                              <!-- Signatory Section -->
                              <div style="text-align:center; width:200px;">
                                <div style="font-family:'Brush Script MT', cursive, sans-serif; font-size:36px; color:#0f172a; margin-bottom:0px; border-bottom:1px solid #94a3b8; padding-bottom:4px; height:48px; line-height:48px;">
                                  Opsly Team
                                </div>
                                <div style="font-size:12px; color:#64748b; font-weight:600; margin-top:4px;">OPSly Academy Team</div>
                                <div style="font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-top:2px;">Program Manager</div>
                              </div>
                              
                            </div>
                            
                            <!-- Certificate ID Footer -->
                            <div style="margin-top:50px; font-size:11px; color:#94a3b8; font-family:sans-serif; letter-spacing:1px;">
                              CERTIFICATE ID: ${cert.certificate_id}
                            </div>
                          </div>
                        </div>
                      `;
                      document.body.appendChild(temp);
                      const canvas = await html2canvas(temp, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                      const imgData = canvas.toDataURL('image/png');
                      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1120, 800] });
                      pdf.addImage(imgData, 'PNG', 0, 0, 1120, 800);
                      pdf.save(`Opsly-Certificate-${cert.certificate_id}.pdf`);
                      document.body.removeChild(temp);
                    } catch (err) {
                      console.error('Certificate download error:', err);
                    }
                  }}
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold w-full sm:w-auto"
                >
                  Download Certificate
                </Button>
              </div>

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


              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
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
