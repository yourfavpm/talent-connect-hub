import { Toaster } from "@/components/ui/toaster";
import { getCurrentZone, Zone } from "@/utils/subdomain";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import WebsiteLayout from "./components/website/WebsiteLayout";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import ForCompanies from "./pages/ForCompanies";
import ForProfessionals from "./pages/ForProfessionals";
import ServiceModels from "./pages/ServiceModels";
import Pricing from "./pages/Pricing";
import BookConsultation from "./pages/BookConsultation";
import Insights from "./pages/Insights";
import About from "./pages/About";
import DirectHire from "./pages/DirectHire";
import TrialToHire from "./pages/TrialToHire";
import ProjectEngagement from "./pages/ProjectEngagement";
import OffshoreHiring from "./pages/OffshoreHiring";
import VettingProcess from "./pages/VettingProcess";
import Careers from "./pages/Careers";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import AdminSignup from "./pages/auth/AdminSignup";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import CheckEmail from "./pages/auth/CheckEmail";
import ClientLayout from "./components/client/ClientLayout";
import ClientOnboarding from "@/pages/client/Onboarding";
import ClientDashboard from "@/pages/client/Dashboard";
import BrowseTalents from "@/pages/client/BrowseTalents";
import ClientTalentProfile from "@/pages/client/TalentProfile";
import Jobs from "@/pages/client/Jobs";
import CreateJob from "@/pages/client/CreateJob";
import ClientJobDetail from "@/pages/client/JobDetail";
import Contracts from "@/pages/client/Contracts";
import Invoices from "@/pages/client/Invoices";
import ClientPayments from "@/pages/client/Payments";
import ClientTimesheets from "@/pages/client/Timesheets";
import Team from "@/pages/client/Team";
import ClientSupport from "@/pages/client/Support";
import ClientSettings from "@/pages/client/Settings";
import { FEATURES } from "@/config/features";
import HireRequestsList from "@/pages/client/HireRequests/HireRequestsList";
import CreateHireRequest from "@/pages/client/HireRequests/CreateHireRequest";
import HireRequestDetail from "@/pages/client/HireRequests/HireRequestDetail";

import TalentLayout from "./components/talent/TalentLayout";
import TalentOnboarding from "./pages/talent/Onboarding";
import TalentDashboard from "./pages/talent/Dashboard";
import TalentProfile from "./pages/talent/Profile";
import TalentJobs from "./pages/talent/Jobs";
import TalentContracts from "./pages/talent/Contracts";
import TalentOffers from "./pages/talent/Offers";
import TalentJobDetail from "./pages/talent/JobDetail";
import TalentApplications from "./pages/talent/Applications";
import TalentInterviews from "./pages/talent/Interviews";
import TalentAssignments from "./pages/talent/Assignments";
import TalentTimesheets from "./pages/talent/Timesheets";
import TimesheetForm from "./pages/talent/TimesheetForm";
import TalentMessages from "./pages/talent/Messages";
import MessageThread from "./pages/talent/MessageThread";
import TalentSupport from "./pages/talent/Support";
import SupportTicketForm from "./pages/talent/SupportTicketForm";
import TicketDetail from "./pages/talent/TicketDetail";
import TalentSettings from "./pages/talent/Settings";
import TalentPayments from "./pages/talent/Payments";
import TalentTeam from "./pages/talent/Team";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminTalents from "./pages/admin/Talents";
import AdminTalentDetail from "./pages/admin/TalentDetail";
import VettingWorkspace from "./pages/admin/TalentVetting/VettingWorkspace";
import AdminClients from "@/pages/admin/Clients";
import AdminClientDetail from "@/pages/admin/ClientDetail";
import AdminJobs from "@/pages/admin/Jobs";
import AdminJobDetail from "@/pages/admin/JobDetail";
import AdminOffers from "@/pages/admin/Offers";
import AdminContracts from "@/pages/admin/Contracts";
import AdminInvoices from "@/pages/admin/Invoices";
import AdminSupport from "@/pages/admin/Support";
import AdminSupportDetail from "@/pages/admin/SupportDetail";
import AdminInvoiceDetail from "@/pages/admin/InvoiceDetail";
import AdminTeam from "@/pages/admin/Team";
import AdminDetail from "@/pages/admin/Team/AdminDetail";
import RolesPermissions from "@/pages/admin/Team/RolesPermissions";
import AuditLog from "@/pages/admin/Team/AuditLog";
import AdminSettings from "@/pages/admin/Settings";
import AdminConsultations from "@/pages/admin/Consultations";
import AdminConsultationDetail from "@/pages/admin/ConsultationDetail";
import AdminOfferConfig from "@/pages/admin/OfferConfiguration";
import AgreementTemplates from "@/pages/admin/AgreementTemplates";
import AdminTimesheets from "@/pages/admin/Timesheets";
import AdminTimesheetDetail from "@/pages/admin/TimesheetDetail";
import AdminPayments from "@/pages/admin/Payments";
import SettingsLayout from "@/pages/admin/Settings/SettingsLayout";
import OrganizationSettings from "@/pages/admin/Settings/sections/Organization";
import ServiceModelsSettings from "@/pages/admin/Settings/sections/ServiceModels";
import ContractsSettings from "@/pages/admin/Settings/sections/Contracts";
import FinanceSettings from "@/pages/admin/Settings/sections/Finance";
import WorkflowSettings from "@/pages/admin/Settings/sections/Workflows";
import NotificationSettings from "@/pages/admin/Settings/sections/Notifications";
import SecuritySettings from "@/pages/admin/Settings/sections/Security";
import BrandingSettings from "@/pages/admin/Settings/sections/Branding";
import IntegrationsSettings from "@/pages/admin/Settings/sections/Integrations";
import DataSettings from "@/pages/admin/Settings/sections/Data";
import SettingsAuditLog from "@/pages/admin/Settings/sections/AuditLogs";
import PublicJobs from "./pages/PublicJobs";
import NotFound from "./pages/NotFound";
import { useVettingVersion } from "./hooks/useVettingVersion";
import OnboardingV2 from "./pages/talent/OnboardingV2";
import ProfileV2 from "./pages/talent/ProfileV2";
import VettingQueueV2 from "./pages/admin/VettingQueueV2";
import VettingWorkspaceV2 from "./pages/admin/VettingWorkspaceV2";
import AdminTalentDirectory from "./pages/admin/TalentDirectory/AdminTalentDirectory";
import AdminTalentProfileView from "./pages/admin/TalentDirectory/AdminTalentProfileView";
import AdminHireRequestsList from "./pages/admin/HireRequests/AdminHireRequestsList";
import AdminHireRequestDetail from "./pages/admin/HireRequests/AdminHireRequestDetail";

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

