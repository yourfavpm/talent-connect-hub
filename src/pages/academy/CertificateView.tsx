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
        <div className="bg-white rounded-[12px] shadow-2xl shadow-slate-300/50 overflow-hidden mb-8 max-w-5xl mx-auto border border-slate-100">
          <div
            ref={certRef}
            className="relative bg-white"
            style={{ width: "100%", maxWidth: "1040px", aspectRatio: "1040 / 720", margin: "0 auto", padding: "40px" }}
          >
            {/* Decorative borders */}
            <div className="absolute inset-[20px] border-[8px] border-blue-600 rounded-xl pointer-events-none" />
            <div className="absolute inset-[34px] border border-slate-400 rounded pointer-events-none" />

            {/* Watermark / Background Accent */}
            <div
              className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none"
              style={{
                backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><text x='20' y='80' font-family='sans-serif' font-size='24' font-weight='bold' fill='%232563eb' transform='rotate(-45 80 80)'>OPSlyHR</text></svg>\")",
                backgroundRepeat: "repeat",
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-12">
              {/* Logo */}
              <img
                src="https://opslyhr.com/images/logocolored.svg"
                alt="OPSlyHR"
                className="h-12 md:h-14 mb-8 object-contain"
                crossOrigin="anonymous"
              />

              {/* Title */}
              <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4 tracking-widest uppercase">
                Certificate of Completion
              </h1>

              {/* Certification Text */}
              <p className="text-lg text-slate-500 italic mb-8">This is to certify that</p>

              {/* Student Name */}
              <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 border-b-2 border-slate-300 pb-3 min-w-[60%] inline-block">
                {cert.student_name}
              </h2>

              <p className="text-base text-slate-600 mb-6 max-w-2xl leading-relaxed">
                has successfully completed the program and demonstrated the required skills and competencies in
              </p>

              {/* Course Title */}
              <h3 className="text-2xl md:text-4xl font-semibold text-blue-600 mb-12">
                {cert.course_title}
              </h3>

              {/* Footer Section: Date, Stamp, Signatory */}
              <div className="w-full flex items-end justify-between px-8 mt-4">
                {/* Date Section */}
                <div className="text-center w-48">
                  <div className="text-lg font-bold text-slate-700 mb-2 border-b border-slate-400 pb-1">
                    {new Date(cert.completion_date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                    Date Issued
                  </div>
                </div>

                {/* Stamp Section */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-[3px] border-blue-600 flex items-center justify-center shadow-[0_0_0_4px_white,0_0_0_6px_#bfdbfe] bg-white">
                    <div className="text-center text-blue-600">
                      <div className="text-[10px] font-black uppercase tracking-widest mb-1">
                        Verified
                      </div>
                      <div className="text-2xl leading-none">✓</div>
                      <div className="text-[9px] font-bold uppercase mt-1">
                        Opsly Academy
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatory Section */}
                <div className="text-center w-48">
                  <div
                    className="text-4xl text-slate-900 mb-0 border-b border-slate-400 pb-1 h-12 leading-[48px]"
                    style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}
                  >
                    Opsly Team
                  </div>
                  <div className="text-sm text-slate-600 font-bold mt-1">OPSly Academy Team</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                    Program Manager
                  </div>
                </div>
              </div>

              {/* Certificate ID Footer */}
              <div className="mt-12 text-xs text-slate-400 font-sans tracking-wider flex items-center justify-between w-full px-8">
                <div>CERTIFICATE ID: {cert.certificate_id}</div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest">Verify:</span>
                  <QRCodeSVG
                    value={cert.verification_url || "https://academy.opslyhr.com"}
                    size={40}
                    level="M"
                    bgColor="transparent"
                    fgColor="#94a3b8"
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
