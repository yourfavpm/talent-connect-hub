import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    FileText,
    Plus,
    Edit,
    Archive,
    Copy,
    Star,
    Eye,
    Search,
    Filter,
    ExternalLink,
    ChevronRight,
    History,
    AlertCircle,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgreementTemplate {
    id: string;
    user_type: 'client' | 'talent';
    service_model: 'direct_hire' | 'trial_to_hire' | 'contract_talent';
    clause_name: string;
    clause_body: string;
    version_number: number;
    status: 'active' | 'archived';
    is_default: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
}

const SERVICE_MODELS = [
    { value: 'direct_hire', label: 'Full Time Hire' },
    { value: 'trial_to_hire', label: 'Trial-to-Hire' },
    { value: 'contract_talent', label: 'Contract Talent' }
];

const USER_TYPES = [
    { value: 'client', label: 'Client' },
    { value: 'talent', label: 'Talent' }
];

const TEMPLATE_VARIABLES = [
    "talentName", "clientCompany", "jobTitle", "startDate", "talentRate", 
    "clientRate", "expectedWeeklyHours", "billingFrequency", "compensationType",
    "duration", "workingArrangement", "overtimeClause", "timeTrackingRequired",
    "talentId", "placementFee", "billingDay", "paymentFrequency", "payday"
];