import { useAuth } from "@/hooks/useAuth";
import { getZoneUrl } from "@/utils/subdomain";

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
    return <div className="min-h-screen flex items-center justify-center text-slate-400 bg-[#0A0A0B]">Loading...</div>;
  }

  // 1. If not in the allowed zone for this route set, don't render it (Routes will fall through to NotFound)
  if (currentZone !== allowedZone) {
    return null;
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
    <div className="fixed bottom-4 right-4 z-[9999] px-3 py-1 bg-black/80 backdrop-blur border border-white/10 rounded-full text-[10px] font-mono text-white/50 pointer-events-none">
      ZONE: <span className="text-blue-400 font-bold">{zone}</span>
    </div>
  );
};

const App = () => {
  const zone = getCurrentZone();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <DevZoneIndicator zone={zone} />
            <Routes>
              {/* Marketing Zone (opslyhr.com) */}
              <Route path="/*" element={
                <ZoneGuard allowedZone={Zone.MARKETING}>
                  <Routes>
                    <Route element={<WebsiteLayout />}>
                      <Route path="/" element={<Index />} />
                      <Route path="for-companies" element={<ForCompanies />} />
                      <Route path="for-professionals" element={<ForProfessionals />} />
                      <Route path="service-models" element={<ServiceModels />} />
                      <Route path="pricing" element={<Pricing />} />
                      <Route path="book-consultation" element={<BookConsultation />} />
                      <Route path="insights" element={<Insights />} />
                      <Route path="about" element={<About />} />
                      <Route path="careers" element={<Careers />} />
                      <Route path="direct-hire" element={<DirectHire />} />
                      <Route path="trial-to-hire" element={<TrialToHire />} />
                      <Route path="project-engagement" element={<ProjectEngagement />} />
                      <Route path="offshore-hiring" element={<OffshoreHiring />} />
                      <Route path="vetting-process" element={<VettingProcess />} />
                      <Route path="jobs" element={<PublicJobs />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </ZoneGuard>
              } />

              {/* Auth Hub Zone (app.opslyhr.com) */}
              <Route path="/*" element={
                <ZoneGuard allowedZone={Zone.AUTH}>
                  <Routes>
                    <Route index element={<Navigate to="/auth/login" replace />} />
                    <Route path="auth/login" element={<Login />} />
                    <Route path="auth/signup" element={<Signup />} />
                    <Route path="auth/check-email" element={<CheckEmail />} />
                    <Route path="auth/verify-email" element={<VerifyEmail />} />
                    <Route path="auth/admin-signup" element={<AdminSignup />} />
                    <Route path="auth/reset-password" element={<ResetPassword />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ZoneGuard>
              } />

              {/* Client Portal Zone (client.opslyhr.com) */}
              <Route path="/*" element={
                <ZoneGuard allowedZone={Zone.CLIENT} protected>
                  <Routes>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="onboarding" element={<ClientOnboarding />} />
                    <Route element={<ClientLayout />}>
                      <Route path="dashboard" element={<ClientDashboard />} />
                      <Route path="browse-talents" element={<BrowseTalents />} />
                      <Route path="browse-talents/:talentId" element={<ClientTalentProfile />} />
                      
                      {FEATURES.hire_request_v2_enabled ? (
                        <>
                          <Route path="hire-requests" element={<HireRequestsList />} />
                          <Route path="hire-requests/new" element={<CreateHireRequest />} />
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ZoneGuard>
              } />

              {/* Talent Portal Zone (talent.opslyhr.com) */}
              <Route path="/*" element={
                <ZoneGuard allowedZone={Zone.TALENT} protected>
                  <Routes>
                    <Route index element={<Navigate to="/dashboard" replace />} />
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ZoneGuard>
              } />

              {/* Admin Portal Zone (admin.opslyhr.com) */}
              <Route path="/*" element={
                <ZoneGuard allowedZone={Zone.ADMIN} protected>
                  <Routes>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route element={<AdminLayout />}>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="vetting" element={<AdminVettingQueueRouter />} />
                      <Route path="vetting/:id" element={<AdminVettingWorkspaceRouter />} />
                      <Route path="talents" element={<AdminTalentDirectory />} />
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
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </ZoneGuard>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
