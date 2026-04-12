import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to check if user has already completed mandatory onboarding sections
 * and redirect to dashboard if so.
 * 
 * Used in both OnboardingV2 and Onboarding pages to prevent re-doing what's done.
 */
export const useOnboardingGuard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (loading || !user) return;

      try {
        // Get the user's onboarding status
        const { data: profile, error: profileError } = await supabase
          .from("v2_talent_profiles")
          .select("locked_onboarding, status")
          .eq("user_id", user.id)
          .single();

        // If locked and NOT in changes_requested state, they've already completed
        if (
          profile &&
          (profile as any)?.locked_onboarding &&
          (profile as any)?.status !== "changes_requested"
        ) {
          // Redirect to profile/dashboard, they're done with onboarding
          navigate("/profile");
          return;
        }

        // Additional check: if all mandatory sections are submitted
        if (profile && !(profile as any)?.locked_onboarding) {
          const { data: sections } = await supabase
            .from("v2_profile_sections")
            .select("section_key, status")
            .eq("user_id", user.id)
            .in("section_key", ["basic_info", "professional_details", "work_history"]);

          const mandatoryComplete =
            sections &&
            sections.length === 3 &&
            sections.every((s) => (s as any)?.status === "submitted");

          if (mandatoryComplete) {
            // All mandatory sections complete, go to profile
            navigate("/profile");
          }
        }
      } catch (err) {
        console.error("Error checking onboarding guard:", err);
        // Don't block on error
      }
    };

    checkOnboardingStatus();
  }, [user, loading, navigate]);
};

/**
 * Checks if user has completed onboarding and can proceed to dashboard
 */
export const getOnboardingStatus = async (userId: string) => {
  try {
    const { data: profile } = await supabase
      .from("v2_talent_profiles")
      .select("locked_onboarding, status, progress_percent")
      .eq("user_id", userId)
      .single();

    if (!profile) return { isComplete: false, progress: 0, requiresChanges: false };

    const profileData = profile as any;
    return {
      isComplete: profileData.locked_onboarding && profileData.status !== "changes_requested",
      progress: profileData.progress_percent || 0,
      requiresChanges: profileData.status === "changes_requested",
      status: profileData.status,
      locked: profileData.locked_onboarding,
    };
  } catch (err) {
    console.error("Error getting onboarding status:", err);
    return { isComplete: false, progress: 0, requiresChanges: false };
  }
};
