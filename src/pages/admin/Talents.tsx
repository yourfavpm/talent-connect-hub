import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ChevronRight,
  MoreHorizontal,
  AlertTriangle,
  UserPlus,
  Award,
  RotateCcw,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  UserCircle,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import AssignManagerDrawer from "./TalentVetting/components/drawers/AssignManagerDrawer";
import SkillAssessmentDrawer from "./TalentVetting/components/drawers/SkillAssessmentDrawer";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TalentRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  primary_role: string | null;
  created_at: string;
  vetting_status: string | null;
  assigned_manager: string | null;
  overall_skill_level: string | null;
  skill_assessment_notes: string | null;
  skill_assessment_visible_to_clients: boolean | null;
  onboarding_completed: boolean | null;
  // computed
  uiStatus: "pending" | "changes" | "approved" | "rejected";
  completedSteps: number;
  totalSteps: number;
  attentionSteps: string[];
  managerName: string | null;
}

const STEP_LABELS: Record<string, string> = {
  basic_info: "Basic Info",
  professional_details: "Professional",
  work_history: "Work History",
  documents: "Documents",
  education: "Education",
  certifications: "Certifications",
  references: "References",
  review: "Review",
};

const STATUS_CONFIG = {
  pending: { label: "Pending Review", color: "bg-blue-50 text-blue-700 border-blue-100" },
  changes: { label: "Changes Requested", color: "bg-amber-50 text-amber-700 border-amber-100" },
  approved: { label: "Approved", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-100" },
};

const SKILL_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
  lead: "Lead",
};

// ── Main Component ─────────────────────────────────────────────────────────────

