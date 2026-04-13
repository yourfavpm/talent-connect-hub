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
    Users
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
        bonus_content: ""
    });

    useEffect(() => {
        if (editCourse) {
            setFormData({
                ...formData,
                ...editCourse,
                learning_outcomes: editCourse.learning_outcomes || [],
                tools: editCourse.tools || [],
                curriculum: editCourse.curriculum || [],
                who_this_is_for: editCourse.who_this_is_for || [],
                what_you_will_learn: editCourse.what_you_will_learn || [],
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
            const courseData = {
                ...formData,
                updated_at: new Date().toISOString()
            };

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

            if (error) throw error;

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
                description: "Failed to save course. Check slug uniqueness.",
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
            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-xs uppercase tracking-widest transition-all ${
                activeTab === id 
                    ? "border-blue-600 text-blue-600 bg-blue-50/30" 
                    : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
        >
            <Icon className="w-4 h-4" />
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
                className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {editCourse ? "Edit Course" : "Create New Program"}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Configure rich metadata and learning structure.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar shrink-0">
                    <TabButton id="basic" label="Basic Info" icon={Layout} />
                    <TabButton id="pricing" label="Pricing & Status" icon={Clock} />
                    <TabButton id="content" label="Rich Content" icon={Layers} />
                    <TabButton id="curriculum" label="Curriculum" icon={Award} />
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === "basic" && (
                            <motion.div 
                                key="basic"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8 max-w-3xl"
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Course Title</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g. AI Operations Masterclass"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">URL Slug</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                            value={formData.slug}
                                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                            placeholder="e.g. ai-operations"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Tagline (Hero Text)</label>
                                    <input 
                                        type="text" 
                                        className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.tagline}
                                        onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                                        placeholder="Brief, punchy description for the hero section"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Description</label>
                                    <textarea 
                                        className="w-full h-32 p-5 bg-slate-50 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Full program overview..."
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Level</label>
                                        <select 
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium appearance-none"
                                            value={formData.level}
                                            onChange={e => setFormData({ ...formData, level: e.target.value })}
                                        >
                                            <option>Beginner</option>
                                            <option>Intermediate</option>
                                            <option>Expert</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Category</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Duration</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
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
                                className="space-y-8 max-w-3xl"
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Price (NGN)</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                            value={formData.price_naira}
                                            onChange={e => setFormData({ ...formData, price_naira: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Price (USD)</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-12 px-5 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                            value={formData.price_usd}
                                            onChange={e => setFormData({ ...formData, price_usd: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-900">Program Status</h4>
                                        <p className="text-xs text-slate-500 font-medium">Control visibility and flagship status.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => setFormData({ ...formData, is_live: !formData.is_live })}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                formData.is_live ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                                            }`}
                                        >
                                            {formData.is_live ? "Live Catalog" : "Draft"}
                                        </button>
                                        <button 
                                            onClick={() => setFormData({ ...formData, is_flagship: !formData.is_flagship })}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                formData.is_flagship ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 text-slate-400"
                                            }`}
                                        >
                                            Flagship
                                        </button>
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
                                className="space-y-12 max-w-4xl"
                            >
                                {/* Learning Outcomes */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest border-l-4 border-blue-600 pl-4">Learning Outcomes</label>
                                        <Button variant="ghost" size="sm" onClick={() => handleAddItem('learning_outcomes', '')} className="text-blue-600 hover:bg-blue-50 gap-1">
                                            <Plus className="w-4 h-4" /> Add Outcome
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {formData.learning_outcomes.map((item, i) => (
                                            <div key={i} className="flex gap-3">
                                                <input 
                                                    type="text" 
                                                    className="flex-grow h-12 px-5 bg-slate-50 rounded-xl font-medium text-sm"
                                                    value={item}
                                                    onChange={e => {
                                                        const newOutcomes = [...formData.learning_outcomes];
                                                        newOutcomes[i] = e.target.value;
                                                        setFormData({ ...formData, learning_outcomes: newOutcomes });
                                                    }}
                                                />
                                                <button onClick={() => handleRemoveItem('learning_outcomes', i)} className="p-3 text-slate-300 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tools Mastered */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-4">Tools Mastered</label>
                                        <Button variant="ghost" size="sm" onClick={() => handleAddItem('tools', '')} className="text-emerald-600 hover:bg-emerald-50 gap-1">
                                            <Wrench className="w-4 h-4" /> Add Tool
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {formData.tools.map((item, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-slate-50 pl-4 pr-1 py-1 rounded-xl group transition-all hover:bg-slate-100">
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
                                                <button onClick={() => handleRemoveItem('tools', i)} className="p-2 text-slate-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                                            </div>
                                        ))}
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
                                className="space-y-8 max-w-4xl"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-bold text-slate-900">Weekly Breakdown</h3>
                                    <Button onClick={() => handleAddItem('curriculum', { week: `Week ${formData.curriculum.length + 1}`, title: "", details: [] })} className="bg-slate-900 text-white rounded-xl gap-2">
                                        <Plus className="w-4 h-4" /> Add Week
                                    </Button>
                                </div>

                                <div className="space-y-6">
                                    {formData.curriculum.map((item, i) => (
                                        <div key={i} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6 relative group">
                                            <button 
                                                onClick={() => handleRemoveItem('curriculum', i)}
                                                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            
                                            <div className="grid grid-cols-4 gap-6">
                                                <input 
                                                    className="h-12 px-5 bg-white rounded-xl font-bold text-xs uppercase tracking-widest text-blue-600"
                                                    value={item.week}
                                                    onChange={e => {
                                                        const newCur = [...formData.curriculum];
                                                        newCur[i].week = e.target.value;
                                                        setFormData({ ...formData, curriculum: newCur });
                                                    }}
                                                />
                                                <input 
                                                    className="col-span-3 h-12 px-5 bg-white rounded-xl font-bold text-slate-900"
                                                    placeholder="Focus Title (e.g. AI Workflow Fundamentals)"
                                                    value={item.title}
                                                    onChange={e => {
                                                        const newCur = [...formData.curriculum];
                                                        newCur[i].title = e.target.value;
                                                        setFormData({ ...formData, curriculum: newCur });
                                                    }}
                                                />
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Topics</label>
                                                <textarea 
                                                    className="w-full h-24 p-5 bg-white rounded-2xl border-transparent focus:ring-2 focus:ring-blue-600 transition-all font-medium text-sm resize-none"
                                                    placeholder="Topic 1, Topic 2, Topic 3 (comma separated)"
                                                    value={item.details.join(", ")}
                                                    onChange={e => {
                                                        const newCur = [...formData.curriculum];
                                                        newCur[i].details = e.target.value.split(",").map(t => t.trim());
                                                        setFormData({ ...formData, curriculum: newCur });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6 opacity-40">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                            <Laptop className="w-4 h-4" /> Desktop Optimized
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                            <Users className="w-4 h-4" /> {formData.cohort_slots} Slots Max
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={onClose} className="h-12 px-8 rounded-xl font-bold text-slate-500">Cancel</Button>
                        <Button 
                            onClick={handleSave}
                            disabled={loading || !formData.title || !formData.slug}
                            className="h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold gap-2 shadow-xl shadow-blue-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Save Course Details</>}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateCourseModal;
