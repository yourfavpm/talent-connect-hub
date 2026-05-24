import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, CheckCircle, Search, Loader2, Eye, MapPin, Briefcase, GraduationCap, Award, FileText, UserCheck, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Separate component to handle detailed fetching
const TalentDrawerContent = ({ talent, jobId, jobStatus, onClose }: { talent: any, jobId: string, jobStatus?: string, onClose: () => void }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch deep details
    const { data: details, isLoading } = useQuery({
        queryKey: ['talent_deep_details', talent.id],
        queryFn: async () => {
            const [work, edu, certs, refs, vetting] = await Promise.all([
                supabase.from('talent_work_history').select('*').eq('talent_id', talent.id).order('start_date', { ascending: false }),
                supabase.from('talent_education').select('*').eq('talent_id', talent.id).order('start_year', { ascending: false }),
                supabase.from('talent_certifications').select('*').eq('talent_id', talent.id),
                supabase.from('talent_references').select('*').eq('talent_id', talent.id),
                supabase.from('talent_vetting').select('*').eq('talent_id', talent.id).order('level', { ascending: true })
            ]);
            return {
                work: work.data || [],
                education: edu.data || [],
                certifications: certs.data || [],
                references: refs.data || [],
                vetting: vetting.data || []
            };
        }
    });

    const addCandidateMutation = useMutation({
        mutationFn: async ({ status }: { status: string }) => {
            // If this jobId corresponds to a v2 hire request, call the v2 RPC to shortlist
            const { data: maybeV2 } = await supabase.from('hr_v2_hire_requests').select('id').eq('id', jobId).maybeSingle();
            if (maybeV2) {
                // Use RPC to shortlist so platform workflows and emails trigger consistently
                const rpcName = 'hr_v2_admin_shortlist_talent';
                const tUserId = talent.user_id || talent.id;
                const { error: rpcErr } = await (supabase as any).rpc(rpcName, { req_id: jobId, t_user_id: tUserId, reason: status === 'shortlisted' ? 'Shortlisted via sourcing' : '' });
                if (rpcErr) throw rpcErr;
                return;
            }

            const { error } = await supabase.from('job_applications').insert({
                job_id: jobId,
                talent_id: talent.id,
                status: status,
                admin_notes: `Added by admin via Sourcing (${status})`
            });
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['job_applications', jobId] });
            queryClient.invalidateQueries({ queryKey: ['job_applications_ids', jobId] });
            toast({
                title: variables.status === 'shortlisted' ? "Shortlisted" : "Invited",
                description: variables.status === 'shortlisted' ? "Candidate added to Shortlist" : "Candidate invited to apply"
            });
            onClose();
        },
        onError: (e: any) => {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    });

    const canShortlist = jobStatus === 'approved' || jobStatus === 'published';

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    const { work, education, certifications, references, vetting } = details || {};

    return (
        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
            <div className="space-y-8 py-4">
                {/* Vetting Summary (Admin View) */}
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Vetting Overview
                    </h3>
                    <div className="grid gap-3">
                        {vetting?.map((v: any) => (
                            <div key={v.id} className="flex justify-between items-start text-sm border-b border-primary/10 last:border-0 pb-2 last:pb-0">
                                <div>
                                    <span className="font-medium block">{v.level_name.replace(/_/g, ' ')}</span>
                                    {v.admin_notes && <p className="text-muted-foreground text-xs">{v.admin_notes}</p>}
                                </div>
                                {(() => {
                                    const lowerStatus = `${v.status || ''}`.toLowerCase();
                                    return (
                                        <Badge variant={lowerStatus === 'approved' ? 'default' : lowerStatus === 'rejected' ? 'destructive' : 'secondary'} className="capitalize bg-opacity-80">
                                            {v.status}
                                        </Badge>
                                    );
                                })()}
                            </div>
                        ))}
                        {vetting?.length === 0 && <p className="text-sm text-muted-foreground">No vetting records found.</p>}
                    </div>
                </div>

                {/* Bio */}
                <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">About</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{talent.bio || "No summary provided."}</p>
                </div>

                {/* Skills */}
                <div>
                    <h3 className="font-semibold mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {talent.skills?.map((skill: string) => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                        )) || <p className="text-sm text-muted-foreground">No skills listed.</p>}
                    </div>
                </div>

                {/* Work History */}
                <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Work History</h3>
                    <div className="space-y-4">
                        {work?.map((w: any) => (
                            <div key={w.id} className="border-l-2 border-muted pl-4">
                                <h4 className="font-medium text-sm">{w.role_title}</h4>
                                <p className="text-xs text-muted-foreground">{w.company_name} • {w.start_date ? new Date(w.start_date).getFullYear() : ''} - {w.is_current ? 'Present' : (w.end_date ? new Date(w.end_date).getFullYear() : '')}</p>
                                {w.role_description && <p className="text-xs mt-1 text-foreground/80">{w.role_description}</p>}
                            </div>
                        ))}
                        {work?.length === 0 && <p className="text-sm text-muted-foreground">No work history provided.</p>}
                    </div>
                </div>

                {/* Education */}
                <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Education</h3>
                    <div className="space-y-3">
                        {education?.map((e: any) => (
                            <div key={e.id} className="text-sm">
                                <h4 className="font-medium">{e.institution_name}</h4>
                                <p className="text-muted-foreground text-xs">{e.field_of_study}</p>
                                <p className="text-muted-foreground text-xs">{e.start_year} - {e.end_year || 'Present'}</p>
                            </div>
                        ))}
                        {education?.length === 0 && <p className="text-sm text-muted-foreground">No education provided.</p>}
                    </div>
                </div>

                {/* Certifications & Refs */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2"><Award className="h-4 w-4" /> Certifications</h3>
                        <div className="space-y-2">
                            {certifications?.map((c: any) => (
                                <div key={c.id} className="text-sm bg-muted/20 p-2 rounded">
                                    <p className="font-medium text-xs">{c.certification_name}</p>
                                    <p className="text-muted-foreground text-[10px]">{c.issuing_organization}</p>
                                </div>
                            ))}
                            {certifications?.length === 0 && <p className="text-sm text-muted-foreground">None.</p>}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2"><UserCheck className="h-4 w-4" /> References</h3>
                        <div className="space-y-2">
                            {references?.map((r: any) => (
                                <div key={r.id} className="text-sm bg-muted/20 p-2 rounded">
                                    <p className="font-medium text-xs">{r.reference_name}</p>
                                    <p className="text-muted-foreground text-[10px]">{r.relationship}</p>
                                </div>
                            ))}
                            {references?.length === 0 && <p className="text-sm text-muted-foreground">None.</p>}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t mt-4 sticky bottom-0 bg-background pb-2">
                    <Button className="flex-1" variant="outline" onClick={() => addCandidateMutation.mutate({ status: 'invited' })}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite to Apply
                    </Button>
                    <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                            if (!canShortlist) {
                                toast({ title: "Restricted", description: "Only approved or published jobs can shortlist talents.", variant: "destructive" });
                                return;
                            }
                            addCandidateMutation.mutate({ status: 'shortlisted' });
                        }}
                        disabled={!canShortlist}
                        title={!canShortlist ? "Job must be approved/published to shortlist" : ""}
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Shortlist Talent
                    </Button>
                </div>
            </div>
        </ScrollArea>
    );
};