const AdminTalents = () => {
  const navigate = useNavigate();

  const [talents, setTalents] = useState<TalentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stepStatusFilter, setStepStatusFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drawers
  const [assignDrawer, setAssignDrawer] = useState<{ open: boolean; talentId: string; currentManagerId: string | null }>({
    open: false,
    talentId: "",
    currentManagerId: null,
  });
  const [skillDrawer, setSkillDrawer] = useState<{ open: boolean; talent: TalentRow | null }>({
    open: false,
    talent: null,
  });

  // Unique manager names for filter dropdown
  const uniqueManagers = useMemo(() => {
    const names = new Set<string>();
    talents.forEach((t) => {
      if (t.managerName) names.add(t.managerName);
    });
    return Array.from(names).sort();
  }, [talents]);

  // ── Data Fetch ─────────────────────────────────────────────────────────────

  const fetchTalents = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // 1. Fetch talent profiles
      const { data: profiles, error: profileError } = await supabase.from("talent_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profileError) throw profileError;

      // 2. Fetch all talents to join (in a real app with many users, we'd filter or limit, but for this scale it's fine or we can map user_ids)
      const userIds = profiles?.map((p: any) => p.user_id) || [];
      const { data: talentsData, error: talentsError } = await supabase
        .from("talents")
        .select("*")
        .in("user_id", userIds);

      if (talentsError) throw talentsError;

      const talentMap: Record<string, any> = {};
      (talentsData || []).forEach(t => {
        talentMap[t.user_id] = t;
      });

      // 2. Fetch all sections to calculate progress
      const { data: sectionsData, error: sectionsError } = await supabase.from("talent_profile_sections")
        .select("user_id, section_key, status");

      if (sectionsError) console.warn("Sections table error:", sectionsError);

      // 3. Fetch admin profiles for manager names
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name");

      const profileMap: Record<string, string> = {};
      (adminProfiles || []).forEach((p) => {
        profileMap[p.user_id] = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Admin";
      });

      // 4. Group sections by user_id
      const sectionsMap: Record<string, { completed: number; total: number; attention: string[] }> = {};
      ((sectionsData as any[]) || []).forEach((s: any) => {
        if (!sectionsMap[s.user_id]) sectionsMap[s.user_id] = { completed: 0, total: 0, attention: [] };
        sectionsMap[s.user_id].total++;
        if (s.status === "APPROVED") sectionsMap[s.user_id].completed++;
        if (["CHANGES_REQUESTED", "SUBMITTED", "IN_REVIEW"].includes(s.status)) {
          sectionsMap[s.user_id].attention.push(s.section_key);
        }
      });

      // 5. Build rows
      const rows: TalentRow[] = (profiles || []).map((p: any) => {
        const t = talentMap[p.user_id] || {};
        let uiStatus: TalentRow["uiStatus"] = "pending";
        
        if (p.status === "VETTED") uiStatus = "approved";
        else if (p.status === "REJECTED") uiStatus = "rejected";
        else if (p.status === "CHANGES_REQUESTED") uiStatus = "changes";
        else uiStatus = "pending";

        const sectionInfo = sectionsMap[p.user_id] || { completed: 0, total: 8, attention: [] };

        return {
          id: p.id,
          first_name: t.first_name || "Unknown",
          last_name: t.last_name || "",
          email: t.email || "",
          primary_role: t.primary_role,
          created_at: p.created_at,
          vetting_status: p.status,
          assigned_manager: t.assigned_manager,
          overall_skill_level: t.overall_skill_level,
          skill_assessment_notes: t.skill_assessment_notes,
          skill_assessment_visible_to_clients: t.skill_assessment_visible_to_clients,
          onboarding_completed: p.locked_onboarding,
          uiStatus,
          completedSteps: sectionInfo.completed,
          totalSteps: sectionInfo.total || 8,
          attentionSteps: sectionInfo.attention,
          managerName: t.assigned_manager ? profileMap[t.assigned_manager] || "Unknown" : null,
        };
      });

      setTalents(rows);
    } catch (error: unknown) {
      console.error("Error fetching talents:", error);
      toast.error("Failed to load talent data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTalents();
  }, [fetchTalents]);

  // ── Counts ─────────────────────────────────────────────────────────────────

  const counts = useMemo(() => ({
    pending: talents.filter((t) => t.uiStatus === "pending").length,
    changes: talents.filter((t) => t.uiStatus === "changes").length,
    approved: talents.filter((t) => t.uiStatus === "approved").length,
    rejected: talents.filter((t) => t.uiStatus === "rejected").length,
    unassigned: talents.filter((t) => !t.assigned_manager).length,
  }), [talents]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredTalents = useMemo(() => {
    return talents.filter((t) => {
      if (statusFilter !== "all" && t.uiStatus !== statusFilter) return false;

      if (stepStatusFilter === "needs_review" && t.attentionSteps.length === 0) return false;
      if (stepStatusFilter === "changes_requested" && !t.attentionSteps.some(() => t.uiStatus === "changes")) return false;

      if (managerFilter === "unassigned" && t.managerName) return false;
      if (managerFilter !== "all" && managerFilter !== "unassigned" && t.managerName !== managerFilter) return false;

      if (skillFilter === "not_set" && t.overall_skill_level) return false;
      if (skillFilter !== "all" && skillFilter !== "not_set" && t.overall_skill_level !== skillFilter) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchStr = `${t.first_name} ${t.last_name} ${t.email}`.toLowerCase();
        if (!searchStr.includes(q)) return false;
      }

      return true;
    });
  }, [talents, statusFilter, stepStatusFilter, managerFilter, skillFilter, searchQuery]);

  const hasActiveFilters = statusFilter !== "all" || stepStatusFilter !== "all" || managerFilter !== "all" || skillFilter !== "all" || searchQuery !== "";

  const resetFilters = () => {
    setStatusFilter("all");
    setStepStatusFilter("all");
    setManagerFilter("all");
    setSkillFilter("all");
    setSearchQuery("");
  };

  // ── Bulk selection ─────────────────────────────────────────────────────────

  const selectableTalents = filteredTalents.filter((t) => t.uiStatus === "pending");
  const allSelectableSelected = selectableTalents.length > 0 && selectableTalents.every((t) => selectedIds.has(t.id));

  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableTalents.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAssign = () => {
    // Open assign drawer for first selected talent (simple approach)
    const first = talents.find((t) => selectedIds.has(t.id));
    if (first) {
      setAssignDrawer({ open: true, talentId: first.id, currentManagerId: first.assigned_manager });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-6 w-6 text-gray-300 animate-spin" />
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Loading vetting data…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 font-[Inter]">

      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Talent Vetting</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve incoming talent profiles.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-gray-500 gap-1.5 self-start md:self-auto"
          onClick={() => fetchTalents(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Stats Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { key: "pending", icon: Clock, accent: "text-blue-600 bg-blue-50", border: "border-blue-100" },
          { key: "changes", icon: AlertTriangle, accent: "text-amber-600 bg-amber-50", border: "border-amber-100" },
          { key: "approved", icon: CheckCircle2, accent: "text-emerald-600 bg-emerald-50", border: "border-emerald-100" },
          { key: "rejected", icon: XCircle, accent: "text-red-600 bg-red-50", border: "border-red-100" },
        ] as const).map(({ key, icon: Icon, accent, border }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
            className={`
              relative group text-left p-4 rounded-xl border bg-white shadow-sm transition-all
              hover:shadow-md
              ${statusFilter === key ? `ring-1 ring-offset-1 ${border} ring-current` : "border-gray-100"}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${accent}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{counts[key]}</span>
            </div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{STATUS_CONFIG[key].label}</p>
            {key === "pending" && counts.unassigned > 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                {counts.unassigned} unassigned
              </p>
            )}
          </button>
        ))}
      </div>

      {/* ── Filter Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gray-50/50 border border-gray-100 rounded-xl p-3">
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Search name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full lg:w-[240px] h-9 text-sm bg-white border-gray-200 shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[150px] text-xs bg-white border-gray-200 shadow-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="changes">Changes Requested</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stepStatusFilter} onValueChange={setStepStatusFilter}>
            <SelectTrigger className="h-9 w-[150px] text-xs bg-white border-gray-200 shadow-sm">
              <SelectValue placeholder="Step Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Steps</SelectItem>
              <SelectItem value="needs_review">Needs Review</SelectItem>
              <SelectItem value="changes_requested">Changes Requested</SelectItem>
            </SelectContent>
          </Select>

          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger className="h-9 w-[160px] text-xs bg-white border-gray-200 shadow-sm">
              <SelectValue placeholder="Manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Managers</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {uniqueManagers.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="h-9 w-[130px] text-xs bg-white border-gray-200 shadow-sm">
              <SelectValue placeholder="Skill Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="not_set">Not Set</SelectItem>
              <SelectItem value="junior">Junior</SelectItem>
              <SelectItem value="mid">Mid-Level</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-xs text-gray-500 gap-1.5">
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* ── Bulk Action Bar ───────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 animate-in slide-in-from-top-2">
          <span className="text-xs font-semibold text-blue-700">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-blue-200" />
          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={handleBulkAssign}>
            <UserPlus className="h-3 w-3" /> Assign Manager
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-blue-500" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* ── Review Queue Table ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {filteredTalents.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <UserCircle className="h-10 w-10 text-gray-200 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">
              {hasActiveFilters ? "No talents match your filters" : "No talent profiles submitted yet"}
            </h3>
            <p className="text-xs text-gray-400 mt-1.5 max-w-sm">
              {hasActiveFilters
                ? "Try adjusting your filters or search query."
                : "When talent profiles are submitted for vetting, they will appear here."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="mt-4 h-8 text-xs gap-1.5" onClick={resetFilters}>
                <RotateCcw className="h-3 w-3" /> Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/80 border-b border-gray-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 py-3 pl-4 pr-0">
                    <Checkbox
                      checked={allSelectableSelected}
                      onCheckedChange={toggleSelectAll}
                      className="border-gray-300"
                    />
                  </TableHead>
                  <TableHead className="font-medium text-[10px] text-gray-500 py-3 uppercase tracking-wider">Talent</TableHead>
                  <TableHead className="font-medium text-[10px] text-gray-500 py-3 uppercase tracking-wider hidden lg:table-cell">Role</TableHead>
                  <TableHead className="font-medium text-[10px] text-gray-500 py-3 uppercase tracking-wider hidden md:table-cell">Submitted</TableHead>
                  <TableHead className="font-medium text-[10px] text-gray-500 py-3 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="font-medium text-[10px] text-gray-500 py-3 uppercase tracking-wider hidden xl:table-cell">Steps</TableHead>
                  <TableHead className="font-medium text-[10px] text-gray-500 py-3 uppercase tracking-wider hidden xl:table-cell">Needs Attention</TableHead>
                  <TableHead className="font-medium text-[10px] text-gray-500 py-3 uppercase tracking-wider hidden lg:table-cell">Skill</TableHead>
                  <TableHead className="font-medium text-[10px] text-gray-500 py-3 uppercase tracking-wider hidden md:table-cell">Manager</TableHead>
                  <TableHead className="font-semibold text-[10px] text-gray-500 py-3 uppercase tracking-wider text-right w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTalents.map((t) => {
                  const needsEmphasis = t.uiStatus === "changes" || !t.assigned_manager;
                  return (
                    <TableRow
                      key={t.id}
                      className={`
                        group border-b border-gray-50 cursor-pointer transition-colors
                        ${needsEmphasis ? "bg-amber-50/20 hover:bg-amber-50/40" : "hover:bg-gray-50/50"}
                      `}
                      onClick={(e) => {
                        // Don't navigate if clicking checkbox or kebab
                        const target = e.target as HTMLElement;
                        if (target.closest("[data-no-navigate]")) return;
                        navigate(`/admin/talents/${t.id}/vetting`);
                      }}
                    >
                      {/* Checkbox */}
                      <TableCell className="py-3 pl-4 pr-0" data-no-navigate>
                        <Checkbox
                          checked={selectedIds.has(t.id)}
                          onCheckedChange={() => toggleSelect(t.id)}
                          className="border-gray-300"
                          disabled={t.uiStatus !== "pending"}
                        />
                      </TableCell>

                      {/* Talent */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-gray-200 flex-shrink-0">
                            <AvatarFallback className="bg-gray-50 text-[10px] font-bold text-gray-500">
                              {t.first_name?.[0]}{t.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{t.first_name} {t.last_name}</p>
                            <p className="text-[11px] text-gray-400 font-mono truncate">{t.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell className="py-3 hidden lg:table-cell">
                        <span className="text-xs text-gray-600 capitalize">{t.primary_role?.replace(/_/g, " ") || "—"}</span>
                      </TableCell>

                      {/* Submitted */}
                      <TableCell className="py-3 text-xs text-gray-500 hidden md:table-cell">
                        {t.created_at
                          ? new Date(t.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3">
                        <Badge className={`text-[10px] font-semibold border ${STATUS_CONFIG[t.uiStatus].color} hover:opacity-80`}>
                          {STATUS_CONFIG[t.uiStatus].label}
                        </Badge>
                      </TableCell>

                      {/* Steps */}
                      <TableCell className="py-3 hidden xl:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: t.totalSteps }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-1.5 w-3 rounded-full ${i < t.completedSteps ? "bg-emerald-400" : "bg-gray-200"}`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-semibold text-gray-400 tabular-nums">{t.completedSteps}/{t.totalSteps}</span>
                          {t.attentionSteps.length > 0 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {t.attentionSteps.length} step{t.attentionSteps.length > 1 ? "s" : ""} need attention
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>

                      {/* Needs Attention */}
                      <TableCell className="py-3 hidden xl:table-cell">
                        {t.attentionSteps.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {t.attentionSteps.slice(0, 3).map((step) => (
                              <span
                                key={step}
                                className="inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap"
                              >
                                {STEP_LABELS[step] || step}
                              </span>
                            ))}
                            {t.attentionSteps.length > 3 && (
                              <span className="text-[9px] font-semibold text-amber-500">+{t.attentionSteps.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300">—</span>
                        )}
                      </TableCell>

                      {/* Skill Level */}
                      <TableCell className="py-3 hidden lg:table-cell">
                        {t.overall_skill_level ? (
                          <Badge variant="outline" className="text-[10px] font-semibold border-gray-200 text-gray-700">
                            {SKILL_LABELS[t.overall_skill_level] || t.overall_skill_level}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-gray-300 italic">Not set</span>
                        )}
                      </TableCell>

                      {/* Manager */}
                      <TableCell className="py-3 hidden md:table-cell">
                        {t.managerName ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Users className="h-2.5 w-2.5 text-gray-500" />
                            </div>
                            <span className="text-xs text-gray-600 truncate max-w-[100px]">{t.managerName}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-500 font-medium">Unassigned</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right" data-no-navigate>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssignDrawer({ open: true, talentId: t.id, currentManagerId: t.assigned_manager });
                              }}
                              className="text-xs gap-2"
                            >
                              <UserPlus className="h-3.5 w-3.5" /> Assign Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSkillDrawer({ open: true, talent: t });
                              }}
                              className="text-xs gap-2"
                            >
                              <Award className="h-3.5 w-3.5" /> Set Skill Level
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/talents/${t.id}/vetting`);
                              }}
                              className="text-xs gap-2"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Vetting
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Table footer with count */}
        {filteredTalents.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              Showing {filteredTalents.length} of {talents.length} talent{talents.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ── Drawers ───────────────────────────────────────────────────────────── */}
      <AssignManagerDrawer
        open={assignDrawer.open}
        onOpenChange={(v) => !v && setAssignDrawer((prev) => ({ ...prev, open: false }))}
        talentId={assignDrawer.talentId}
        currentManagerId={assignDrawer.currentManagerId}
        onSuccess={() => {
          fetchTalents(true);
          setSelectedIds(new Set());
        }}
      />

      {skillDrawer.talent && (
        <SkillAssessmentDrawer
          open={skillDrawer.open}
          onOpenChange={(v) => !v && setSkillDrawer({ open: false, talent: null })}
          talent={skillDrawer.talent}
          onSuccess={() => fetchTalents(true)}
        />
      )}
    </div>
  );
};

export default AdminTalents;
