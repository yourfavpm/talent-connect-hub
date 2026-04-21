import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { getCurrentZone, Zone } from "@/utils/subdomain";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { FEATURES } from "@/config/features";
import { useVettingVersion } from "./hooks/useVettingVersion";
import { useAuth } from "@/hooks/useAuth";
import { getZoneUrl } from "@/utils/subdomain";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

// Layouts and Core Components
import WebsiteLayout from "./components/website/WebsiteLayout";
import ScrollToTop from "./components/ScrollToTop";
import ClientLayout from "./components/client/ClientLayout";
import TalentLayout from "./components/talent/TalentLayout";
import AdminLayout from "./components/admin/AdminLayout";
import SettingsLayout from "@/pages/admin/Settings/SettingsLayout";

// --- Lazy Loading Pages ---

// Marketing
const Index = lazy(() => import("./pages/Index"));
const ForCompanies = lazy(() => import("./pages/ForCompanies"));
const ForProfessionals = lazy(() => import("./pages/ForProfessionals"));
const ServiceModels = lazy(() => import("./pages/ServiceModels"));
const Pricing = lazy(() => import("./pages/Pricing"));
const BookConsultation = lazy(() => import("./pages/BookConsultation"));
const Insights = lazy(() => import("./pages/Insights"));
const About = lazy(() => import("./pages/About"));
const Careers = lazy(() => import("./pages/Careers"));
const DirectHire = lazy(() => import("./pages/DirectHire"));
const TrialToHire = lazy(() => import("./pages/TrialToHire"));
const ProjectEngagement = lazy(() => import("./pages/ProjectEngagement"));
const OffshoreHiring = lazy(() => import("./pages/OffshoreHiring"));
const VettingProcess = lazy(() => import("./pages/VettingProcess"));
const PublicJobs = lazy(() => import("./pages/PublicJobs"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Auth
const Login = lazy(() => import("./pages/auth/Login"));
const SignupHub = lazy(() => import("./pages/auth/SignupHub"));
const ClientSignup = lazy(() => import("./pages/auth/ClientSignup"));
const TalentSignup = lazy(() => import("./pages/auth/TalentSignup"));
const AdminSignup = lazy(() => import("./pages/auth/AdminSignup"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const CheckEmail = lazy(() => import("./pages/auth/CheckEmail"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));

// Client
const ClientOnboarding = lazy(() => import("@/pages/client/Onboarding"));
const ClientDashboard = lazy(() => import("@/pages/client/Dashboard"));
const BrowseTalents = lazy(() => import("@/pages/client/BrowseTalents"));
const ClientTalentProfile = lazy(() => import("@/pages/client/TalentProfile"));
const Jobs = lazy(() => import("@/pages/client/Jobs"));
const CreateJob = lazy(() => import("@/pages/client/CreateJob"));
const ClientJobDetail = lazy(() => import("@/pages/client/JobDetail"));
const Contracts = lazy(() => import("@/pages/client/Contracts"));
const Invoices = lazy(() => import("@/pages/client/Invoices"));
const ClientPayments = lazy(() => import("@/pages/client/Payments"));
const ClientTimesheets = lazy(() => import("@/pages/client/Timesheets"));
const Team = lazy(() => import("@/pages/client/Team"));
const ClientSupport = lazy(() => import("@/pages/client/Support"));
const ClientSettings = lazy(() => import("@/pages/client/Settings"));
const HireRequestsList = lazy(() => import("@/pages/client/HireRequests/HireRequestsList"));
const CreateHireRequest = lazy(() => import("@/pages/client/HireRequests/CreateHireRequest"));
const HireRequestDetail = lazy(() => import("@/pages/client/HireRequests/HireRequestDetail"));

// Talent
const TalentOnboarding = lazy(() => import("./pages/talent/Onboarding"));
const TalentDashboard = lazy(() => import("./pages/talent/Dashboard"));
const TalentProfile = lazy(() => import("./pages/talent/Profile"));
const TalentJobs = lazy(() => import("./pages/talent/Jobs"));
const TalentContracts = lazy(() => import("./pages/talent/Contracts"));
const TalentOffers = lazy(() => import("./pages/talent/Offers"));
const TalentJobDetail = lazy(() => import("./pages/talent/JobDetail"));
const TalentApplications = lazy(() => import("./pages/talent/Applications"));
const TalentInterviews = lazy(() => import("./pages/talent/Interviews"));
const TalentAssignments = lazy(() => import("./pages/talent/Assignments"));
const TalentTimesheets = lazy(() => import("./pages/talent/Timesheets"));
const TimesheetForm = lazy(() => import("./pages/talent/TimesheetForm"));
const TalentMessages = lazy(() => import("./pages/talent/Messages"));
const MessageThread = lazy(() => import("./pages/talent/MessageThread"));
const TalentSupport = lazy(() => import("./pages/talent/Support"));
const SupportTicketForm = lazy(() => import("./pages/talent/SupportTicketForm"));
const TicketDetail = lazy(() => import("./pages/talent/TicketDetail"));
const TalentSettings = lazy(() => import("./pages/talent/Settings"));
const TalentPayments = lazy(() => import("./pages/talent/Payments"));
const TalentTeam = lazy(() => import("./pages/talent/Team"));
const OnboardingV2 = lazy(() => import("./pages/talent/OnboardingV2"));
const ProfileV2 = lazy(() => import("./pages/talent/ProfileV2"));
const OnboardingRedirect = lazy(() => import("./pages/talent/OnboardingRedirect"));

// Admin
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminTalents = lazy(() => import("./pages/admin/Talents"));
const AdminTalentDetail = lazy(() => import("./pages/admin/TalentDetail"));
const VettingWorkspace = lazy(() => import("./pages/admin/TalentVetting/VettingWorkspace"));
const AdminClients = lazy(() => import("@/pages/admin/Clients"));
const AdminClientDetail = lazy(() => import("@/pages/admin/ClientDetail"));
const AdminJobs = lazy(() => import("@/pages/admin/Jobs"));
const AdminJobDetail = lazy(() => import("@/pages/admin/JobDetail"));
const AdminOffers = lazy(() => import("@/pages/admin/Offers"));
const AdminContracts = lazy(() => import("@/pages/admin/Contracts"));
const AdminInvoices = lazy(() => import("@/pages/admin/Invoices"));
const AdminSupport = lazy(() => import("@/pages/admin/Support"));
const AdminSupportDetail = lazy(() => import("@/pages/admin/SupportDetail"));
const AdminInvoiceDetail = lazy(() => import("@/pages/admin/InvoiceDetail"));
const AdminTeam = lazy(() => import("@/pages/admin/Team"));
const AdminDetail = lazy(() => import("@/pages/admin/Team/AdminDetail"));
const RolesPermissions = lazy(() => import("@/pages/admin/Team/RolesPermissions"));
const AuditLog = lazy(() => import("@/pages/admin/Team/AuditLog"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminConsultations = lazy(() => import("@/pages/admin/Consultations"));
const AdminConsultationDetail = lazy(() => import("@/pages/admin/ConsultationDetail"));
const AdminOfferConfig = lazy(() => import("@/pages/admin/OfferConfiguration"));
const AgreementTemplates = lazy(() => import("@/pages/admin/AgreementTemplates"));
const AdminTimesheets = lazy(() => import("@/pages/admin/Timesheets"));
const AdminTimesheetDetail = lazy(() => import("@/pages/admin/TimesheetDetail"));
const AdminPayments = lazy(() => import("@/pages/admin/Payments"));
const VettingQueueV2 = lazy(() => import("./pages/admin/VettingQueueV2"));
const VettingWorkspaceV2 = lazy(() => import("./pages/admin/VettingWorkspaceV2"));
const AdminTalentDirectory = lazy(() => import("./pages/admin/TalentDirectory/AdminTalentDirectory"));
const AdminTalentProfileView = lazy(() => import("./pages/admin/TalentDirectory/AdminTalentProfileView"));
const AdminHireRequestsList = lazy(() => import("./pages/admin/HireRequests/AdminHireRequestsList"));
const AdminHireRequestDetail = lazy(() => import("./pages/admin/HireRequests/AdminHireRequestDetail"));

// Academy
const AcademyHome = lazy(() => import("./pages/academy/AcademyHome"));
const BrowseCourses = lazy(() => import("./pages/academy/BrowseCourses"));
const CourseDetail = lazy(() => import("./pages/academy/CourseDetail"));
const CoursePlayer = lazy(() => import("./pages/academy/CoursePlayer"));
const CourseHub = lazy(() => import("./pages/academy/CourseHub"));
const AcademyManagement = lazy(() => import("./pages/admin/Academy/AcademyManagement"));
const CourseManagement = lazy(() => import("./pages/admin/Academy/CourseManagement"));
const CohortDetail = lazy(() => import("./pages/admin/Academy/CohortDetail"));

// Admin Settings Sections
const OrganizationSettings = lazy(() => import("@/pages/admin/Settings/sections/Organization"));
const ServiceModelsSettings = lazy(() => import("@/pages/admin/Settings/sections/ServiceModels"));
const ContractsSettings = lazy(() => import("@/pages/admin/Settings/sections/Contracts"));
const FinanceSettings = lazy(() => import("@/pages/admin/Settings/sections/Finance"));
const WorkflowSettings = lazy(() => import("@/pages/admin/Settings/sections/Workflows"));
const NotificationSettings = lazy(() => import("@/pages/admin/Settings/sections/Notifications"));
const SecuritySettings = lazy(() => import("@/pages/admin/Settings/sections/Security"));
const BrandingSettings = lazy(() => import("@/pages/admin/Settings/sections/Branding"));
const IntegrationsSettings = lazy(() => import("@/pages/admin/Settings/sections/Integrations"));
const DataSettings = lazy(() => import("@/pages/admin/Settings/sections/Data"));
const SettingsAuditLog = lazy(() => import("@/pages/admin/Settings/sections/AuditLogs"));

const OnboardingRouter = () => {
  const { version, isLoading } = useVettingVersion();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  return version === "v2" ? <OnboardingV2 /> : <TalentOnboarding />;
};

const ProfileRouter = () => {
  const { version, isLoading } = useVettingVersion();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  return version === "v2" ? <ProfileV2 /> : <TalentProfile />;
};

const AdminVettingQueueRouter = () => {
  const { version, isLoading } = useVettingVersion();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  return version === "v2" ? <VettingQueueV2 /> : <AdminTalents />;
};

const AdminVettingWorkspaceRouter = () => {
  const { version, isLoading } = useVettingVersion();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  return version === "v2" ? <VettingWorkspaceV2 /> : <VettingWorkspace />;
};


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * Ensures the user is in the correct zone and is authenticated if required.
 */
const ZoneGuard = ({ 
  children, 
  allowedZone, 
  protected: isProtected = false 
}: { 
  children: React.ReactNode; 
  allowedZone: Zone;
  protected?: boolean;
}) => {
  const { user, loading } = useAuth();
  const currentZone = getCurrentZone();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // 1. If not in the allowed zone for this route set, don't render it
  if (currentZone !== allowedZone) {
    return <Navigate to="/404" replace />;
  }

  // 2. If it's a protected portal zone and user is NOT logged in, redirect to Auth Hub
  if (isProtected && !user) {
    const loginUrl = getZoneUrl(Zone.AUTH, "/auth/login");
    window.location.href = loginUrl;
    return null;
  }

  return <>{children}</>;
};

/**
 * Helpful visual indicator for development only
 */
const DevZoneIndicator = ({ zone }: { zone: Zone }) => {
  if (window.location.hostname !== "localhost" && !window.location.hostname.endsWith(".localhost")) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] px-3 py-1 bg-black/80 backdrop-blur border border-white/10 rounded-full text-[10px] font-mono text-white/50 pointer-events-none select-none">
      ZONE: <span className="text-blue-400 font-bold">{zone}</span>
    </div>
  );
};

import { HelmetProvider } from "react-helmet-async";

const App = () => {
  const zone = getCurrentZone();

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ErrorBoundary>
              <BrowserRouter>
                <ScrollToTop />
                <DevZoneIndicator zone={zone} />
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center bg-white">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                }>
                <Routes>
              {/* Marketing Zone (opslyhr.com) */}
              {zone === Zone.MARKETING && (
                <Route element={<WebsiteLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/for-companies" element={<ForCompanies />} />
                  <Route path="/for-professionals" element={<ForProfessionals />} />
                  <Route path="/service-models" element={<ServiceModels />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/book-consultation" element={<BookConsultation />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/direct-hire" element={<DirectHire />} />
                  <Route path="/trial-to-hire" element={<TrialToHire />} />
                  <Route path="/project-engagement" element={<ProjectEngagement />} />
                  <Route path="/offshore-hiring" element={<OffshoreHiring />} />
                  <Route path="/vetting-process" element={<VettingProcess />} />
                  <Route path="/jobs" element={<PublicJobs />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              )}

              {/* Auth Hub Zone (app.opslyhr.com) */}
              {zone === Zone.AUTH && (
                <>
                  <Route index element={<Navigate to="/auth/login" replace />} />
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/signup" element={<SignupHub />} />
                  <Route path="/auth/signup/client" element={<ClientSignup />} />
                  <Route path="/auth/signup/talent" element={<TalentSignup />} />
                  <Route path="/auth/check-email" element={<CheckEmail />} />
                  <Route path="/auth/verify-email" element={<VerifyEmail />} />
                  <Route path="/auth/admin-signup" element={<AdminSignup />} />
                  <Route path="/auth/reset-password" element={<ResetPassword />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/auth/login" replace />} />
                </>
              )}
              
              {/* Academy Zone (academy.opslyhr.com) */}
              {zone === Zone.ACADEMY && (
                <>
                  <Route index element={<AcademyHome />} />
                  <Route path="browse" element={<BrowseCourses />} />
                  <Route path="courses" element={<Navigate to="/browse" replace />} />
                  <Route path="courses/:slug" element={<CourseDetail />} />
                  <Route path="courses/:slug/learn" element={<CoursePlayer />} />
                  <Route path="hub" element={<CourseHub />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}

              {/* Protected Portal Zones (Shared Path handling via absolute redirects) */}
              <Route path="/*" element={
                <ZoneGuard 
                  allowedZone={zone} 
                  protected={zone === Zone.TALENT || zone === Zone.CLIENT || zone === Zone.ADMIN}
                >
                  <Routes>
                    {/* Client Portal Zone */}
                    {zone === Zone.CLIENT && (
                      <>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="onboarding" element={<ClientOnboarding />} />
                        <Route element={<ClientLayout />}>
                          <Route path="dashboard" element={<ClientDashboard />} />
                          <Route path="browse-talents" element={<BrowseTalents />} />
                          <Route path="browse-talents/:talentId" element={<ClientTalentProfile />} />
                          
                          {FEATURES.hire_request_v2_enabled ? (
                            <>
                              <Route path="hire-requests" element={<HireRequestsList />} />
                              <Route path="hire-requests/new/:id?" element={<CreateHireRequest />} />
                              <Route path="hire-requests/:id" element={<HireRequestDetail />} />
                              <Route path="jobs/*" element={<Navigate to="/hire-requests" replace />} />
                            </>
                          ) : (
                            <>
                              <Route path="jobs" element={<Jobs />} />
                              <Route path="jobs/new" element={<CreateJob />} />
                              <Route path="jobs/:id" element={<ClientJobDetail />} />
                            </>
                          )}

                          <Route path="contracts" element={<Contracts />} />
                          <Route path="timesheets" element={<ClientTimesheets />} />
                          <Route path="invoices" element={<Invoices />} />
                          <Route path="payments" element={<ClientPayments />} />
                          <Route path="team" element={<Team />} />
                          <Route path="support" element={<ClientSupport />} />
                          <Route path="settings" element={<ClientSettings />} />
                        </Route>
                      </>
                    )}

                    {/* Talent Portal Zone */}
                    {zone === Zone.TALENT && (
                      <>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        {/* Onboarding redirect route (used after email verification during signup) */}
                        <Route path="onboarding-redirect" element={<OnboardingRedirect />} />
                        <Route element={<TalentLayout />}>
                          <Route path="onboarding" element={<OnboardingRouter />} />
                          <Route path="dashboard" element={<TalentDashboard />} />
                          <Route path="profile" element={<ProfileRouter />} />
                          <Route path="jobs" element={<TalentJobs />} />
                          <Route path="jobs/:id" element={<TalentJobDetail />} />
                          <Route path="offers" element={<TalentOffers />} />
                          <Route path="applications" element={<TalentApplications />} />
                          <Route path="interviews" element={<TalentInterviews />} />
                          <Route path="assignments" element={<TalentAssignments />} />
                          <Route path="contracts" element={<TalentContracts />} />
                          <Route path="timesheets" element={<TalentTimesheets />} />
                          <Route path="timesheets/new" element={<TimesheetForm />} />
                          <Route path="timesheets/:id" element={<TimesheetForm />} />
                          <Route path="messages" element={<TalentMessages />} />
                          <Route path="messages/:id" element={<MessageThread />} />
                          <Route path="support" element={<TalentSupport />} />
                          <Route path="support/new" element={<SupportTicketForm />} />
                          <Route path="support/:id" element={<TicketDetail />} />
                          <Route path="settings" element={<TalentSettings />} />
                          <Route path="payments" element={<TalentPayments />} />
                          <Route path="team" element={<TalentTeam />} />
                        </Route>
                      </>
                    )}

                    {/* Admin Portal Zone */}
                    {zone === Zone.ADMIN && (
                      <>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route element={<AdminLayout />}>
                          <Route path="dashboard" element={<AdminDashboard />} />
                          <Route path="vetting" element={<AdminVettingQueueRouter />} />
                          <Route path="vetting/:id" element={<AdminVettingWorkspaceRouter />} />
                          <Route path="talents" element={<AdminTalentDirectory mode="global" />} />
                          <Route path="my-talents" element={<AdminTalentDirectory mode="manager" />} />
                          <Route path="hiring-pipeline" element={<AdminTalentDirectory mode="pipeline" />} />
                          <Route path="talents/:id" element={<AdminTalentProfileView />} />
                          <Route path="clients" element={<AdminClients />} />
                          <Route path="clients/:id" element={<AdminClientDetail />} />
                          <Route path="jobs" element={<AdminJobs />} />
                          <Route path="jobs/:id" element={<AdminJobDetail />} />
                          <Route path="hire-requests" element={<AdminHireRequestsList />} />
                          <Route path="hire-requests/:id" element={<AdminHireRequestDetail />} />
                          <Route path="offers" element={<AdminOffers />} />
                          <Route path="offers/:offerId/configure" element={<AdminOfferConfig />} />
                          <Route path="legal/agreements" element={<AgreementTemplates />} />
                          <Route path="contracts" element={<AdminContracts />} />
                          <Route path="invoices" element={<AdminInvoices />} />
                          <Route path="payments" element={<AdminPayments />} />
                          <Route path="timesheets" element={<AdminTimesheets />} />
                          <Route path="timesheets/:id" element={<AdminTimesheetDetail />} />
                          <Route path="consultations" element={<AdminConsultations />} />
                          <Route path="consultations/:id" element={<AdminConsultationDetail />} />
                          <Route path="support" element={<AdminSupport />} />
                          <Route path="support/:id" element={<AdminSupportDetail />} />
                          <Route path="academy">
                            <Route index element={<AcademyManagement />} />
                            <Route path="courses" element={<CourseManagement />} />
                            <Route path="cohorts/:id" element={<CohortDetail />} />
                          </Route>
                          <Route path="team">
                            <Route index element={<AdminTeam />} />
                            <Route path="admins/:id" element={<AdminDetail />} />
                            <Route path="roles" element={<RolesPermissions />} />
                            <Route path="audit" element={<AuditLog />} />
                          </Route>
                          <Route path="settings" element={<SettingsLayout />}>
                            <Route index element={<Navigate to="organization" replace />} />
                            <Route path="organization" element={<OrganizationSettings />} />
                            <Route path="service-models" element={<ServiceModelsSettings />} />
                            <Route path="contracts" element={<ContractsSettings />} />
                            <Route path="finance" element={<FinanceSettings />} />
                            <Route path="workflows" element={<WorkflowSettings />} />
                            <Route path="notifications" element={<NotificationSettings />} />
                            <Route path="security" element={<SecuritySettings />} />
                            <Route path="branding" element={<BrandingSettings />} />
                            <Route path="integrations" element={<IntegrationsSettings />} />
                            <Route path="data" element={<DataSettings />} />
                            <Route path="audit" element={<SettingsAuditLog />} />
                          </Route>
                        </Route>
                      </>
                    )}
                    
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </ZoneGuard>
              } />
            </Routes>
          </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);
};

export default App;
