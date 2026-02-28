import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import VettingHeader from "./components/VettingHeader";
import StepNavigator from "./components/StepNavigator";
import StepViewer from "./components/StepViewer";
import VettingActions from "./components/VettingActions";
import AssignManagerDrawer from "./components/drawers/AssignManagerDrawer";
import SkillAssessmentDrawer from "./components/drawers/SkillAssessmentDrawer";
import RequestChangesDrawer from "./components/drawers/RequestChangesDrawer";
import RejectTalentDrawer from "./components/drawers/RejectTalentDrawer";
import ApproveTalentDrawer from "./components/drawers/ApproveTalentDrawer";
import { TalentVettingStatus, StepStatus, TalentProfileStep, StepChangeRequest } from "@/types/talent";

const VettingWorkspace = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [talent, setTalent] = useState<any>(null);
    const [steps, setSteps] = useState<TalentProfileStep[]>([]);
    const [changeRequests, setChangeRequests] = useState<StepChangeRequest[]>([]);
    const [activeStep, setActiveStep] = useState<string>("basic_info");
    const [loading, setLoading] = useState(true);
    const [talentManager, setTalentManager] = useState<{ full_name: string, email: string } | null>(null);

    // Drawer States
    const [drawers, setDrawers] = useState({
        assignManager: false,
        skillAssessment: false,
        requestChanges: false,
        reject: false,
        approve: false
    });

    const openDrawer = (name: keyof typeof drawers) => setDrawers(prev => ({ ...prev, [name]: true }));
    const closeDrawer = (name: keyof typeof drawers) => setDrawers(prev => ({ ...prev, [name]: false }));

    const fetchVettingData = useCallback(async () => {
        try {
            setLoading(true);
            
            // 1. Fetch Talent Profile
            const { data: profile, error: profileError } = await supabase.from("talent_profiles")
                .select("*")
                .eq("id", id)
                .maybeSingle();

            if (profileError) throw profileError;
            if (!profile) throw new Error("Profile not found");

            // Auto-start review if submitted
            if (profile.status === 'SUBMITTED') {
                await supabase.rpc("admin_start_review", { p_talent_user_id: profile.user_id });
                // Re-fetch to get updated status
                return fetchVettingData();
            }

            // Fetch legacy talent data for supporting components that expect it
            const { data: legacyTalent } = await supabase
                .from("talents")
                .select("*")
                .eq("user_id", profile.user_id)
                .maybeSingle();

            // Fetch sections
            const { data: sectionsData, error: sectionsError } = await supabase.from("talent_profile_sections")
                .select("*")
                .eq("user_id", profile.user_id);

            if (sectionsError) throw sectionsError;

            // Map data for UI
            const mergedTalentData = {
                ...legacyTalent,
                ...profile,
                id: profile.id, 
                user_id: profile.user_id,
                vetting_status: profile.status // Ensure naming consistency for components
            };

            setTalent(mergedTalentData);
            
            // Fetch assigned manager
            if (profile.assigned_manager || (legacyTalent as any)?.assigned_manager) {
                const managerId = profile.assigned_manager || (legacyTalent as any)?.assigned_manager;
                const { data: managerData } = await supabase
                    .from("profiles")
                    .select("first_name, last_name, email")
                    .eq("user_id", managerId)
                    .maybeSingle();
                if (managerData) {
                    setTalentManager({ 
                        full_name: `${managerData.first_name || ''} ${managerData.last_name || ''}`.trim() || 'Admin',
                        email: managerData.email 
                    });
                }
            }

            // Map sections to the "steps" format expected by StepNavigator/StepViewer
            const mappedSteps = (sectionsData || []).map(s => ({
                id: s.id,
                step_key: s.section_key,
                status: s.status.toLowerCase(), // UI expects lowercase
                data: s.data,
                last_reviewed_at: s.updated_at // Use updated_at as last reviewed
            }));

            setSteps(mappedSteps as any);

            // 3. Fetch Change Requests/Actions (Log)
            const { data: actionData } = await supabase.from("vetting_actions")
                .select("*")
                .eq("user_id", profile.user_id)
                .order("created_at", { ascending: false });

            setChangeRequests((actionData as any) || []);

        } catch (error: any) {
            toast.error("Failed to load vetting workspace: " + error.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchVettingData();
    }, [id]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#F9FAFB]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 text-gray-200 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Initializing Workspace...</span>
            </div>
        </div>
    );

    if (!talent) return <div className="p-8 text-center text-gray-500">Talent not found.</div>;

    return (
        <div className="flex flex-col h-screen bg-[#F9FAFB]">
            <VettingHeader 
                talent={talent} 
                talentManager={talentManager} 
                onRefresh={fetchVettingData}
                onAssignManager={() => openDrawer('assignManager')}
            />
            
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel */}
                <StepNavigator 
                    steps={steps} 
                    activeStep={activeStep} 
                    onStepSelect={setActiveStep} 
                />

                {/* Center Panel */}
                <main className="flex-1 overflow-y-auto px-8 py-10">
                    <div className="max-w-4xl mx-auto">
                        <StepViewer 
                            talent={talent} 
                            stepKey={activeStep} 
                            step={steps.find(s => s.step_key === activeStep)}
                            changeRequests={changeRequests.filter(r => r.step_key === activeStep)}
                            steps={steps}
                            onRefresh={fetchVettingData}
                            onRequestChanges={() => openDrawer('requestChanges')}
                        />
                    </div>
                </main>

                {/* Right Panel */}
                <VettingActions 
                    talent={talent} 
                    steps={steps} 
                    talentManager={talentManager}
                    onRefresh={fetchVettingData} 
                    onAssignManager={() => openDrawer('assignManager')}
                    onSkillAssessment={() => openDrawer('skillAssessment')}
                    onApprove={() => openDrawer('approve')}
                    onReject={() => openDrawer('reject')}
                    onRequestChanges={() => openDrawer('requestChanges')}
                />
            </div>

            {/* Drawers */}
            <AssignManagerDrawer 
                open={drawers.assignManager} 
                onOpenChange={(v) => !v && closeDrawer('assignManager')}
                talentId={talent.id}
                currentManagerId={talent.assigned_manager}
                onSuccess={fetchVettingData}
            />
            <SkillAssessmentDrawer 
                open={drawers.skillAssessment}
                onOpenChange={(v) => !v && closeDrawer('skillAssessment')}
                talent={talent}
                onSuccess={fetchVettingData}
            />
            <RequestChangesDrawer 
                open={drawers.requestChanges}
                onOpenChange={(v) => !v && closeDrawer('requestChanges')}
                talentId={talent.id}
                stepKey={activeStep}
                onSuccess={fetchVettingData}
            />
            <RejectTalentDrawer 
                open={drawers.reject}
                onOpenChange={(v) => !v && closeDrawer('reject')}
                talent={talent}
                onSuccess={fetchVettingData}
            />
            <ApproveTalentDrawer 
                open={drawers.approve}
                onOpenChange={(v) => !v && closeDrawer('approve')}
                talent={talent}
                onSuccess={fetchVettingData}
            />
        </div>
    );
};

export default VettingWorkspace;
