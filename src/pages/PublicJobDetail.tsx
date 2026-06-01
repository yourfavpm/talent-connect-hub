import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getZoneUrl, Zone } from "@/utils/subdomain";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Globe2,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Loader2,
  AlertCircle,
  Zap,
  Users,
  Share2,
  Copy,
  Check,
} from "lucide-react";

interface HireRequest {
  id: string;
  title: string;
  status: string;
  service_model: string | null;
  engagement_type: string | null;
  location_preference: string | null;
  timezone_overlap: string | null;
  budget_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  fixed_budget: number | null;
  role_summary: string | null;
  responsibilities: string | null;
  requirements: string | null;
  created_at: string;
  published_at: string | null;
  preferred_currency?: string | null;
  salary_type?: string | null;
}

const SERVICE_MODEL_LABELS: Record<string, string> = {
  direct_hire: "Direct Hire",
  trial_to_hire: "Trial to Hire",
  contract_talent: "Contract",
  offshore_hiring: "Offshore Hiring",
  project_engagement: "Project Engagement",
};

const serviceModelColor: Record<string, string> = {
  direct_hire: "bg-emerald-50 text-emerald-700 border-emerald-200",
  trial_to_hire: "bg-blue-50 text-blue-700 border-blue-200",
  contract_talent: "bg-purple-50 text-purple-700 border-purple-200",
  offshore_hiring: "bg-amber-50 text-amber-700 border-amber-200",
  project_engagement: "bg-rose-50 text-rose-700 border-rose-200",
};

const ENGAGEMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
};

const getCurrencySymbol = (code: string | null | undefined) => {
  const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", NGN: "₦", KES: "KSh ", ZAR: "R " };
  return symbols[code || "USD"] || "$";
};

const budgetLabel = (job: HireRequest) => {
  const sym = getCurrencySymbol(job.preferred_currency);
  const freq = job.salary_type === "monthly" ? "/mo" : (job.salary_type === "hourly" ? "/hr" : "");
  if (job.budget_type === "fixed" && job.fixed_budget) {
    return `${sym}${job.fixed_budget.toLocaleString()}`;
  }
  if (job.budget_min && job.budget_max) {
    return `${sym}${job.budget_min.toLocaleString()} – ${sym}${job.budget_max.toLocaleString()}${freq}`;
  }
  if (job.budget_min) return `From ${sym}${job.budget_min.toLocaleString()}${freq}`;
  return null;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

// Render rich text content — split by lines and handle bullet points
const ContentBlock = ({ text }: { text: string }) => {
  const lines = text.split("\n").filter(Boolean);
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const isBullet = line.trim().startsWith("-") || line.trim().startsWith("•") || line.trim().startsWith("*");
        if (isBullet) {
          return (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <span className="text-sm text-slate-700 leading-relaxed">{line.replace(/^[-•*]\s*/, "").trim()}</span>
            </div>
          );
        }
        return (
          <p key={i} className="text-sm text-slate-700 leading-relaxed">{line.trim()}</p>
        );
      })}
    </div>
  );
};

