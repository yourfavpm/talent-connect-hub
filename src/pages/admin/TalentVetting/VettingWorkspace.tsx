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
            
            // 1. Fetch Talent
            const { data: talentData, error: talentError } = await supabase
                .from("talents")
                .select(`
                    *,
                    work_history:talent_work_history(*),
                    education:talent_education(*),
                    certifications:talent_certifications(*),
                    references:talent_references(*)
                `)
                .eq("id", id)
                .single();

            if (talentError) throw talentError;
            setTalent(talentData);
            
            // Fetch assigned manager from profiles table
            if (talentData.assigned_manager) {
                const { data: managerData } = await supabase
                    .from("profiles")
                    .select("first_name, last_name, email")
                    .eq("user_id", talentData.assigned_manager)
                    .single();
                if (managerData) {
                    setTalentManager({ 
                        full_name: `${managerData.first_name || ''} ${managerData.last_name || ''}`.trim() || 'Admin',
                        email: managerData.email 
                    });
                }
            }

            // 2. Fetch Steps
            const { data: stepsData, error: stepsError } = await supabase
                .from("talent_profile_steps" as any)
                .select("*")
                .eq("talent_id", id)
                .order("created_at", { ascending: true });

            if (stepsError) throw stepsError as any;
            setSteps((stepsData as any) || []);

            // 3. Fetch Change Requests
            const { data: requestData, error: requestError } = await supabase
                .from("step_change_requests" as any)
                .select("*")
                .eq("talent_id", id)
                .is("resolved_at", null);

            if (requestError) throw requestError as any;
            setChangeRequests((requestData as any) || []);

        } catch (error: any) {
            toast.error("Failed to load vetting workspace: " + error.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchVettingData();
    }, [id, fetchVettingData]);

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
