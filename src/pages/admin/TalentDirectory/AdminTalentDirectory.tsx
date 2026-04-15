import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Filter,
  UserPlus,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// Types
interface TalentBase {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  talent_id: string | null;
  primary_role: string | null;
  country: string | null;
  timezone: string | null;
}

interface TalentProfile {
  id: string;
  user_id: string;
  status: string;
  progress_percent: number;
  is_suspended: boolean;
  vetting_level_text: string | null;
  created_at: string;
  talents: TalentBase | null;
}

// Tabs defined by pipeline stages
const PIPELINE_TABS = [
  { id: "all", label: "All Talents" },
  { id: "new", label: "New Signups" },
  { id: "incomplete", label: "Profile Incomplete" },
  { id: "pending", label: "Pending Vetting" },
  { id: "review", label: "In Review" },
  { id: "changes", label: "Changes Requested" },
  { id: "vetted", label: "Fully Vetted" },
  { id: "suspended", label: "Suspended" },
];

interface AdminTalentDirectoryProps {
  mode?: "global" | "manager" | "pipeline";
}

const AdminTalentDirectory = ({ mode = "global" }: AdminTalentDirectoryProps) => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(mode === "pipeline" ? "review" : "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [talents, setTalents] = useState<TalentProfile[]>([]);

  const fetchTalents = async () => {
    const shouldScopeToManager = userRole === "talent_manager" || mode !== "global";
    if (shouldScopeToManager && !user?.id) return;
    setLoading(true);
    try {
      // Fetch V2 profiles joined with talent base data
      let query = supabase
        .from("v2_talent_profiles")
        .select(`
          *,
          talents:user_id (
            first_name,
            last_name,
            email,
            talent_id,
            primary_role,
            country,
            timezone
          )
        `);

      if (shouldScopeToManager) {
        query = query.eq("talent_manager_admin_id", user.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setTalents((data as any[]) || []);
    } catch (err) {
      console.error("Error fetching talents:", err);
      toast.error("Failed to load talent directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalents();
  }, [user?.id, userRole, mode]);

  const filteredTalents = useMemo(() => {
    return talents.filter((tp) => {
      const talent = tp.talents;
      const name = `${talent?.first_name || ""} ${talent?.last_name || ""}`.toLowerCase();
      const email = (talent?.email || "").toLowerCase();
      const tid = (talent?.talent_id || "").toLowerCase();
      const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase()) || tid.includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Tab filtering
      switch (activeTab) {
        case "new":
          return tp.progress_percent === 0;
        case "incomplete":
          return tp.progress_percent < 100 && (tp.status === "draft" || tp.status === "in_progress");
        case "pending":
          return tp.status === "submitted" || tp.status === "resubmitted";
        case "review":
          return tp.status === "in_review";
        case "changes":
          return tp.status === "changes_requested";
        case "vetted":
          return tp.status === "vetted";
        case "suspended":
          return tp.is_suspended;
        default:
          return true;
      }
    });
  }, [talents, activeTab, searchQuery]);

  const getStatusBadge = (status: string, suspended: boolean) => {
    if (suspended) return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-100 hover:bg-red-100">Suspended</Badge>;
    
    const config: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
      submitted: { label: "Submitted", className: "bg-blue-50 text-blue-700 border-blue-100" },
      in_review: { label: "In Review", className: "bg-amber-50 text-amber-700 border-amber-100" },
      changes_requested: { label: "Action Required", className: "bg-red-50 text-red-700 border-red-100" },
      resubmitted: { label: "Resubmitted", className: "bg-indigo-50 text-indigo-700 border-indigo-100" },
      vetted: { label: "Verified", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    };

    const s = config[status] || config.draft;
    return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6 w-full max-w-none pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {mode === "manager" || userRole === "talent_manager" ? "My Talents" : "Talent Pipeline"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === "manager" || userRole === "talent_manager"
              ? "Manage and track your assigned talent portfolio."
              : "Manage global talent across all lifecycle stages."}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="h-9 gap-2">
             <Filter className="h-3.5 w-3.5" /> Filters
           </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto hide-scrollbar">
        {PIPELINE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`
              px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap
              ${activeTab === t.id 
                ? "border-slate-900 text-slate-900" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"}
            `}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name, email, or talent ID..."
            className="pl-9 h-10 border-none shadow-none focus-visible:ring-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 text-slate-200 animate-spin" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Directory...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 py-4">Talent</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 py-4">Status</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 py-4">Progress</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 py-4">Vetting</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 py-4">Location</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-500 py-4 text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTalents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                       <UserPlus className="h-10 w-10 text-slate-100" />
                       <p className="text-sm font-medium">No talents found in this stage.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTalents.map((tp) => (
                  <TableRow 
                    key={tp.id} 
                    className="group hover:bg-slate-50/50 cursor-pointer"
                    onClick={() => navigate(`/talents/${tp.id}`)}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-slate-200">
                          <AvatarFallback className="bg-slate-50 text-slate-600 text-xs font-bold">
                            {tp.talents?.first_name?.[0]}{tp.talents?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">{tp.talents?.first_name} {tp.talents?.last_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-slate-400 font-medium truncate">{tp.talents?.email}</p>
                            {tp.talents?.talent_id && (
                               <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase bg-slate-50 px-1 rounded border border-slate-100">
                                 {tp.talents.talent_id}
                               </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       {getStatusBadge(tp.status, tp.is_suspended)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${tp.progress_percent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${tp.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 w-8">{tp.progress_percent}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       {tp.vetting_level_text ? (
                          <span className="text-xs font-semibold text-slate-600 px-2 py-0.5 border border-slate-200 rounded bg-white">
                            {tp.vetting_level_text}
                          </span>
                       ) : (
                          <span className="text-xs text-slate-400">—</span>
                       )}
                    </TableCell>
                    <TableCell>
                       <div className="space-y-0.5">
                         <p className="text-xs text-slate-600 font-medium">{tp.talents?.country || "—"}</p>
                         <p className="text-[10px] text-slate-400">{tp.talents?.timezone || "—"}</p>
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               Total: {filteredTalents.length} talents matching filters
             </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTalentDirectory;