const AgreementTemplates = () => {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<AgreementTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterUserType, setFilterUserType] = useState<string>("all");
    const [filterServiceModel, setFilterServiceModel] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("active");

    // Drawer states
    const [editorOpen, setEditorOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<AgreementTemplate | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        user_type: 'client' as 'client' | 'talent',
        service_model: 'trial_to_hire' as 'direct_hire' | 'trial_to_hire' | 'contract_talent',
        clause_name: '',
        clause_body: '',
        is_default: false,
    });

    useEffect(() => {
        fetchTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('agreement_templates')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            user_type: 'client',
            service_model: 'trial_to_hire',
            clause_name: '',
            clause_body: '',
            is_default: false,
        });
        setIsDuplicating(false);
    };

    const handleCreateOrDuplicate = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Find max version for this combination
            const { data: existing } = await supabase
                .from('agreement_templates')
                .select('version_number')
                .eq('user_type', formData.user_type)
                .eq('service_model', formData.service_model)
                .order('version_number', { ascending: false })
                .limit(1);

            const nextVersion = existing && existing.length > 0 ? existing[0].version_number + 1 : 1;

            const { error } = await supabase.from('agreement_templates').insert({
                ...formData,
                version_number: nextVersion,
                created_by: user?.id,
            });

            if (error) throw error;

            toast({ title: "Success", description: `Template ${isDuplicating ? 'duplicated' : 'created'} successfully` });
            setEditorOpen(false);
            resetForm();
            fetchTemplates();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const handleUpdate = async () => {
        if (!selectedTemplate) return;

        try {
            const { error } = await supabase
                .from('agreement_templates')
                .update({
                    clause_name: formData.clause_name,
                    clause_body: formData.clause_body,
                    is_default: formData.is_default,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', selectedTemplate.id);

            if (error) throw error;

            toast({ title: "Success", description: "Agreement template updated successfully" });
            setEditorOpen(false);
            setSelectedTemplate(null);
            resetForm();
            fetchTemplates();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const handleSetAsDefault = async (template: AgreementTemplate) => {
        const confirmMsg = `This will replace the current default for ${getServiceModelLabel(template.service_model)} ${getUserTypeLabel(template.user_type)} agreements. Continue?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            // Supabase unique index idx_one_default_per_combination handles resetting others
            const { error } = await supabase
                .from('agreement_templates')
                .update({ is_default: true, updated_at: new Date().toISOString() })
                .eq('id', template.id);

            if (error) throw error;
            toast({ title: "Success", description: "Template set as default" });
            fetchTemplates();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const toggleStatus = async (template: AgreementTemplate) => {
        const newStatus = template.status === 'active' ? 'archived' : 'active';
        if (newStatus === 'archived' && template.is_default) {
            toast({ title: "Action blocked", description: "Cannot deactivate a default template. Set another as default first.", variant: "destructive" });
            return;
        }

        try {
            const { error } = await supabase
                .from('agreement_templates')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', template.id);

            if (error) throw error;
            toast({ title: "Success", description: `Template ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
            fetchTemplates();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };

    const insertVariable = (variable: string) => {
        const textarea = document.getElementById('clause-body-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.clause_body;
        const before = text.substring(0, start);
        const after = text.substring(end);
        
        const newText = `${before}{{${variable}}}${after}`;
        setFormData({ ...formData, clause_body: newText });

        // Set cursor position after insertion
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
        }, 0);
    };

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            const matchesSearch = t.clause_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesUserType = filterUserType === 'all' || t.user_type === filterUserType;
            const matchesServiceModel = filterServiceModel === 'all' || t.service_model === filterServiceModel;
            const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
            return matchesSearch && matchesUserType && matchesServiceModel && matchesStatus;
        });
    }, [templates, searchQuery, filterUserType, filterServiceModel, filterStatus]);

    const groupedTemplates = useMemo(() => {
        const groups: Record<string, Record<string, AgreementTemplate[]>> = {};
        
        SERVICE_MODELS.forEach(sm => {
            groups[sm.value] = {
                client: filteredTemplates.filter(t => t.service_model === sm.value && t.user_type === 'client'),
                talent: filteredTemplates.filter(t => t.service_model === sm.value && t.user_type === 'talent')
            };
        });
        
        return groups;
    }, [filteredTemplates]);

    const getServiceModelLabel = (model: string) => {
        return SERVICE_MODELS.find(sm => sm.value === model)?.label || model;
    };

    const getUserTypeLabel = (type: string) => {
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const AgreementRow = ({ template }: { template: AgreementTemplate }) => (
        <div className="group flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{template.clause_name}</span>
                    {template.is_default && (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50 px-1.5 py-0 text-[10px] uppercase tracking-wider font-bold">
                            Default
                        </Badge>
                    )}
                    {template.status === 'archived' && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase tracking-wider font-bold">
                            Inactive
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><History className="h-3 w-3" /> v{template.version_number}</span>
                    <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900"
                    onClick={() => {
                        setSelectedTemplate(template);
                        setPreviewOpen(true);
                    }}
                >
                    <Eye className="h-4 w-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900"
                    onClick={() => {
                        setSelectedTemplate(template);
                        setFormData({
                            user_type: template.user_type,
                            service_model: template.service_model,
                            clause_name: template.clause_name,
                            clause_body: template.clause_body,
                            is_default: template.is_default
                        });
                        setEditorOpen(true);
                    }}
                >
                    <Edit className="h-4 w-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900"
                    onClick={() => {
                        setIsDuplicating(true);
                        setFormData({
                            user_type: template.user_type,
                            service_model: template.service_model,
                            clause_name: `${template.clause_name} (Copy)`,
                            clause_body: template.clause_body,
                            is_default: false
                        });
                        setEditorOpen(true);
                    }}
                >
                    <Copy className="h-4 w-4" />
                </Button>
                {!template.is_default && template.status === 'active' && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-gray-400 hover:text-amber-600"
                        onClick={() => handleSetAsDefault(template)}
                    >
                        <Star className="h-4 w-4" />
                    </Button>
                )}
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-8 w-8 p-0 ${template.status === 'active' ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-emerald-600'}`}
                    onClick={() => toggleStatus(template)}
                >
                    {template.status === 'active' ? <Archive className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto pb-12 animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Agreements</h1>
                    <p className="text-sm text-gray-500">Manage legal contract templates by service type and user role.</p>
                </div>
                <Button onClick={() => { resetForm(); setEditorOpen(true); }} className="bg-gray-900 text-white hover:bg-gray-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agreement
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search by template name..." 
                        className="pl-9 bg-gray-50/50 border-gray-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={filterUserType} onValueChange={setFilterUserType}>
                        <SelectTrigger className="w-full md:w-[130px] bg-gray-50/50 border-gray-200">
                            <SelectValue placeholder="User Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="talent">Talent</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterServiceModel} onValueChange={setFilterServiceModel}>
                        <SelectTrigger className="w-full md:w-[160px] bg-gray-50/50 border-gray-200">
                            <SelectValue placeholder="Service Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Services</SelectItem>
                            {SERVICE_MODELS.map(sm => (
                                <SelectItem key={sm.value} value={sm.value}>{sm.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full md:w-[120px] bg-gray-50/50 border-gray-200">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="archived">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grouped Accordion */}
            <Accordion type="multiple" defaultValue={SERVICE_MODELS.map(sm => sm.value)} className="space-y-4">
                {SERVICE_MODELS.map(sm => {
                    const clientCount = groupedTemplates[sm.value].client.length;
                    const talentCount = groupedTemplates[sm.value].talent.length;
                    
                    if (filterServiceModel !== 'all' && filterServiceModel !== sm.value) return null;
                    if (clientCount === 0 && talentCount === 0 && searchQuery !== "") return null;

                    return (
                        <AccordionItem key={sm.value} value={sm.value} className="border border-gray-200 rounded-lg bg-white overflow-hidden px-0">
                            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50/50 transition-colors hover:no-underline border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-md">
                                        <FileText className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-base font-semibold text-gray-900">{sm.label}</span>
                                        <span className="text-xs text-gray-500">
                                            {clientCount} Client • {talentCount} Talent Templates
                                        </span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                                {clientCount === 0 && talentCount === 0 ? (
                                    <div className="p-12 text-center">
                                        <p className="text-sm text-gray-400">No agreements created for this service type.</p>
                                        <Button 
                                            variant="link" 
                                            className="mt-2 text-brand-primary h-auto p-0"
                                            onClick={() => {
                                                resetForm();
                                                setFormData(prev => ({ ...prev, service_model: sm.value as any }));
                                                setEditorOpen(true);
                                            }}
                                        >
                                            Create Agreement
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {/* Client Subsection */}
                                        <div className="bg-gray-50/30 px-6 py-2 border-b border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Agreements</span>
                                        </div>
                                        {groupedTemplates[sm.value].client.length > 0 ? (
                                            groupedTemplates[sm.value].client.map(t => <AgreementRow key={t.id} template={t} />)
                                        ) : (
                                            <div className="p-4 text-center border-b border-gray-100 italic text-xs text-gray-400">None</div>
                                        )}

                                        {/* Talent Subsection */}
                                        <div className="bg-gray-50/30 px-6 py-2 border-b border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Talent Agreements</span>
                                        </div>
                                        {groupedTemplates[sm.value].talent.length > 0 ? (
                                            groupedTemplates[sm.value].talent.map(t => <AgreementRow key={t.id} template={t} />)
                                        ) : (
                                            <div className="p-4 text-center italic text-xs text-gray-400">None</div>
                                        )}
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>

            {/* Editor Drawer */}
            <Sheet open={editorOpen} onOpenChange={(open) => { if(!open) { setEditorOpen(false); resetForm(); setSelectedTemplate(null); } }}>
                <SheetContent side="right" className="sm:max-w-[720px] w-full p-0 flex flex-col">
                    <SheetHeader className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-xl font-semibold">
                                {isDuplicating ? 'Duplicate Template' : selectedTemplate ? 'Edit Template' : 'Create Template'}
                            </SheetTitle>
                            <div className="flex items-center gap-2">
                                {formData.is_default && (
                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100">Default</Badge>
                                )}
                                {selectedTemplate && !isDuplicating && (
                                    <Badge variant="secondary">v{selectedTemplate.version_number}</Badge>
                                )}
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">User Type</Label>
                                <Select 
                                    disabled={!!selectedTemplate && !isDuplicating}
                                    value={formData.user_type} 
                                    onValueChange={(v: 'client' | 'talent') => setFormData({ ...formData, user_type: v })}
                                >
                                    <SelectTrigger className="bg-gray-50/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {USER_TYPES.map(ut => <SelectItem key={ut.value} value={ut.value}>{ut.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Service Model</Label>
                                <Select 
                                    disabled={!!selectedTemplate && !isDuplicating}
                                    value={formData.service_model} 
                                    onValueChange={(v: 'direct_hire' | 'trial_to_hire' | 'contract_talent') => setFormData({ ...formData, service_model: v })}
                                >
                                    <SelectTrigger className="bg-gray-50/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SERVICE_MODELS.map(sm => <SelectItem key={sm.value} value={sm.value}>{sm.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Template Name</Label>
                            <Input 
                                placeholder="e.g. Full Time Hire Client Agreement"
                                value={formData.clause_name}
                                onChange={(e) => setFormData({ ...formData, clause_name: e.target.value })}
                                className="bg-gray-50/50"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-gray-900">Set as default template</span>
                                <span className="text-xs text-gray-500">Make this the primary template for new contracts</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={formData.is_default}
                                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-brand-primary"
                            />
                        </div>

                        {/* Content Tabs */}
                        <Tabs defaultValue="editor" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1">
                                <TabsTrigger value="editor">Editor</TabsTrigger>
                                <TabsTrigger value="preview">Live Preview</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="editor" className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between pb-1">
                                        <Label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">HTML Content</Label>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                            <AlertCircle className="h-3 w-3" />
                                            Variables must be wrapped in double curly braces
                                        </div>
                                    </div>
                                    
                                    {/* Variable Panel */}
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Variables</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {TEMPLATE_VARIABLES.map(v => (
                                                <button 
                                                    key={v}
                                                    onClick={() => insertVariable(v)}
                                                    className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-mono hover:border-gray-900 transition-colors"
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Textarea 
                                        id="clause-body-editor"
                                        rows={20}
                                        value={formData.clause_body}
                                        onChange={(e) => setFormData({ ...formData, clause_body: e.target.value })}
                                        className="font-mono text-xs leading-relaxed bg-gray-50/50 resize-none focus:bg-white transition-colors"
                                        placeholder="<h2>Agreement Title</h2><p>Content goes here...</p>"
                                    />
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="preview" className="mt-4">
                                <div className="p-6 bg-white border border-gray-200 rounded-lg min-h-[400px] prose prose-sm max-w-none prose-gray">
                                    <div dangerouslySetInnerHTML={{ __html: formData.clause_body }} />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <SheetFooter className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
                        <Button variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
                        <Button 
                            className="bg-gray-900 text-white hover:bg-gray-800"
                            onClick={selectedTemplate && !isDuplicating ? handleUpdate : handleCreateOrDuplicate}
                            disabled={!formData.clause_name || !formData.clause_body}
                        >
                            {isDuplicating ? 'Create Duplicate' : selectedTemplate ? 'Update Template' : 'Create Template'}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Preview Drawer */}
            <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
                <SheetContent side="right" className="sm:max-w-[720px] w-full p-0 flex flex-col">
                    <SheetHeader className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-xl font-semibold">Agreement Preview</SheetTitle>
                            <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>Close</Button>
                        </div>
                    </SheetHeader>
                    
                    {selectedTemplate && (
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="flex flex-col gap-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                                <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.clause_name}</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Service Model</span>
                                        <span className="text-sm text-gray-700">{getServiceModelLabel(selectedTemplate.service_model)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">User Type</span>
                                        <span className="text-sm text-gray-700">{getUserTypeLabel(selectedTemplate.user_type)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Version</span>
                                        <span className="text-sm text-gray-700">v{selectedTemplate.version_number}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Last Updated</span>
                                        <span className="text-sm text-gray-700">{new Date(selectedTemplate.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="prose prose-sm max-w-none prose-gray bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                                <div dangerouslySetInnerHTML={{ __html: selectedTemplate.clause_body }} />
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default AgreementTemplates;
