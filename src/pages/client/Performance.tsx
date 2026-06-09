import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Target,
  Star,
  Plus,
  TrendingUp,
  CheckCircle,
  Archive,
  User,
  Loader2,
  Edit2,
} from "lucide-react";
import { format } from "date-fns";

// ── Types ──────────────────────────────────────────────────────
interface KPI {
  id: string;
  talent_user_id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  period: string;
  due_date: string | null;
  status: string;
  created_at: string;
  talent?: { first_name: string; last_name: string; email: string };
}

interface Review {
  id: string;
  talent_user_id: string;
  review_period: string | null;
  overall_score: number | null;
  ratings: Record<string, number>;
  notes: string | null;
  shared_with_talent: boolean;
  created_at: string;
  talent?: { first_name: string; last_name: string };
}

interface HiredTalent {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const REVIEW_CRITERIA = [
  { key: "communication", label: "Communication" },
  { key: "delivery", label: "Delivery & Output" },
  { key: "availability", label: "Availability" },
  { key: "quality", label: "Quality of Work" },
  { key: "collaboration", label: "Collaboration" },
];

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`transition-colors ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
        >
          <Star
            className={`h-5 w-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function Performance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hiredTalents, setHiredTalents] = useState<HiredTalent[]>([]);
  const [loading, setLoading] = useState(true);

  // KPI form
  const [kpiOpen, setKpiOpen] = useState(false);
  const [editKpi, setEditKpi] = useState<KPI | null>(null);
  const [kpiForm, setKpiForm] = useState({
    talentUserId: "",
    title: "",
    description: "",
    targetValue: "",
    currentValue: "",
    unit: "",
    period: "monthly",
    dueDate: "",
  });

  // Review form
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    talentUserId: "",
    reviewPeriod: "",
    overallScore: 0,
    ratings: {} as Record<string, number>,
    notes: "",
    sharedWithTalent: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: cId } = await (supabase.rpc("get_my_client_id" as any) as any);
      if (!cId) return;
      setClientId(cId);

      // Fetch KPIs (join with talent profile)
      const { data: kpiData } = await (supabase
        .from("talent_kpis" as any)
        .select("*, talent:talents(first_name, last_name, email)")
        .eq("client_id", cId)
        .order("created_at", { ascending: false }) as any);
      setKpis(kpiData || []);

      // Fetch Reviews
      const { data: reviewData } = await (supabase
        .from("talent_performance_reviews" as any)
        .select("*, talent:talents(first_name, last_name)")
        .eq("client_id", cId)
        .order("created_at", { ascending: false }) as any);
      setReviews(reviewData || []);

      // Fetch hired talent (active contracts)
      const { data: contractData } = await (supabase
        .from("contracts")
        .select("talents(user_id, first_name, last_name, email)")
        .eq("client_id", cId)
        .eq("status", "active") as any);
      const talents = (contractData || []).map((c: any) => c.talents).filter(Boolean);
      setHiredTalents(talents);

    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── KPI Actions ───────────────────────────────────────────────
  const openAddKpi = () => {
    setEditKpi(null);
    setKpiForm({ talentUserId: "", title: "", description: "", targetValue: "", currentValue: "", unit: "", period: "monthly", dueDate: "" });
    setKpiOpen(true);
  };

  const openEditKpi = (kpi: KPI) => {
    setEditKpi(kpi);
    setKpiForm({
      talentUserId: kpi.talent_user_id,
      title: kpi.title,
      description: kpi.description || "",
      targetValue: String(kpi.target_value ?? ""),
      currentValue: String(kpi.current_value ?? ""),
      unit: kpi.unit || "",
      period: kpi.period,
      dueDate: kpi.due_date || "",
    });
    setKpiOpen(true);
  };

  const saveKpi = async () => {
    if (!kpiForm.title || !kpiForm.talentUserId) {
      toast({ title: "Title and talent are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        client_id: clientId,
        talent_user_id: kpiForm.talentUserId,
        set_by_user_id: user?.id,
        title: kpiForm.title,
        description: kpiForm.description || null,
        target_value: kpiForm.targetValue ? Number(kpiForm.targetValue) : null,
        current_value: kpiForm.currentValue ? Number(kpiForm.currentValue) : null,
        unit: kpiForm.unit || null,
        period: kpiForm.period,
        due_date: kpiForm.dueDate || null,
      };
      if (editKpi) {
        await (supabase.from("talent_kpis" as any).update(payload).eq("id", editKpi.id) as any);
        toast({ title: "KPI updated" });
      } else {
        await (supabase.from("talent_kpis" as any).insert(payload) as any);
        toast({ title: "KPI created" });
      }
      setKpiOpen(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const archiveKpi = async (id: string) => {
    await (supabase.from("talent_kpis" as any).update({ status: "archived" }).eq("id", id) as any);
    toast({ title: "KPI archived" });
    fetchAll();
  };

  // ── Review Actions ────────────────────────────────────────────
  const openReview = () => {
    setReviewForm({ talentUserId: "", reviewPeriod: "", overallScore: 0, ratings: {}, notes: "", sharedWithTalent: false });
    setReviewOpen(true);
  };

  const saveReview = async () => {
    if (!reviewForm.talentUserId || !reviewForm.overallScore) {
      toast({ title: "Please select a talent and overall score", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await (supabase.from("talent_performance_reviews" as any).insert({
        client_id: clientId,
        talent_user_id: reviewForm.talentUserId,
        reviewed_by_user_id: user?.id,
        review_period: reviewForm.reviewPeriod || null,
        overall_score: reviewForm.overallScore,
        ratings: reviewForm.ratings,
        notes: reviewForm.notes || null,
        shared_with_talent: reviewForm.sharedWithTalent,
      }) as any);
      toast({ title: "Review saved" });
      setReviewOpen(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const KpiStatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, string> = {
      active: "bg-green-100 text-green-800 border-green-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      archived: "bg-gray-100 text-gray-600 border-gray-200",
    };
    return <Badge className={`${config[status] || ""} text-xs capitalize`}>{status}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="w-full max-w-none space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Performance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track KPIs and performance reviews for your hired team.</p>
      </div>

      <Tabs defaultValue="kpis">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="kpis" className="rounded-md text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Target className="h-4 w-4 mr-1.5" /> KPIs ({kpis.filter(k => k.status === "active").length})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-md text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Star className="h-4 w-4 mr-1.5" /> Reviews ({reviews.length})
          </TabsTrigger>
        </TabsList>

        {/* ── KPIs Tab ────────────────────────────────────────── */}
        <TabsContent value="kpis" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddKpi} size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> Add KPI
            </Button>
          </div>

          {kpis.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
              <Target className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No KPIs set yet. Add your first KPI to start tracking performance.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {kpis.map((kpi) => {
                const progress = kpi.target_value && kpi.current_value
                  ? Math.min(100, Math.round((kpi.current_value / kpi.target_value) * 100))
                  : null;
                return (
                  <div key={kpi.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{kpi.title}</span>
                          <KpiStatusBadge status={kpi.status} />
                          <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs capitalize">{kpi.period}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                          <User className="h-3 w-3" />
                          {kpi.talent?.first_name} {kpi.talent?.last_name}
                          {kpi.due_date && ` · Due ${format(new Date(kpi.due_date), "MMM d, yyyy")}`}
                        </p>
                        {kpi.description && <p className="text-xs text-gray-500 mb-3">{kpi.description}</p>}
                        {kpi.target_value !== null && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Progress</span>
                              <span>
                                {kpi.current_value ?? 0}{kpi.unit ? ` ${kpi.unit}` : ""} / {kpi.target_value}{kpi.unit ? ` ${kpi.unit}` : ""}
                                {progress !== null && ` (${progress}%)`}
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${progress ?? 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditKpi(kpi)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        {kpi.status === "active" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600" onClick={() => archiveKpi(kpi.id)}>
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Reviews Tab ─────────────────────────────────────── */}
        <TabsContent value="reviews" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={openReview} size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> New Review
            </Button>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No performance reviews yet. Add your first review.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {r.talent?.first_name} {r.talent?.last_name}
                        </span>
                        {r.review_period && (
                          <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs">{r.review_period}</Badge>
                        )}
                        {r.shared_with_talent && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Shared
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{format(new Date(r.created_at), "MMM d, yyyy")}</p>
                      <StarRating value={r.overall_score || 0} />
                      {r.notes && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{r.notes}</p>}
                    </div>
                    <span className="text-2xl font-bold text-gray-800 shrink-0">{r.overall_score}/5</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── KPI Dialog ───────────────────────────────────────── */}
      <Dialog open={kpiOpen} onOpenChange={setKpiOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editKpi ? "Edit KPI" : "Add KPI"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Team Member</Label>
              <Select value={kpiForm.talentUserId} onValueChange={(v) => setKpiForm({ ...kpiForm, talentUserId: v })}>
                <SelectTrigger><SelectValue placeholder="Select talent" /></SelectTrigger>
                <SelectContent>
                  {hiredTalents.map((t) => (
                    <SelectItem key={t.user_id} value={t.user_id}>
                      {t.first_name} {t.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>KPI Title</Label>
              <Input value={kpiForm.title} onChange={(e) => setKpiForm({ ...kpiForm, title: e.target.value })} placeholder="e.g. Complete 50 support tickets" />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea value={kpiForm.description} onChange={(e) => setKpiForm({ ...kpiForm, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Target</Label>
                <Input type="number" value={kpiForm.targetValue} onChange={(e) => setKpiForm({ ...kpiForm, targetValue: e.target.value })} placeholder="50" />
              </div>
              <div className="space-y-1.5">
                <Label>Current</Label>
                <Input type="number" value={kpiForm.currentValue} onChange={(e) => setKpiForm({ ...kpiForm, currentValue: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input value={kpiForm.unit} onChange={(e) => setKpiForm({ ...kpiForm, unit: e.target.value })} placeholder="tickets" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Period</Label>
                <Select value={kpiForm.period} onValueChange={(v) => setKpiForm({ ...kpiForm, period: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={kpiForm.dueDate} onChange={(e) => setKpiForm({ ...kpiForm, dueDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKpiOpen(false)}>Cancel</Button>
            <Button onClick={saveKpi} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editKpi ? "Update KPI" : "Add KPI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Review Dialog ────────────────────────────────────── */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Performance Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Team Member</Label>
              <Select value={reviewForm.talentUserId} onValueChange={(v) => setReviewForm({ ...reviewForm, talentUserId: v })}>
                <SelectTrigger><SelectValue placeholder="Select talent" /></SelectTrigger>
                <SelectContent>
                  {hiredTalents.map((t) => (
                    <SelectItem key={t.user_id} value={t.user_id}>{t.first_name} {t.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Review Period (e.g. "Q2 2026")</Label>
              <Input value={reviewForm.reviewPeriod} onChange={(e) => setReviewForm({ ...reviewForm, reviewPeriod: e.target.value })} placeholder="Q2 2026" />
            </div>
            <div className="space-y-3">
              <Label>Criteria Ratings</Label>
              {REVIEW_CRITERIA.map((c) => (
                <div key={c.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{c.label}</span>
                  <StarRating
                    value={reviewForm.ratings[c.key] || 0}
                    onChange={(v) => setReviewForm({ ...reviewForm, ratings: { ...reviewForm.ratings, [c.key]: v } })}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Overall Score</Label>
              <div className="flex items-center gap-2">
                <StarRating
                  value={reviewForm.overallScore}
                  onChange={(v) => setReviewForm({ ...reviewForm, overallScore: v })}
                />
                <span className="text-sm text-gray-500">{reviewForm.overallScore}/5</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={reviewForm.notes} onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })} rows={3} placeholder="Summary of performance this period…" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="share-review"
                checked={reviewForm.sharedWithTalent}
                onChange={(e) => setReviewForm({ ...reviewForm, sharedWithTalent: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="share-review" className="text-sm cursor-pointer">Share this review with the talent member</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button onClick={saveReview} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
