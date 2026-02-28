import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ArrowRight, ClipboardList, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

interface TalentRow {
  profileId: string;
  userId: string;
  talentId: string | null;
  name: string;
  email: string;
  status: string;
  progress: number;
  submittedAt: string | null;
  managerName: string | null;
  levelText: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted:         { label: "Submitted",         color: "bg-blue-100 text-blue-700" },
  in_review:         { label: "In Review",         color: "bg-amber-100 text-amber-700" },
  changes_requested: { label: "Changes Requested", color: "bg-red-100 text-red-700" },
  resubmitted:       { label: "Resubmitted",       color: "bg-blue-100 text-blue-700" },
  draft:             { label: "Draft",             color: "bg-slate-100 text-slate-600" },
  vetted:            { label: "Verified",          color: "bg-emerald-100 text-emerald-700" },
  revett_required:   { label: "Re-vetting Req",    color: "bg-rose-100 text-rose-700" },
  revett_pending:    { label: "Re-vetting Pend",   color: "bg-orange-100 text-orange-700" },
};

type TabType = "pending" | "in_review" | "changes" | "vetted";

// ── Component ────────────────────────────────────────────────────────────

const VettingQueueV2 = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("pending");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<TalentRow[]>([]);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch V2 profiles
      const { data: profiles } = await supabase
        .from("v2_talent_profiles")
        .select("*")
        .order("submitted_at", { ascending: false, nullsFirst: false }) as { data: any[] | null };

      // 2. Fetch talent names/emails
      const userIds = (profiles || []).map(p => p.user_id);
      const { data: talents } = await supabase
        .from("talents")
        .select("user_id, talent_id, first_name, last_name, email")
        .in("user_id", userIds.length > 0 ? userIds : ["__none__"]) as { data: any[] | null };

      // 3. Fetch managers
      const managerIds = [...new Set((profiles || []).map(p => p.talent_manager_admin_id).filter(Boolean))];
      const { data: managers } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", managerIds.length > 0 ? managerIds : ["__none__"]) as { data: any[] | null };

      // Maps for quick lookup
      const talentMap = new Map();
      (talents || []).forEach(t => {
        talentMap.set(t.user_id, {
          talent_id: t.talent_id,
          name: `${t.first_name || ""} ${t.last_name || ""}`.trim() || "Unknown",
          email: t.email,
        });
      });

      const managerMap = new Map();
      (managers || []).forEach(m => {
        managerMap.set(m.id, `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Unknown");
      });

      // Construct rows
      const mapped: TalentRow[] = (profiles || []).map(p => {
        const talent = talentMap.get(p.user_id);
        return {
          profileId: p.id,
          userId: p.user_id,
          talentId: talent?.talent_id || p.talent_id,
          name: talent?.name || "Unknown",
          email: talent?.email || "",
          status: p.status,
          progress: p.progress_percent,
          submittedAt: p.submitted_at,
          managerName: p.talent_manager_admin_id ? managerMap.get(p.talent_manager_admin_id) : null,
          levelText: p.vetting_level_text,
        };
      });

      setRows(mapped);
    } catch (err) {
      console.error("Queue fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // ── Derived State (Filtering) ──────────────────────────────────────────

  const { filteredRows, counts } = useMemo(() => {
    let pendingCount = 0;
    let reviewCount = 0;
    let changesCount = 0;
    let vettedCount = 0;

    const filtered = rows.filter(r => {
      // Counts (ignore search for raw counts)
      if (["submitted", "resubmitted", "revett_pending"].includes(r.status)) pendingCount++;
      if (r.status === "in_review") reviewCount++;
      if (r.status === "changes_requested" || r.status === "revett_required") changesCount++;
      if (r.status === "vetted") vettedCount++;

      // Search filter
      const inSearch = !search || 
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase()) ||
        (r.talentId || "").toLowerCase().includes(search.toLowerCase());

      if (!inSearch) return false;

      // Tab filter
      if (tab === "pending") return ["submitted", "resubmitted", "revett_pending"].includes(r.status);
      if (tab === "in_review") return r.status === "in_review";
      if (tab === "changes") return ["changes_requested", "revett_required"].includes(r.status);
      if (tab === "vetted") return r.status === "vetted";
      
      return false;
    });

    return { filteredRows: filtered, counts: { pendingCount, reviewCount, changesCount, vettedCount } };
  }, [rows, search, tab]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vetting Queue</h1>
        <p className="text-sm text-slate-500 mt-1">Manage talent profiles and vetting requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto hide-scrollbar">
        <Button
          variant="ghost"
          onClick={() => setTab("pending")}
          className={`gap-2 rounded-none border-b-2 px-4 whitespace-nowrap ${tab === "pending" ? "border-slate-900 text-slate-900 font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <ClipboardList className="h-4 w-4" /> Pending Review
          <Badge variant="secondary" className="ml-1 font-bold">{counts.pendingCount}</Badge>
        </Button>
        <Button
          variant="ghost"
          onClick={() => setTab("in_review")}
          className={`gap-2 rounded-none border-b-2 px-4 whitespace-nowrap ${tab === "in_review" ? "border-slate-900 text-slate-900 font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <Clock className="h-4 w-4" /> In Review
          <Badge variant="secondary" className="ml-1 font-bold">{counts.reviewCount}</Badge>
        </Button>
        <Button
          variant="ghost"
          onClick={() => setTab("changes")}
          className={`gap-2 rounded-none border-b-2 px-4 whitespace-nowrap ${tab === "changes" ? "border-slate-900 text-slate-900 font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <AlertCircle className="h-4 w-4" /> Changes Requested
          <Badge variant="secondary" className="ml-1 font-bold">{counts.changesCount}</Badge>
        </Button>
        <Button
          variant="ghost"
          onClick={() => setTab("vetted")}
          className={`gap-2 rounded-none border-b-2 px-4 whitespace-nowrap ${tab === "vetted" ? "border-slate-900 text-slate-900 font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <CheckCircle2 className="h-4 w-4" /> Vetted
          <Badge variant="secondary" className="ml-1 font-bold">{counts.vettedCount}</Badge>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : filteredRows.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-20 text-center text-slate-500">
            <ClipboardList className="h-10 w-10 mx-auto text-slate-200 mb-4" />
            <p className="font-medium">No talents found in this category.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50">
                <tr className="border-b border-slate-100 uppercase text-[11px] font-bold text-slate-500 tracking-wider">
                  <th className="p-4">Talent</th>
                  <th className="p-4">Status & Level</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">Submitted</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map(r => {
                  const statusCfg = STATUS_LABELS[r.status] || STATUS_LABELS.draft;
                  return (
                    <tr key={r.profileId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{r.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{r.email}</span>
                          {r.talentId && <span className="font-mono bg-slate-100 px-1.5 py-px rounded">{r.talentId}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge className={`${statusCfg.color} shadow-none font-bold text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-sm`}>
                            {statusCfg.label}
                          </Badge>
                          {r.levelText && (
                            <span className="text-xs font-semibold text-slate-600 border border-slate-200 bg-white px-2 py-px rounded">
                              {r.levelText}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden shrink-0">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.progress}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-8">{r.progress}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-700 font-medium">
                          {r.managerName || <span className="text-slate-400 italic font-normal">Unassigned</span>}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/talents/${r.profileId}`)}
                            className="font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/vetting/${r.profileId}`)}
                            className="font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100 transition-colors"
                          >
                            Review <ArrowRight className="h-4 w-4 ml-1.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VettingQueueV2;
