import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getZoneUrl, Zone } from "@/utils/subdomain";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  DollarSign,
  ArrowRight,
  Globe2,
  Zap,
  Building2,
  Filter,
  X,
  Loader2,
  Users,
  ChevronRight,
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
  skills_required?: string[] | null;
}

const SERVICE_MODEL_LABELS: Record<string, string> = {
  direct_hire: "Direct Hire",
  trial_to_hire: "Trial to Hire",
  contract_talent: "Contract",
  offshore_hiring: "Offshore",
  project_engagement: "Project",
};

const ENGAGEMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
};

const serviceModelColor: Record<string, string> = {
  direct_hire: "bg-emerald-50 text-emerald-700 border-emerald-200",
  trial_to_hire: "bg-blue-50 text-blue-700 border-blue-200",
  contract_talent: "bg-purple-50 text-purple-700 border-purple-200",
  offshore_hiring: "bg-amber-50 text-amber-700 border-amber-200",
  project_engagement: "bg-rose-50 text-rose-700 border-rose-200",
};

const timeAgo = (dateStr: string) => {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const budgetLabel = (job: HireRequest) => {
  if (job.budget_type === "fixed" && job.fixed_budget) {
    return `$${job.fixed_budget.toLocaleString()}`;
  }
  if (job.budget_min && job.budget_max) {
    return `$${job.budget_min.toLocaleString()} – $${job.budget_max.toLocaleString()}`;
  }
  if (job.budget_min) return `From $${job.budget_min.toLocaleString()}`;
  return null;
};

export default function PublicJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [engagementFilter, setEngagementFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("hr_v2_hire_requests")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false });
      if (!error) setJobs((data || []) as HireRequest[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((j) => {
      const matchSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        (j.role_summary || "").toLowerCase().includes(q) ||
        (j.location_preference || "").toLowerCase().includes(q) ||
        (j.service_model || "").toLowerCase().includes(q);
      const matchModel = modelFilter === "all" || j.service_model === modelFilter;
      const matchEngage = engagementFilter === "all" || j.engagement_type === engagementFilter;
      return matchSearch && matchModel && matchEngage;
    });
  }, [jobs, search, modelFilter, engagementFilter]);

  const handleApply = (jobId: string) => {
    if (!user) {
      // Redirect to auth zone login, preserving the return job
      const returnUrl = `${window.location.origin}/jobs/${jobId}`;
      window.location.href = getZoneUrl(Zone.AUTH, `/auth/login?returnTo=${encodeURIComponent(returnUrl)}`);
    } else {
      navigate(`/jobs/${jobId}`);
    }
  };

  const hasActiveFilters = modelFilter !== "all" || engagementFilter !== "all";

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <SEO
        title="Open Roles | Opsly HR — Vetted Remote Talent Opportunities"
        description="Browse open positions exclusively available to Opsly's vetted talent network. Find remote roles across operations, product, customer success, and more."
        keywords="Opsly HR jobs, remote operations roles, vetted talent opportunities, operations jobs Africa"
      />

      {/* ── Sticky Nav ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <a href="https://opslyhr.com" className="flex items-center gap-3 group">
                <img src="/images/logocolored.svg" alt="Opsly HR" className="h-9 w-auto" />
              </a>
              <div className="hidden sm:flex items-center gap-1.5 pl-4 border-l border-slate-200">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Job Board</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <Button
                  onClick={() => window.location.href = getZoneUrl(Zone.TALENT, "/dashboard")}
                  className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg"
                >
                  My Dashboard
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => window.location.href = getZoneUrl(Zone.AUTH, "/auth/login")}
                    className="h-9 px-4 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => window.location.href = getZoneUrl(Zone.AUTH, "/auth/signup/talent")}
                    className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                  >
                    Join as Talent
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0f1f47] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-blue-200 font-semibold mb-6 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-blue-300" />
              {loading ? "Loading roles…" : `${jobs.length} open position${jobs.length !== 1 ? "s" : ""}`}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-5">
              Find your next<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
                remote opportunity
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-xl mb-10">
              Exclusive roles available to Opsly's vetted talent network. Every position is curated and actively managed by our team.
            </p>

            {/* Hero search bar */}
            <div className="flex gap-2 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by role, skill, or location…"
                  className="w-full h-13 pl-11 pr-4 py-3.5 bg-white rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium border-0 shadow-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`h-13 px-5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all border shadow-sm ${showFilters || hasActiveFilters ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-white hover:bg-slate-50"}`}
              >
                <Filter className="h-4 w-4" />
                Filter
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white/80 ml-0.5" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Filter strip ─────────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Filter by:</span>

              {/* Service model */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[{ v: "all", l: "All Types" }, ...Object.entries(SERVICE_MODEL_LABELS).map(([v, l]) => ({ v, l }))].map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => setModelFilter(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${modelFilter === v ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              {/* Engagement type */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[{ v: "all", l: "Any Format" }, ...Object.entries(ENGAGEMENT_LABELS).map(([v, l]) => ({ v, l }))].map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => setEngagementFilter(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${engagementFilter === v ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => { setModelFilter("all"); setEngagementFilter("all"); }}
                  className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500 font-medium">
            {loading ? "Loading…" : (
              <>
                Showing <span className="font-bold text-slate-900">{filtered.length}</span> of{" "}
                <span className="font-bold text-slate-900">{jobs.length}</span> open positions
              </>
            )}
          </p>
          {!user && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
              <Users className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-semibold text-amber-700">Sign in as vetted talent to apply</span>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-slate-500 font-medium">Loading opportunities…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 border border-slate-200">
              <Briefcase className="h-9 w-9 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {search || hasActiveFilters ? "No matching roles" : "No open positions right now"}
            </h3>
            <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
              {search || hasActiveFilters
                ? "Try clearing your filters or adjusting your search term."
                : "New opportunities are posted regularly. Check back soon or join our talent network to be notified first."}
            </p>
            {(search || hasActiveFilters) && (
              <button
                onClick={() => { setSearch(""); setModelFilter("all"); setEngagementFilter("all"); }}
                className="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Job Cards Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((job) => {
              const budget = budgetLabel(job);
              const modelKey = job.service_model || "";
              const modelLabel = SERVICE_MODEL_LABELS[modelKey] || modelKey.replace(/_/g, " ");
              const modelClass = serviceModelColor[modelKey] || "bg-slate-100 text-slate-600 border-slate-200";
              const engagementLabel = job.engagement_type ? (ENGAGEMENT_LABELS[job.engagement_type] || job.engagement_type.replace(/_/g, " ")) : null;

              return (
                <article
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4 flex-1">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        {/* Company placeholder */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-white/80" />
                          </div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Opsly Client</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                          {job.title}
                        </h2>
                      </div>
                      <Badge className={`shrink-0 border text-[11px] font-bold px-2.5 py-1 rounded-full ${modelClass}`}>
                        {modelLabel}
                      </Badge>
                    </div>

                    {/* Summary */}
                    {job.role_summary && (
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">
                        {job.role_summary}
                      </p>
                    )}

                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-2">
                      {(job.location_preference || job.engagement_type) && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {job.location_preference || "Remote"}
                        </span>
                      )}
                      {engagementLabel && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {engagementLabel}
                        </span>
                      )}
                      {job.timezone_overlap && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                          <Globe2 className="h-3 w-3 text-slate-400" />
                          {job.timezone_overlap.replace(/_/g, " ")}
                        </span>
                      )}
                      {budget && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                          <DollarSign className="h-3 w-3" />
                          {budget}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      {timeAgo(job.published_at || job.created_at)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-1 transition-colors">
                        View details <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* CTA for unauthenticated users */}
        {!user && !loading && jobs.length > 0 && (
          <div className="mt-16 rounded-2xl bg-gradient-to-br from-[#0f1f47] to-[#1a3a8a] p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full -mr-32 -mt-32" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-blue-200 font-semibold mb-5 backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5 text-blue-300" />
                Join the Opsly talent network
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
                Ready to apply?
              </h2>
              <p className="text-slate-300 text-base max-w-lg mx-auto leading-relaxed mb-8">
                Only vetted Opsly talents can apply to these roles. Get vetted once and unlock exclusive access to curated remote opportunities with global companies.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={() => window.location.href = getZoneUrl(Zone.AUTH, "/auth/signup/talent")}
                  className="h-12 px-8 bg-white text-slate-900 hover:bg-blue-50 font-bold rounded-xl shadow-lg text-sm transition-all"
                >
                  Apply to Join the Network
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => window.location.href = getZoneUrl(Zone.AUTH, "/auth/login")}
                  className="h-12 px-8 text-white hover:text-white hover:bg-white/10 font-semibold rounded-xl text-sm border border-white/20"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/images/logocolored.svg" alt="Opsly HR" className="h-7 w-auto opacity-80" />
            <span className="text-xs text-slate-400">© 2026 Opsly HR. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://opslyhr.com" className="text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors">opslyhr.com</a>
            <a href="https://opslyhr.com/for-professionals" className="text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors">For Professionals</a>
            <a href="https://opslyhr.com/for-companies" className="text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors">For Companies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
