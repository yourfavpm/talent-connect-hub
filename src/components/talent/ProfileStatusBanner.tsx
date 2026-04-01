import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, CheckCircle2, User, Send, Info } from "lucide-react";
import clsx from "clsx";

export interface ProfileStatusBannerProps {
  status: string;
  progressPercent: number;
  requestedSectionsCount: number;
  vettingLevelText?: string | null;
  managerName?: string | null;
  onResubmit?: () => void;
  onRequestRevetting?: () => void;
  isResubmitting?: boolean;
}

export const ProfileStatusBanner = ({
  status,
  progressPercent,
  requestedSectionsCount,
  vettingLevelText,
  managerName,
  onResubmit,
  onRequestRevetting,
  isResubmitting
}: ProfileStatusBannerProps) => {
  
  // 1. Changes Requested (Action Required)
  if (status === "changes_requested" || requestedSectionsCount > 0) {
    return (
      <Card className="border-red-200 bg-red-50 border-l-4 border-l-red-500 shadow-sm rounded-r-lg group overflow-hidden">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 border border-red-200 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-red-900 text-[15px]">Action Required: Refinement Needed</h4>
              <p className="text-sm font-medium text-red-700 mt-0.5">
                The admin has requested changes in {requestedSectionsCount} section{requestedSectionsCount !== 1 ? 's' : ''}. Please resolve them and resubmit.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
             <Button 
               onClick={onResubmit} 
               disabled={isResubmitting} 
               className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg shadow-red-500/10"
             >
               {isResubmitting ? <Clock className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
               Resubmit Profile
             </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. Re-vetting Required (Action Required)
  if (status === "revett_required") {
    return (
      <Card className="border-rose-200 bg-rose-50 border-l-4 border-l-rose-500 shadow-sm rounded-r-lg">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 border border-rose-200 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-rose-900 text-[15px]">Changes require re-vetting</h4>
              <p className="text-sm font-medium text-rose-700 mt-0.5">
                Your recent edits to professional sections require a quick admin review before they go live.
              </p>
            </div>
          </div>
          <Button 
            onClick={onRequestRevetting} 
            disabled={isResubmitting} 
            className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg shadow-rose-500/10 shrink-0"
          >
            {isResubmitting ? <Clock className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Request Re-vetting
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 3. Incomplete Profile (Action Required)
  if (progressPercent < 100 && (status === "draft" || status === "in_progress")) {
    return (
      <Card className="border-blue-200 bg-blue-50/50 border-l-4 border-l-blue-500 shadow-sm rounded-r-[32px] overflow-hidden group">
        <CardContent className="p-4 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-8 transition-all">
          <div className="h-10 w-10 md:h-20 md:w-20 rounded-[12px] md:rounded-[24px] bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 border border-blue-200">
            <User className="h-5 w-5 md:h-10 md:w-10" />
          </div>
          <div className="flex-1 space-y-2 md:space-y-4 text-center md:text-left">
            <div className="space-y-1">
              <h3 className="text-base md:text-xl font-bold text-slate-900 tracking-tight leading-tight">Complete your professional profile</h3>
              <p className="hidden md:block text-sm md:text-[15px] text-slate-500 font-medium max-w-[500px]">
                Finish setting up your profile to get vetted and matched with global opportunities.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-blue-600">
                <span>Profile Completion</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 md:h-2 w-full bg-blue-100 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <Button className="h-11 md:h-14 px-8 md:px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl md:rounded-2xl text-[11px] md:text-[12px] font-bold uppercase tracking-widest shadow-xl shadow-blue-500/10 transition-all active:scale-[0.98] w-full" asChild>
              <Link to="/talent/profile">Complete Profile Now</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 4. Submitted / In Review (Informational)
  if (status === "submitted" || status === "in_review" || status === "resubmitted" || status === "revett_pending") {
    return (
      <Card className="border-slate-200 bg-slate-50 border-l-4 border-l-blue-600 shadow-sm rounded-r-lg">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 text-blue-600">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-[15px]">
                {status === "revett_pending" ? "Re-vetting in Progress" : "Profile Under Review"}
              </h4>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                Our specialized vetting team is currently analyzing your credentials. You'll hear from us shortly.
              </p>
            </div>
          </div>
          <Button variant="outline" className="h-10 px-6 border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm" asChild>
            <Link to="/talent/profile">Track Progress</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 5. Fully Vetted (Success)
  if (status === "vetted" || status === "approved") {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50 border-l-4 border-l-emerald-500 shadow-sm rounded-r-[24px]">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Professional Identity Verified</h3>
              <p className="text-sm text-slate-500 font-medium max-w-[500px]">
                Congratulations! You are now a fully vetted member. {vettingLevelText ? `Vetting Level: ${vettingLevelText}.` : ''} {managerName ? `Account Manager: ${managerName}.` : ''}
              </p>
            </div>
          </div>
          <Button className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10" asChild>
            <Link to="/talent/jobs">Explore Opportunities</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};
