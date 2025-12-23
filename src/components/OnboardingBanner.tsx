import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";

interface OnboardingBannerProps {
  portalType: "client" | "talent";
}

const OnboardingBanner = ({ portalType }: OnboardingBannerProps) => {
  const onboardingPath = portalType === "client" ? "/client/onboarding" : "/talent/onboarding";
  const message =
    portalType === "client"
      ? "Complete your company profile to start posting jobs and hiring talents."
      : "Complete your onboarding to get vetted and matched to jobs.";

  return (
    <Alert className="border-warning/50 bg-warning/5">
      <AlertCircle className="h-5 w-5 text-warning" />
      <AlertTitle className="text-warning">Complete Your Profile</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span>{message}</span>
        <Link to={onboardingPath}>
          <Button size="sm" className="whitespace-nowrap">
            Complete Onboarding
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
};

export default OnboardingBanner;
