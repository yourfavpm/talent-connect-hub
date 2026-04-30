import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Download, Share2, Copy, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

interface CertificateData {
  id: string;
  certificate_id: string;
  student_name: string;
  course_title: string;
  course_description: string;
  completion_date: string;
  issued_at: string;
  mentors: { name: string; title: string }[];
  verification_url: string;
  status: string;
}

const CertificateView = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const { toast } = useToast();
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const { data, error } = await supabase
          .from("certificates")
          .select("*")
          .eq("certificate_id", certificateId)
          .single();

        if (error) throw error;
        setCert(data as unknown as CertificateData);
      } catch (err) {
        console.error("Failed to fetch certificate:", err);
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) fetchCert();
  }, [certificateId]);

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;

    toast({ title: "Generating PDF...", description: "Please wait while we prepare your certificate." });

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 1120,
        height: 800,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1120, 800] });
      pdf.addImage(imgData, "PNG", 0, 0, 1120, 800);
      pdf.save(`Opsly-Certificate-${cert?.certificate_id}.pdf`);

      toast({ title: "Downloaded!", description: "Certificate PDF has been saved." });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    }
  };

  const handleCopyLink = () => {
    if (cert?.verification_url) {
      navigator.clipboard.writeText(cert.verification_url);
      toast({ title: "Link Copied", description: "Verification URL copied to clipboard." });
    }
  };

  const handleShareLinkedIn = () => {
    if (cert?.verification_url) {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cert.verification_url)}`,
        "_blank",
        "width=600,height=400"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Certificate Not Found</h2>
          <p className="text-slate-500 mb-6">This certificate does not exist or has been removed.</p>
          <Link to="/dashboard/certificates">
            <Button variant="outline" className="rounded-xl font-bold">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Certificates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const mentors = cert.mentors || [];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8 font-inter">
      <div className="max-w-[1200px] mx-auto">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <Link to="/dashboard/certificates" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Certificates
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> Verified by Opsly
            </div>
          </div>
        </div>

        {/* Certificate Card */}
        <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 overflow-hidden mb-8">
          <div
            ref={certRef}
            className="relative p-16 md:p-20"
            style={{ width: "100%", maxWidth: "1120px", aspectRatio: "1120 / 800", margin: "0 auto" }}
          >
            {/* Decorative Border */}
            <div className="absolute inset-6 border-2 border-slate-200/60 rounded-[24px] pointer-events-none" />
            <div className="absolute inset-8 border border-slate-100/80 rounded-[20px] pointer-events-none" />

            {/* Subtle corner accents */}
            <div className="absolute top-10 left-10 w-16 h-16 border-l-2 border-t-2 border-blue-200/50 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-10 right-10 w-16 h-16 border-r-2 border-t-2 border-blue-200/50 rounded-tr-xl pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-16 h-16 border-l-2 border-b-2 border-blue-200/50 rounded-bl-xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-16 h-16 border-r-2 border-b-2 border-blue-200/50 rounded-br-xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
              {/* Logo */}
              <img
                src="https://opslyhr.com/images/logocolored.png"
                alt="OPSlyHR"
                className="h-10 md:h-12 mb-8 object-contain"
                crossOrigin="anonymous"
              />

              {/* Title */}
              <h1
                className="text-2xl md:text-4xl font-bold text-slate-800 mb-10 tracking-wide"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Certificate of Completion
              </h1>

              {/* Certification Text */}
              <p className="text-sm md:text-base text-slate-500 font-medium mb-4 max-w-xl leading-relaxed">
                This certifies that
              </p>

              {/* Student Name */}
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                {cert.student_name}
              </h2>

              <p className="text-sm md:text-base text-slate-500 font-medium mb-2 max-w-xl leading-relaxed">
                has successfully completed the program
              </p>

              {/* Course Title */}
              <h3
                className="text-xl md:text-2xl font-bold text-blue-700 mb-10 tracking-tight"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {cert.course_title}
              </h3>

              {/* Completion Date */}
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-12">
                Completed on{" "}
                {new Date(cert.completion_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>

              {/* Signatures */}
              {mentors.length > 0 && (
                <div className="flex items-end justify-center gap-16 mb-10">
                  {mentors.map((mentor, i) => (
                    <div key={i} className="text-center">
                      <div className="w-32 border-b border-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-800">{mentor.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {mentor.title || "Instructor"}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer: Certificate ID + QR Code */}
              <div className="flex items-end justify-between w-full mt-auto">
                <div className="text-left">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Certificate ID
                  </p>
                  <p className="text-xs font-mono text-slate-500">{cert.certificate_id}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Verify at
                    </p>
                    <p className="text-[10px] text-blue-600 font-medium">{cert.verification_url}</p>
                  </div>
                  <QRCodeSVG
                    value={cert.verification_url || "https://academy.opslyhr.com"}
                    size={64}
                    level="M"
                    bgColor="transparent"
                    fgColor="#334155"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={handleDownloadPDF}
            className="h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold gap-2 shadow-lg"
          >
            <Download className="w-5 h-5" /> Download PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="h-14 px-10 rounded-2xl font-bold gap-2 border-slate-200"
          >
            <Copy className="w-5 h-5" /> Copy Verification Link
          </Button>
          <Button
            variant="outline"
            onClick={handleShareLinkedIn}
            className="h-14 px-10 rounded-2xl font-bold gap-2 border-slate-200"
          >
            <Share2 className="w-5 h-5" /> Share on LinkedIn
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CertificateView;
