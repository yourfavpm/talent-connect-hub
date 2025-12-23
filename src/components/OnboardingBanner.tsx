import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, ArrowRight } from "lucide-react";

interface OnboardingBannerProps {
  portalType: "client" | "talent";
  progress?: number;
  completedSteps?: number;
  totalSteps?: number;
}

const OnboardingBanner = ({ portalType, progress = 0, completedSteps, totalSteps }: OnboardingBannerProps) => {
  const onboardingPath = portalType === "client" ? "/client/onboarding" : "/talent/onboarding";
  const message =
    portalType === "client"
      ? "Complete your company profile to start posting jobs and hiring talents."
      : "Complete your onboarding to get vetted and matched to jobs.";

  const showProgress = progress > 0 && progress < 100;

  return (
    <Alert className="border-warning/50 bg-warning/5">
      <AlertCircle className="h-5 w-5 text-warning" />
      <AlertTitle className="text-warning">Complete Your Profile</AlertTitle>
      <AlertDescription className="space-y-3">
        <span className="block">{message}</span>
        
        {showProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedSteps !== undefined && totalSteps 
                  ? `${completedSteps} of ${totalSteps} steps completed`
                  : `${Math.round(progress)}% complete`
                }
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        <Link to={onboardingPath}>
          <Button size="sm" className="mt-2">
            {progress > 0 ? "Continue Onboarding" : "Start Onboarding"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
};

export default OnboardingBanner;