export default function PublicJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<HireRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("hr_v2_hire_requests")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setJob(data as HireRequest);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleApply = () => {
    if (!user) {
      const returnUrl = window.location.href;
      window.location.href = getZoneUrl(Zone.AUTH, `/auth/login?returnTo=${encodeURIComponent(returnUrl)}`);
    } else {
      // Redirect talent to their jobs portal where they can formally apply
      window.location.href = getZoneUrl(Zone.TALENT, `/jobs/${id}`);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-500 font-medium">Loading job details…</p>
        </div>
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200">
            <AlertCircle className="h-9 w-9 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Role Not Found</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            This position may have been filled or is no longer available. Browse other open roles below.
          </p>
          <Button
            onClick={() => navigate("/jobs")}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 px-6 font-semibold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Board
          </Button>
        </div>
      </div>
    );
  }

  const modelKey = job.service_model || "";
  const modelLabel = SERVICE_MODEL_LABELS[modelKey] || modelKey.replace(/_/g, " ");
  const modelClass = serviceModelColor[modelKey] || "bg-slate-100 text-slate-600 border-slate-200";
  const budget = budgetLabel(job);
  const engagement = job.engagement_type ? (ENGAGEMENT_LABELS[job.engagement_type] || job.engagement_type.replace(/_/g, " ")) : null;

  const metaChips = [
    job.location_preference && { icon: MapPin, label: job.location_preference },
    engagement && { icon: Clock, label: engagement },
    job.timezone_overlap && { icon: Globe2, label: job.timezone_overlap.replace(/_/g, " ") },
    budget && { icon: DollarSign, label: budget, highlight: true },
  ].filter(Boolean) as { icon: any; label: string; highlight?: boolean }[];

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <SEO
        title={`${job.title} | Opsly HR Job Board`}
        description={job.role_summary || `Open position: ${job.title} — Browse exclusive remote roles on the Opsly HR job board.`}
        keywords={`${job.title}, ${modelLabel}, remote job, Opsly HR opportunities`}
      />

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-10">
        {/* Back navigation */}
        <button
          onClick={() => navigate("/jobs")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-semibold mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to all jobs
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left / Main ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Job Header */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0 shadow-md">
                  <Briefcase className="h-6 w-6 text-white/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Opsly Client</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {job.title}
                  </h1>
                </div>
              </div>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className={`border text-[11px] font-bold px-3 py-1.5 rounded-full ${modelClass}`}>
                  {modelLabel}
                </Badge>
                {metaChips.map((chip, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 border ${chip.highlight ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                  >
                    <chip.icon className="h-3 w-3" />
                    {chip.label}
                  </span>
                ))}
              </div>

              {/* CTA in header */}
              <div className="flex gap-3">
                <Button
                  onClick={handleApply}
                  className="flex-1 sm:flex-none h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm transition-all"
                >
                  {user ? "Apply Now" : "Sign In to Apply"}
                  <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
                <button
                  onClick={handleShare}
                  className="h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-sm font-semibold transition-all"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>

            {/* Role Summary */}
            {job.role_summary && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">About this Role</h2>
                </div>
                <div className="p-6">
                  <ContentBlock text={job.role_summary} />
                </div>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Responsibilities</h2>
                </div>
                <div className="p-6">
                  <ContentBlock text={job.responsibilities} />
                </div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Requirements & Skills</h2>
                </div>
                <div className="p-6">
                  <ContentBlock text={job.requirements} />
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            <div className="bg-gradient-to-br from-[#0f1f47] to-[#1a3a8a] rounded-2xl p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/10 rounded-full -mr-20 -mt-20" />
              <div className="relative">
                <h3 className="text-xl font-extrabold text-white mb-2">Interested in this role?</h3>
                <p className="text-slate-300 text-sm mb-6 max-w-sm mx-auto">
                  {user
                    ? "Apply directly through your Opsly talent portal."
                    : "Join Opsly's vetted talent network to apply for this and other exclusive opportunities."}
                </p>
                <Button
                  onClick={handleApply}
                  className="h-12 px-8 bg-white text-slate-900 hover:bg-blue-50 font-bold rounded-xl shadow-lg text-sm"
                >
                  {user ? "Apply Now" : "Get Vetted & Apply"}
                  <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* ── Right Sidebar ────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Job Quick Facts */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Job Details</h3>
              <div className="space-y-4">
                {[
                  { icon: Briefcase, label: "Type", value: modelLabel },
                  engagement && { icon: Clock, label: "Format", value: engagement },
                  job.location_preference && { icon: MapPin, label: "Location", value: job.location_preference },
                  job.timezone_overlap && { icon: Globe2, label: "Timezone", value: job.timezone_overlap.replace(/_/g, " ") },
                  budget && { icon: DollarSign, label: "Compensation", value: budget },
                ].filter(Boolean).map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      <item.icon className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-900 capitalize mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    <Zap className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Published</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {formatDate(job.published_at || job.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ready to Apply?</h3>
              {!user ? (
                <>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    Sign in as a vetted Opsly talent to submit your application for this role.
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => window.location.href = getZoneUrl(Zone.AUTH, `/auth/login?returnTo=${encodeURIComponent(window.location.href)}`)}
                      className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
                    >
                      Sign In to Apply
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = getZoneUrl(Zone.AUTH, "/auth/signup/talent")}
                      className="w-full h-11 border-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                    >
                      Join the Network
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    You're signed in. Apply directly through your talent portal.
                  </p>
                  <Button
                    onClick={handleApply}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
                  >
                    Apply Now
                    <ChevronRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </>
              )}
            </div>

            {/* About Opsly */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10" />
              <div className="relative">
                <img src="/images/logocolored.svg" alt="Opsly HR" className="h-7 w-auto mb-4 opacity-90" />
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  Opsly HR curates top-tier remote talent and matches them with global companies. Every role is actively managed by our team.
                </p>
                <a
                  href="https://opslyhr.com"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-300 hover:text-blue-200 transition-colors"
                >
                  Learn more about Opsly
                  <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Share */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Share this Role</h3>
              <p className="text-sm text-slate-500 mb-4">Know someone who'd be a great fit? Share this opportunity.</p>
              <button
                onClick={handleShare}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Link Copied!" : "Copy Job Link"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
