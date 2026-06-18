import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    X,
    Plus,
    Ticket,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Loader2,
    Globe,
    BookOpen,
    CalendarX2,
    Infinity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Coupon {
    id: string;
    course_id: string | null;
    code: string;
    discount_pct: number;
    max_uses: number | null;
    uses: number;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

interface CourseCouponsModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** If null, the modal operates in "global coupon" mode */
    courseSlug: string | null;
    courseTitle: string;
}

const CourseCouponsModal = ({
    isOpen,
    onClose,
    courseSlug,
    courseTitle,
}: CourseCouponsModalProps) => {
    const { toast } = useToast();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [code, setCode] = useState("");
    const [discountPct, setDiscountPct] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [expiresAt, setExpiresAt] = useState("");

    const isGlobal = courseSlug === null;

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("course_coupons")
                .select("*")
                .order("created_at", { ascending: false });

            if (isGlobal) {
                query = query.is("course_id", null);
            } else {
                query = query.eq("course_id", courseSlug);
            }

            const { data, error } = await query;
            if (error) throw error;
            setCoupons(data || []);
        } catch (err) {
            console.error("Failed to fetch coupons:", err);
            toast({ title: "Error", description: "Failed to load coupons.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [courseSlug, isGlobal, toast]);

    useEffect(() => {
        if (isOpen) {
            fetchCoupons();
            // Reset form on open
            setShowForm(false);
            setCode("");
            setDiscountPct("");
            setMaxUses("");
            setExpiresAt("");
        }
    }, [isOpen, fetchCoupons]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const pct = parseFloat(discountPct);
        if (!code.trim()) {
            toast({ title: "Code required", description: "Please enter a coupon code.", variant: "destructive" });
            return;
        }
        if (isNaN(pct) || pct <= 0 || pct > 100) {
            toast({ title: "Invalid discount", description: "Discount must be between 1 and 100%.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const payload: any = {
                code: code.trim().toUpperCase(),
                discount_pct: pct,
                course_id: isGlobal ? null : courseSlug,
                max_uses: maxUses ? parseInt(maxUses) : null,
                expires_at: expiresAt || null,
            };

            const { error } = await supabase.from("course_coupons").insert(payload);
            if (error) throw error;

            toast({ title: "Coupon created!", description: `Code "${payload.code}" is now active.` });
            setCode("");
            setDiscountPct("");
            setMaxUses("");
            setExpiresAt("");
            setShowForm(false);
            fetchCoupons();
        } catch (err: any) {
            const isDuplicate = err?.message?.includes("duplicate") || err?.message?.includes("unique");
            toast({
                title: isDuplicate ? "Duplicate code" : "Error",
                description: isDuplicate
                    ? "This code already exists for this course. Please use a different code."
                    : err.message || "Failed to create coupon.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, couponCode: string) => {
        if (!confirm(`Delete coupon "${couponCode}"? This cannot be undone.`)) return;
        setDeletingId(id);
        try {
            const { error } = await supabase.from("course_coupons").delete().eq("id", id);
            if (error) throw error;
            toast({ title: "Deleted", description: `Coupon "${couponCode}" removed.` });
            fetchCoupons();
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to delete.", variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggle = async (coupon: Coupon) => {
        setTogglingId(coupon.id);
        try {
            const { error } = await supabase
                .from("course_coupons")
                .update({ is_active: !coupon.is_active })
                .eq("id", coupon.id);
            if (error) throw error;
            toast({
                title: coupon.is_active ? "Deactivated" : "Activated",
                description: `Coupon "${coupon.code}" is now ${coupon.is_active ? "inactive" : "active"}.`,
            });
            fetchCoupons();
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to update.", variant: "destructive" });
        } finally {
            setTogglingId(null);
        }
    };

    const formatExpiry = (expiresAt: string | null) => {
        if (!expiresAt) return null;
        return new Date(expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
                                <Ticket className="w-4.5 h-4.5 text-violet-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-slate-800">
                                    {isGlobal ? "Global Coupons" : "Course Coupons"}
                                </h2>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    {isGlobal ? (
                                        <><Globe className="w-3 h-3" /> Works across all courses</>
                                    ) : (
                                        <><BookOpen className="w-3 h-3" /> {courseTitle}</>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Create Coupon Form */}
                        <div className="px-6 py-4 border-b border-slate-50">
                            {!showForm ? (
                                <Button
                                    onClick={() => setShowForm(true)}
                                    className="w-full h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-xs gap-2 shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Create New Coupon
                                </Button>
                            ) : (
                                <motion.form
                                    onSubmit={handleCreate}
                                    className="bg-slate-50/60 rounded-xl border border-slate-200/60 p-4 space-y-3"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                >
                                    <p className="text-xs font-semibold text-slate-600">New Coupon</p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                Coupon Code *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. LAUNCH50"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                                className="w-full h-9 px-3 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-xs font-mono text-slate-800 uppercase placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 tracking-wider"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                Discount % *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    max="100"
                                                    step="0.01"
                                                    placeholder="e.g. 20"
                                                    value={discountPct}
                                                    onChange={(e) => setDiscountPct(e.target.value)}
                                                    className="w-full h-9 px-3 pr-7 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-xs text-slate-800 placeholder:text-slate-400"
                                                />
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                Max Uses <span className="normal-case text-slate-300">(blank = unlimited)</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Unlimited"
                                                value={maxUses}
                                                onChange={(e) => setMaxUses(e.target.value)}
                                                className="w-full h-9 px-3 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-xs text-slate-800 placeholder:text-slate-400"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                Expires <span className="normal-case text-slate-300">(blank = never)</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={expiresAt}
                                                onChange={(e) => setExpiresAt(e.target.value)}
                                                min={new Date().toISOString().split("T")[0]}
                                                className="w-full h-9 px-3 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 text-xs text-slate-800"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 h-9 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold gap-1.5 shadow-sm"
                                        >
                                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                            {saving ? "Creating..." : "Create Coupon"}
                                        </Button>
                                    </div>
                                </motion.form>
                            )}
                        </div>

                        {/* Coupons List */}
                        <div className="px-6 py-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                                </div>
                            ) : coupons.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                        <Ticket className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">No coupons yet</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Create your first coupon above.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                        {coupons.length} Coupon{coupons.length !== 1 ? "s" : ""}
                                    </p>
                                    {coupons.map((coupon) => {
                                        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                                        const isMaxedOut = coupon.max_uses !== null && coupon.uses >= coupon.max_uses;
                                        const effectivelyInactive = !coupon.is_active || isExpired || isMaxedOut;

                                        return (
                                            <div
                                                key={coupon.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                    effectivelyInactive
                                                        ? "bg-slate-50/50 border-slate-100 opacity-60"
                                                        : "bg-white border-slate-200/60 shadow-sm"
                                                }`}
                                            >
                                                {/* Code badge */}
                                                <div className="shrink-0">
                                                    <span className="font-mono text-xs font-bold tracking-wider text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-lg">
                                                        {coupon.code}
                                                    </span>
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold text-slate-800">
                                                            {coupon.discount_pct}% off
                                                        </span>
                                                        {/* Status pill */}
                                                        {isExpired ? (
                                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded-full">
                                                                Expired
                                                            </span>
                                                        ) : isMaxedOut ? (
                                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full">
                                                                Limit reached
                                                            </span>
                                                        ) : coupon.is_active ? (
                                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-full">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                                        <span>{coupon.uses}{coupon.max_uses !== null ? `/${coupon.max_uses}` : ""} uses</span>
                                                        {coupon.max_uses === null && (
                                                            <span className="flex items-center gap-0.5"><Infinity className="w-3 h-3" /> unlimited</span>
                                                        )}
                                                        {coupon.expires_at && (
                                                            <span className="flex items-center gap-0.5">
                                                                <CalendarX2 className="w-3 h-3" />
                                                                {formatExpiry(coupon.expires_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {/* Toggle active */}
                                                    <button
                                                        onClick={() => handleToggle(coupon)}
                                                        disabled={togglingId === coupon.id}
                                                        title={coupon.is_active ? "Deactivate" : "Activate"}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                                    >
                                                        {togglingId === coupon.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : coupon.is_active ? (
                                                            <ToggleRight className="w-4 h-4 text-violet-500" />
                                                        ) : (
                                                            <ToggleLeft className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(coupon.id, coupon.code)}
                                                        disabled={deletingId === coupon.id}
                                                        title="Delete coupon"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                    >
                                                        {deletingId === coupon.id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CourseCouponsModal;