export const BrowseTalentsList = ({ jobId, jobStatus }: { jobId: string, jobStatus?: string }) => {
    const [search, setSearch] = useState("");
    const [selectedTalent, setSelectedTalent] = useState<any>(null);

    const { data: talents, isLoading } = useQuery({
        queryKey: ['vetting_talents'],
        queryFn: async () => {
            const { data } = await supabase
                .from('v2_talent_profiles')
                .select(`
                    id,
                    user_id,
                    status,
                    talents:talents(id, first_name, last_name, email, primary_role, secondary_skills, avatar_url, country, years_of_experience)
                `)
                .in('status', ['fully_vetted', 'approved', 'vetted', 'FULLY_VETTED', 'APPROVED', 'VETTED'])
                .order('created_at', { ascending: false })
                .limit(50);

            return ((data as any[]) || []).map((profile) => ({
                id: profile.talents?.id || profile.user_id,
                user_id: profile.user_id,
                profile_id: profile.id,
                first_name: profile.talents?.first_name ?? null,
                last_name: profile.talents?.last_name ?? null,
                email: profile.talents?.email ?? null,
                primary_role: profile.talents?.primary_role ?? null,
                avatar_url: profile.talents?.avatar_url ?? null,
                skills: profile.talents?.secondary_skills ?? [],
                country: profile.talents?.country ?? 'Remote',
                years_of_experience: profile.talents?.years_of_experience ?? 0,
                vetting_status: profile.status,
            }));
        }
    });

    const { data: existingApps } = useQuery({
        queryKey: ['job_applications_ids', jobId],
        queryFn: async () => {
            // Fetch legacy job_applications and v2 shortlists so we can hide already-added talents
            const [{ data: legacy }, { data: v2Short }] = await Promise.all([
                supabase.from('job_applications').select('talent_id').eq('job_id', jobId),
                supabase.from('hr_v2_shortlists').select('talent_user_id').eq('hire_request_id', jobId)
            ]);

            const legacyIds = (legacy || []).map((d: any) => d.talent_id).filter(Boolean);
            const v2Ids = (v2Short || []).map((d: any) => d.talent_user_id).filter(Boolean);
            return Array.from(new Set([...legacyIds, ...v2Ids]));
        }
    });

    const filteredTalents = talents?.filter(t =>
        !existingApps?.includes(t.id) &&
        (t.first_name?.toLowerCase().includes(search.toLowerCase()) ||
            t.last_name?.toLowerCase().includes(search.toLowerCase()) ||
            t.primary_role?.toLowerCase().includes(search.toLowerCase()))
    );

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search vetted talents..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {filteredTalents?.map(talent => (
                    <Card key={talent.id} className="overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedTalent(talent)}>
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={(talent as any).avatar_url} />
                                    <AvatarFallback>{talent.first_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <h4 className="font-medium truncate group-hover:text-primary transition-colors">{talent.first_name} {talent.last_name}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{talent.primary_role?.replace('_', ' ')}</p>
                                    <div className="flex gap-1 mt-1">
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{talent.country}</Badge>
                                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">{talent.years_of_experience}y</Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {filteredTalents?.length === 0 && <p className="col-span-2 text-center text-muted-foreground py-8">No matching talents found.</p>}
            </div>

            {/* TALENT DETAILS SHEET */}
            <Sheet open={!!selectedTalent} onOpenChange={(o) => !o && setSelectedTalent(null)}>
                <SheetContent className="sm:max-w-xl w-full p-0">
                    <div className="p-6 pb-0">
                        <SheetHeader className="mb-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border-2 border-primary/10">
                                    <AvatarImage src={(selectedTalent as any)?.avatar_url} />
                                    <AvatarFallback className="text-lg">{selectedTalent?.first_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <SheetTitle className="text-2xl">{selectedTalent?.first_name} {selectedTalent?.last_name}</SheetTitle>
                                    <SheetDescription className="text-base flex items-center gap-2 mt-1">
                                        <Briefcase className="h-4 w-4" /> {selectedTalent?.primary_role?.replace('_', ' ')}
                                        <span className="text-muted-foreground">•</span>
                                        <MapPin className="h-4 w-4" /> {selectedTalent?.country}
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>
                    </div>

                    <div className="px-6">
                        {selectedTalent && (
                            <TalentDrawerContent
                                talent={selectedTalent}
                                jobId={jobId}
                                jobStatus={jobStatus}
                                onClose={() => setSelectedTalent(null)}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};
