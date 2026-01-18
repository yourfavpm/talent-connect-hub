import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Plus,
    Edit,
    Archive,
    Copy,
    Star,
    Eye,
    Trash2,
    AlertCircle,
} from "lucide-react";

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

const AgreementTemplates = () => {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<AgreementTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterUserType, setFilterUserType] = useState<string>("all");
    const [filterServiceModel, setFilterServiceModel] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("active");

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<AgreementTemplate | null>(null);

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
    }, [filterUserType, filterServiceModel, filterStatus]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('agreement_templates')
                .select('*')
                .order('created_at', { ascending: false });

            if (filterUserType !== 'all') {
                query = query.eq('user_type', filterUserType);
            }
            if (filterServiceModel !== 'all') {
                query = query.eq('service_model', filterServiceModel);
            }
            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query;

            if (error) throw error;
            setTemplates(data || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Get next version number
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

            toast({
                title: "Success",
                description: "Agreement template created successfully",
            });

            setCreateDialogOpen(false);
            resetForm();
            fetchTemplates();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
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

            toast({
                title: "Success",
                description: "Agreement template updated successfully",
            });

            setEditDialogOpen(false);
            setSelectedTemplate(null);
            resetForm();
            fetchTemplates();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleSetAsDefault = async (template: AgreementTemplate) => {
        try {
            const { error } = await supabase
                .from('agreement_templates')
                .update({ is_default: true, updated_at: new Date().toISOString() })
                .eq('id', template.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Template set as default",
            });

            fetchTemplates();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleArchive = async (template: AgreementTemplate) => {
        try {
            const { error } = await supabase
                .from('agreement_templates')
                .update({ status: 'archived', updated_at: new Date().toISOString() })
                .eq('id', template.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Template archived",
            });

            fetchTemplates();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleDuplicate = async (template: AgreementTemplate) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Get next version number
            const { data: existing } = await supabase
                .from('agreement_templates')
                .select('version_number')
                .eq('user_type', template.user_type)
                .eq('service_model', template.service_model)
                .order('version_number', { ascending: false })
                .limit(1);

            const nextVersion = existing && existing.length > 0 ? existing[0].version_number + 1 : 1;

            const { error } = await supabase.from('agreement_templates').insert({
                user_type: template.user_type,
                service_model: template.service_model,
                clause_name: `${template.clause_name} (Copy)`,
                clause_body: template.clause_body,
                version_number: nextVersion,
                is_default: false,
                created_by: user?.id,
            });

            if (error) throw error;

            toast({
                title: "Success",
                description: "Template duplicated successfully",
            });

            fetchTemplates();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
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
    };

    const openEditDialog = (template: AgreementTemplate) => {
        setSelectedTemplate(template);
        setFormData({
            user_type: template.user_type,
            service_model: template.service_model,
            clause_name: template.clause_name,
            clause_body: template.clause_body,
            is_default: template.is_default,
        });
        setEditDialogOpen(true);
    };

    const getServiceModelLabel = (model: string) => {
        const labels: Record<string, string> = {
            direct_hire: 'Direct Hire',
            trial_to_hire: 'Trial-to-Hire',
            contract_talent: 'Contract Talent',
        };
        return labels[model] || model;
    };

    const getUserTypeLabel = (type: string) => {
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Agreement Templates</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage legal agreement clauses for contracts
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>User Type</Label>
                            <Select value={filterUserType} onValueChange={setFilterUserType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="client">Client</SelectItem>
                                    <SelectItem value="talent">Talent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Service Model</Label>
                            <Select value={filterServiceModel} onValueChange={setFilterServiceModel}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Models</SelectItem>
                                    <SelectItem value="direct_hire">Direct Hire</SelectItem>
                                    <SelectItem value="trial_to_hire">Trial-to-Hire</SelectItem>
                                    <SelectItem value="contract_talent">Contract Talent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Templates Grid */}
            <div className="grid gap-4">
                {templates.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No templates found</p>
                        </CardContent>
                    </Card>
                ) : (
                    templates.map((template) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold">{template.clause_name}</h3>
                                            {template.is_default && (
                                                <Badge className="bg-amber-100 text-amber-700">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Default
                                                </Badge>
                                            )}
                                            <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                                                {template.status}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <span>
                                                <strong>Type:</strong> {getUserTypeLabel(template.user_type)}
                                            </span>
                                            <span>
                                                <strong>Model:</strong> {getServiceModelLabel(template.service_model)}
                                            </span>
                                            <span>
                                                <strong>Version:</strong> {template.version_number}
                                            </span>
                                            <span>
                                                <strong>Updated:</strong> {new Date(template.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedTemplate(template);
                                                setPreviewDialogOpen(true);
                                            }}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(template)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        {!template.is_default && template.status === 'active' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSetAsDefault(template)}
                                            >
                                                <Star className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDuplicate(template)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        {template.status === 'active' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleArchive(template)}
                                            >
                                                <Archive className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Agreement Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>User Type</Label>
                                <Select
                                    value={formData.user_type}
                                    onValueChange={(value: 'client' | 'talent') =>
                                        setFormData({ ...formData, user_type: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="client">Client</SelectItem>
                                        <SelectItem value="talent">Talent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Service Model</Label>
                                <Select
                                    value={formData.service_model}
                                    onValueChange={(value: 'direct_hire' | 'trial_to_hire' | 'contract_talent') =>
                                        setFormData({ ...formData, service_model: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="direct_hire">Direct Hire</SelectItem>
                                        <SelectItem value="trial_to_hire">Trial-to-Hire</SelectItem>
                                        <SelectItem value="contract_talent">Contract Talent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Template Name</Label>
                            <Input
                                value={formData.clause_name}
                                onChange={(e) => setFormData({ ...formData, clause_name: e.target.value })}
                                placeholder="e.g. Trial-to-Hire Client Agreement v2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Agreement Content (HTML supported)</Label>
                            <Textarea
                                value={formData.clause_body}
                                onChange={(e) => setFormData({ ...formData, clause_body: e.target.value })}
                                rows={15}
                                className="font-mono text-sm"
                                placeholder="Enter agreement content with HTML formatting..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Available variables: {'{{talentName}}, {{clientCompany}}, {{jobTitle}}, {{clientRate}}, {{talentRate}}, etc.'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is_default"
                                checked={formData.is_default}
                                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                className="rounded"
                            />
                            <Label htmlFor="is_default">Set as default template for this combination</Label>
                        </div>
                        {formData.is_default && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                    <p className="text-sm text-amber-900">
                                        This will replace any existing default template for {getUserTypeLabel(formData.user_type)} + {getServiceModelLabel(formData.service_model)}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate}>
                                Create Template
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Agreement Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-3 bg-muted rounded-md">
                            <p className="text-sm">
                                <strong>Type:</strong> {getUserTypeLabel(formData.user_type)} •
                                <strong> Model:</strong> {getServiceModelLabel(formData.service_model)} •
                                <strong> Version:</strong> {selectedTemplate?.version_number}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Template Name</Label>
                            <Input
                                value={formData.clause_name}
                                onChange={(e) => setFormData({ ...formData, clause_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Agreement Content (HTML supported)</Label>
                            <Textarea
                                value={formData.clause_body}
                                onChange={(e) => setFormData({ ...formData, clause_body: e.target.value })}
                                rows={15}
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="edit_is_default"
                                checked={formData.is_default}
                                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                className="rounded"
                            />
                            <Label htmlFor="edit_is_default">Set as default template</Label>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdate}>
                                Update Template
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Template Preview</DialogTitle>
                    </DialogHeader>
                    {selectedTemplate && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-md">
                                <h3 className="font-semibold mb-2">{selectedTemplate.clause_name}</h3>
                                <div className="flex gap-4 text-sm text-muted-foreground">
                                    <span><strong>Type:</strong> {getUserTypeLabel(selectedTemplate.user_type)}</span>
                                    <span><strong>Model:</strong> {getServiceModelLabel(selectedTemplate.service_model)}</span>
                                    <span><strong>Version:</strong> {selectedTemplate.version_number}</span>
                                </div>
                            </div>
                            <div
                                className="prose max-w-none p-6 bg-white rounded-lg border"
                                dangerouslySetInnerHTML={{ __html: selectedTemplate.clause_body }}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AgreementTemplates;
