import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
    X, 
    Plus, 
    Trash2, 
    Save, 
    Loader2, 
    Layout, 
    Clock, 
    Layers, 
    Award, 
    Wrench,
    CheckCircle2,
    Laptop,
    Users,
    MessageSquare,
    Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface CreateCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editCourse?: any;
}

const CreateCourseModal = ({ isOpen, onClose, onSuccess, editCourse }: CreateCourseModalProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        tagline: "",
        description: "",
        price_naira: 0,
        price_usd: 0,
        level: "Beginner",
        category: "Operations",
        is_live: true,
        is_flagship: false,
        duration: "4 Weeks",
        image_url: "",
        // JSONB fields
        learning_outcomes: [] as string[],
        tools: [] as string[],
        curriculum: [] as { week: string, title: string, details: string[] }[],
        who_this_is_for: [] as string[],
        what_you_will_learn: [] as string[],
        cohort_slots: 50,
        slots_filled: 0,
        next_cohort_date: "",
        bonus_description: "",
        testimonials: [] as { name: string; country: string; flag: string; before: string; after: string; income: string; quote: string; image: string }[]
    });

    useEffect(() => {
        if (editCourse) {
            setFormData({
                ...formData,
                ...editCourse,
                learning_outcomes: editCourse.learning_outcomes || [],
                bonus_description: editCourse.bonus_description || "",
                tools: editCourse.tools || [],
                curriculum: (editCourse.curriculum || []).map((item: any) => ({
                    ...item,
                    week: item.week || '',
                    title: item.title || '',
                    details: Array.isArray(item.details) ? item.details : [],
                })),
                who_this_is_for: editCourse.who_is_it_for || [],
                what_you_will_learn: editCourse.what_youll_learn || [],
                cohort_slots: editCourse.slots_total || 50,
                slots_filled: editCourse.slots_filled || 0,
                next_cohort_date: editCourse.next_cohort_date || "",
                testimonials: editCourse.testimonials || [],
            });
        }
    }, [editCourse]);

    const handleAddItem = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...(prev[field] as any[]), value]
        }));
    };

    const handleRemoveItem = (field: keyof typeof formData, index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: (prev[field] as any[]).filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { cohort_slots, slots_filled, next_cohort_date, who_this_is_for, what_you_will_learn, testimonials, ...rest } = formData;
            
            // Remove the raw datastore keys injected during state setup for edits to avoid PGRST duplication errors
            if ('slots_total' in rest) delete (rest as any).slots_total;
            if ('who_is_it_for' in rest) delete (rest as any).who_is_it_for;
            if ('what_youll_learn' in rest) delete (rest as any).what_youll_learn;
            if ('slots_filled' in rest) delete (rest as any).slots_filled;
            if ('next_cohort_date' in rest) delete (rest as any).next_cohort_date;
            if ('testimonials' in rest) delete (rest as any).testimonials;

            const courseData: Record<string, any> = {
                title: rest.title,
                slug: rest.slug,
                tagline: rest.tagline,
                description: rest.description,
                price_naira: rest.price_naira,
                price_usd: rest.price_usd,
                level: rest.level,
                is_live: rest.is_live,
                duration: rest.duration,
                image_url: rest.image_url,
                learning_outcomes: rest.learning_outcomes,
                tools: rest.tools,
                curriculum: rest.curriculum,
                bonus_description: rest.bonus_description,
                slots_total: cohort_slots,
                slots_filled: slots_filled,
                next_cohort_date: next_cohort_date || null,
                who_is_it_for: who_this_is_for,
                what_youll_learn: what_you_will_learn,
                testimonials: testimonials,
                updated_at: new Date().toISOString()
            };

            // Only include columns that exist in the schema
            // is_flagship and category may exist via academy_hub_core migration
            if (rest.is_flagship !== undefined) courseData.is_flagship = rest.is_flagship;
            if (rest.category !== undefined) courseData.category = rest.category;

            let error;
            if (editCourse) {
                const { error: err } = await (supabase
                    .from("academy_courses") as any)
                    .update(courseData)
                    .eq("id", editCourse.id);
                error = err;
            } else {
                const { error: err } = await (supabase
                    .from("academy_courses") as any)
                    .insert([courseData]);
                error = err;
            }

            if (error) {
                if (error.code === '23505' && error.message?.includes('slug')) {
                    throw new Error(`A course with the slug "${courseData.slug}" already exists. Please use a different slug.`);
                }
                throw error;
            }

            toast({
                title: editCourse ? "Course Updated" : "Course Created",
                description: `Successfully ${editCourse ? 'updated' : 'created'} ${formData.title}`,
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Save error:", err);
            toast({
                title: "Error",
                description: (err as Error).message || "Failed to save course.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-5 py-3.5 border-b-2 font-bold text-[10px] uppercase tracking-wider transition-all ${
                activeTab === id 
                    ? "border-blue-600 text-blue-600 bg-blue-50/20" 
                    : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
            }`}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-12">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/60"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                            {editCourse ? "Edit Course" : "Create New Program"}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Configure rich metadata and learning structure.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar shrink-0">
                    <TabButton id="basic" label="Basic Info" icon={Layout} />
                    <TabButton id="pricing" label="Pricing & Status" icon={Clock} />
                    <TabButton id="content" label="Rich Content" icon={Layers} />
                    <TabButton id="audience" label="Audience & Details" icon={Users} />
                    <TabButton id="curriculum" label="Curriculum" icon={Award} />
                    <TabButton id="testimonials" label="Testimonials" icon={MessageSquare} />
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === "basic" && (
                            <motion.div 
                                key="basic"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5 max-w-3xl"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Course Title</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs"
                                            value={formData.title}
                                            onChange={e => {
                                                const title = e.target.value;
                                                const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                                setFormData({ ...formData, title, slug: editCourse ? formData.slug : autoSlug });
                                            }}
                                            placeholder="e.g. AI Operations Masterclass"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">URL Slug</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs"
                                            value={formData.slug}
                                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                            placeholder="e.g. ai-operations"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tagline (Hero Text)</label>
                                    <input 
                                        type="text" 
                                        className="w-full h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs"
                                        value={formData.tagline}
                                        onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                                        placeholder="Brief, punchy description for the hero section"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                                    <textarea 
                                        className="w-full h-24 p-3 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Full program overview..."
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Level</label>
                                        <select 
                                            className="w-full h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs appearance-none"
                                            value={formData.level}
                                            onChange={e => setFormData({ ...formData, level: e.target.value })}
                                        >
                                            <option>Beginner</option>
                                            <option>Intermediate</option>
                                            <option>Expert</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "pricing" && (
                            <motion.div 
                                key="pricing"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 max-w-3xl"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price (NGN)</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs"
                                            value={formData.price_naira}
                                            onChange={e => setFormData({ ...formData, price_naira: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price (USD)</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs"
                                            value={formData.price_usd}
                                            onChange={e => setFormData({ ...formData, price_usd: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50/40 rounded-xl border border-slate-200/60 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">Program Status</h4>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">Control visibility and flagship status.</p>
                                    </div>
                                    <div className="flex gap-2.5">
                                        <button 
                                            onClick={() => setFormData({ ...formData, is_live: !formData.is_live })}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                                                formData.is_live ? "bg-emerald-50 text-emerald-700 border border-emerald-100/30" : "bg-slate-200/60 text-slate-500"
                                            }`}
                                        >
                                            {formData.is_live ? "Live Catalog" : "Draft"}
                                        </button>
                                        <button 
                                            onClick={() => setFormData({ ...formData, is_flagship: !formData.is_flagship })}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                                                formData.is_flagship ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-400"
                                            }`}
                                        >
                                            Flagship
                                        </button>
                                    </div>
                                </div>

                                {/* Next Cohort & Slots Filled */}
                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Next Cohort Date</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs"
                                            value={formData.next_cohort_date}
                                            onChange={e => setFormData({ ...formData, next_cohort_date: e.target.value })}
                                            placeholder="e.g. May 5, 2026"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Slots Filled</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs"
                                            value={formData.slots_filled}
                                            onChange={e => setFormData({ ...formData, slots_filled: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "content" && (
                            <motion.div 
                                key="content"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8 max-w-4xl"
                            >
                                {/* Learning Outcomes */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-l-4 border-blue-600 pl-3">Learning Outcomes</label>
                                        <Button variant="ghost" size="sm" onClick={() => handleAddItem('learning_outcomes', '')} className="text-blue-600 hover:bg-blue-50/60 gap-1 text-xs h-8">
                                            <Plus className="w-3.5 h-3.5" /> Add Outcome
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {formData.learning_outcomes.map((item, i) => (
                                            <div key={i} className="flex gap-2.5">
                                                <input 
                                                    type="text" 
                                                    className="flex-grow h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg font-medium text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
                                                    value={item}
                                                    onChange={e => {
                                                        const newOutcomes = [...formData.learning_outcomes];
                                                        newOutcomes[i] = e.target.value;
                                                        setFormData({ ...formData, learning_outcomes: newOutcomes });
                                                    }}
                                                />
                                                <button onClick={() => handleRemoveItem('learning_outcomes', i)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tools Mastered */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-l-4 border-emerald-500 pl-3">Tools Mastered</label>
                                        <Button variant="ghost" size="sm" onClick={() => handleAddItem('tools', '')} className="text-emerald-600 hover:bg-emerald-50/60 gap-1 text-xs h-8">
                                            <Wrench className="w-3.5 h-3.5" /> Add Tool
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {formData.tools.map((item, i) => (
                                            <div key={i} className="flex items-center gap-1.5 bg-slate-50/50 border border-slate-200 pl-3 pr-1 py-1 rounded-lg group transition-all hover:bg-slate-100">
                                                <input 
                                                    type="text" 
                                                    className="bg-transparent border-none font-bold text-xs p-0 w-24 focus:ring-0"
                                                    value={item}
                                                    onChange={e => {
                                                        const newItems = [...formData.tools];
                                                        newItems[i] = e.target.value;
                                                        setFormData({ ...formData, tools: newItems });
                                                    }}
                                                />
                                                <button onClick={() => handleRemoveItem('tools', i)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "audience" && (
                            <motion.div 
                                key="audience"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8 max-w-4xl"
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-l-4 border-indigo-500 pl-3">What You'll Learn</label>
                                            <Button variant="ghost" size="sm" onClick={() => handleAddItem('what_you_will_learn', '')} className="text-indigo-600 hover:bg-indigo-50 gap-1 p-1 h-7 text-xs">
                                                <Plus className="w-3.5 h-3.5" /> Add
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {formData.what_you_will_learn.map((item, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        className="flex-grow h-10 px-3.5 bg-slate-50/50 rounded-lg font-medium text-xs border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
                                                        value={item}
                                                        onChange={e => {
                                                            const newItems = [...formData.what_you_will_learn];
                                                            newItems[i] = e.target.value;
                                                            setFormData({ ...formData, what_you_will_learn: newItems });
                                                        }}
                                                    />
                                                    <button onClick={() => handleRemoveItem('what_you_will_learn', i)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-l-4 border-purple-500 pl-3">Who This Is For</label>
                                            <Button variant="ghost" size="sm" onClick={() => handleAddItem('who_this_is_for', '')} className="text-purple-600 hover:bg-purple-50 gap-1 p-1 h-7 text-xs">
                                                <Plus className="w-3.5 h-3.5" /> Add
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {formData.who_this_is_for.map((item, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        className="flex-grow h-10 px-3.5 bg-slate-50/50 rounded-lg font-medium text-xs border border-slate-200 focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
                                                        value={item}
                                                        onChange={e => {
                                                            const newItems = [...formData.who_this_is_for];
                                                            newItems[i] = e.target.value;
                                                            setFormData({ ...formData, who_this_is_for: newItems });
                                                        }}
                                                    />
                                                    <button onClick={() => handleRemoveItem('who_this_is_for', i)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cohort Slots Maximum</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs"
                                            value={formData.cohort_slots}
                                            onChange={e => setFormData({ ...formData, cohort_slots: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bonus Content Summary</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-10 px-3.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium text-xs"
                                            value={formData.bonus_description}
                                            onChange={e => setFormData({ ...formData, bonus_description: e.target.value })}
                                            placeholder="e.g. 1-on-1 Career Coaching session"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "curriculum" && (
                            <motion.div 
                                key="curriculum"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 max-w-4xl"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-slate-800">Weekly Breakdown</h3>
                                    <Button onClick={() => handleAddItem('curriculum', { week: `Week ${formData.curriculum.length + 1}`, title: "", details: [] })} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs h-9 gap-1.5">
                                        <Plus className="w-3.5 h-3.5" /> Add Week
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {formData.curriculum.map((item, i) => (
                                        <div key={i} className="p-5 bg-slate-50/40 rounded-xl border border-slate-200/60 space-y-4 relative group">
                                            <button 
                                                onClick={() => handleRemoveItem('curriculum', i)}
                                                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            
                                            <div className="grid grid-cols-4 gap-4 pr-6">
                                                <input 
                                                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg font-bold text-[10px] uppercase tracking-wider text-blue-600 focus:ring-1 focus:ring-blue-600"
                                                    value={item.week || ''}
                                                    onChange={e => {
                                                        const newCur = [...formData.curriculum];
                                                        newCur[i] = { ...newCur[i], week: e.target.value };
                                                        setFormData({ ...formData, curriculum: newCur });
                                                    }}
                                                />
                                                <input 
                                                    className="col-span-3 h-10 px-3 bg-white border border-slate-200 rounded-lg font-bold text-xs text-slate-900 focus:ring-1 focus:ring-blue-600"
                                                    placeholder="Focus Title (e.g. AI Workflow Fundamentals)"
                                                    value={item.title || ''}
                                                    onChange={e => {
                                                        const newCur = [...formData.curriculum];
                                                        newCur[i] = { ...newCur[i], title: e.target.value };
                                                        setFormData({ ...formData, curriculum: newCur });
                                                    }}
                                                />
                                            </div>
                                            
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Key Topics</label>
                                                <textarea 
                                                    className="w-full h-20 p-3 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 transition-all font-medium text-xs resize-none"
                                                    placeholder="Topic 1, Topic 2, Topic 3 (comma separated)"
                                                    value={Array.isArray(item.details) ? item.details.join(", ") : (item.details || '')}
                                                    onChange={e => {
                                                        const newCur = [...formData.curriculum];
                                                        newCur[i] = { ...newCur[i], details: e.target.value.split(",").map(t => t.trim()) };
                                                        setFormData({ ...formData, curriculum: newCur });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        {activeTab === "testimonials" && (
                            <motion.div 
                                key="testimonials"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6 max-w-4xl"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-800">Graduate Testimonials</h3>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Stored as JSONB success stories displayed on public catalog.</p>
                                    </div>
                                    <Button 
                                        onClick={() => handleAddItem('testimonials', { name: '', country: '', flag: '🇳🇬', before: '', after: '', income: '', quote: '', image: '' })}
                                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs h-9 gap-1.5"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Testimonial
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {formData.testimonials.map((t, i) => (
                                        <div key={i} className="p-5 bg-slate-50/40 rounded-xl border border-slate-200/60 space-y-4 relative group">
                                            <button 
                                                onClick={() => handleRemoveItem('testimonials', i)}
                                                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            
                                            <div className="flex items-center gap-2 mb-1">
                                                <Star className="w-4 h-4 text-amber-400" />
                                                <span className="text-xs font-bold text-slate-800">Testimonial #{i + 1}</span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Name</label>
                                                    <input className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg font-medium text-xs focus:ring-1 focus:ring-blue-600" value={t.name} onChange={e => { const n = [...formData.testimonials]; n[i] = { ...n[i], name: e.target.value }; setFormData({ ...formData, testimonials: n }); }} placeholder="Amara Osei" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Country</label>
                                                    <input className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg font-medium text-xs focus:ring-1 focus:ring-blue-600" value={t.country} onChange={e => { const n = [...formData.testimonials]; n[i] = { ...n[i], country: e.target.value }; setFormData({ ...formData, testimonials: n }); }} placeholder="Nigeria" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Flag Emoji</label>
                                                    <input className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg font-medium text-xs focus:ring-1 focus:ring-blue-600" value={t.flag} onChange={e => { const n = [...formData.testimonials]; n[i] = { ...n[i], flag: e.target.value }; setFormData({ ...formData, testimonials: n }); }} placeholder="🇳🇬" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Before (Role)</label>
                                                    <input className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg font-medium text-xs focus:ring-1 focus:ring-blue-600" value={t.before} onChange={e => { const n = [...formData.testimonials]; n[i] = { ...n[i], before: e.target.value }; setFormData({ ...formData, testimonials: n }); }} placeholder="Customer Service Agent" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">After (Role)</label>
                                                    <input className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg font-medium text-xs focus:ring-1 focus:ring-blue-600" value={t.after} onChange={e => { const n = [...formData.testimonials]; n[i] = { ...n[i], after: e.target.value }; setFormData({ ...formData, testimonials: n }); }} placeholder="AI Operations Specialist" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Income After</label>
                                                    <input className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg font-medium text-xs focus:ring-1 focus:ring-blue-600" value={t.income} onChange={e => { const n = [...formData.testimonials]; n[i] = { ...n[i], income: e.target.value }; setFormData({ ...formData, testimonials: n }); }} placeholder="$2,800/mo" />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Quote</label>
                                                <textarea className="w-full h-16 p-3 bg-white border border-slate-200 rounded-lg font-medium text-xs resize-none focus:ring-1 focus:ring-blue-600" value={t.quote} onChange={e => { const n = [...formData.testimonials]; n[i] = { ...n[i], quote: e.target.value }; setFormData({ ...formData, testimonials: n }); }} placeholder="Their success story..." />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Photo URL</label>
                                                <input className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg font-medium text-xs focus:ring-1 focus:ring-blue-600" value={t.image} onChange={e => { const n = [...formData.testimonials]; n[i] = { ...n[i], image: e.target.value }; setFormData({ ...formData, testimonials: n }); }} placeholder="https://images.unsplash.com/..." />
                                            </div>
                                        </div>
                                    ))}

                                    {formData.testimonials.length === 0 && (
                                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                                            <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                            <p className="text-slate-400 font-bold text-xs">No testimonials yet</p>
                                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Add graduate success stories to display on the course page.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 opacity-40">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                            <Laptop className="w-3.5 h-3.5" /> Desktop Optimized
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                            <Users className="w-3.5 h-3.5" /> {formData.cohort_slots} Slots Max
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} className="h-9 px-4 rounded-xl font-bold text-slate-500 text-xs">Cancel</Button>
                        <Button 
                            onClick={handleSave}
                            disabled={loading || !formData.title || !formData.slug}
                            className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold gap-2 text-xs shadow-xs transition-all"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-3.5 h-3.5" /> Save Course Details</>}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateCourseModal;
