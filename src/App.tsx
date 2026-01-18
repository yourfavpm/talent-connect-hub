import { Toaster } from "@/components/ui/toaster";
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
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import AdminSignup from "./pages/auth/AdminSignup";
import ResetPassword from "./pages/auth/ResetPassword";
import ClientLayout from "./components/client/ClientLayout";
import ClientOnboarding from "./pages/client/Onboarding";
import ClientDashboard from "./pages/client/Dashboard";
import BrowseTalents from "./pages/client/BrowseTalents";
import Jobs from "./pages/client/Jobs";
import ClientJobDetail from "./pages/client/JobDetail";
import Contracts from "./pages/client/Contracts";
import Invoices from "./pages/client/Invoices";
import ClientPayments from "./pages/client/Payments";
import ClientTimesheets from "./pages/client/Timesheets";
import Team from "./pages/client/Team";
import ClientSupport from "./pages/client/Support";

import TalentLayout from "./components/talent/TalentLayout";
import TalentOnboarding from "./pages/talent/Onboarding";
import TalentDashboard from "./pages/talent/Dashboard";
import TalentProfile from "./pages/talent/Profile";
import TalentJobs from "./pages/talent/Jobs";
import TalentContracts from "./pages/talent/Contracts";
import TalentOffers from "./pages/talent/Offers";
import TalentJobDetail from "./pages/talent/JobDetail";
import TalentApplications from "./pages/talent/Applications";
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
import AdminClients from "./pages/admin/Clients";
import AdminJobs from "./pages/admin/Jobs";
import AdminJobDetail from "./pages/admin/JobDetail";
import AdminOffers from "./pages/admin/Offers";
import AdminContracts from "./pages/admin/Contracts";
import AdminInvoices from "./pages/admin/Invoices";
import AdminSupport from "./pages/admin/Support";
import AdminTeam from "./pages/admin/Team";
import AdminSettings from "./pages/admin/Settings";
import AdminConsultations from "./pages/admin/Consultations";
import AdminOfferConfig from "./pages/admin/OfferConfiguration";
import AgreementTemplates from "./pages/admin/AgreementTemplates";
import AdminTimesheets from "./pages/admin/Timesheets";
import AdminPayments from "./pages/admin/Payments";
import PublicJobs from "./pages/PublicJobs";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Website Routes */}
            <Route element={<WebsiteLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/for-companies" element={<ForCompanies />} />
              <Route path="/for-professionals" element={<ForProfessionals />} />
              <Route path="/service-models" element={<ServiceModels />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/book-consultation" element={<BookConsultation />} />
              <Route path="/insights" element={<Insights />} />
            </Route>

            {/* Public Jobs Page (no auth required) */}
            <Route path="/jobs" element={<PublicJobs />} />

            {/* Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/admin-signup" element={<AdminSignup />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />

            {/* Client Portal */}
            <Route path="/client/onboarding" element={<ClientOnboarding />} />
            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="browse-talents" element={<BrowseTalents />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="jobs/:id" element={<ClientJobDetail />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="timesheets" element={<ClientTimesheets />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="payments" element={<ClientPayments />} />
              <Route path="team" element={<Team />} />
              <Route path="support" element={<ClientSupport />} />
            </Route>

            {/* Talent Portal */}
            <Route path="/talent" element={<TalentLayout />}>
              <Route path="onboarding" element={<TalentOnboarding />} />
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TalentDashboard />} />
              <Route path="profile" element={<TalentProfile />} />
              <Route path="jobs" element={<TalentJobs />} />
              <Route path="jobs/:id" element={<TalentJobDetail />} />
              <Route path="offers" element={<TalentOffers />} />
              <Route path="applications" element={<TalentApplications />} />
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

            {/* Admin Portal */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="talents" element={<AdminTalents />} />
              <Route path="talents/:id" element={<AdminTalentDetail />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="jobs/:id" element={<AdminJobDetail />} />
              <Route path="offers" element={<AdminOffers />} />
              <Route path="offers/:offerId/configure" element={<AdminOfferConfig />} />
              <Route path="legal/agreements" element={<AgreementTemplates />} />
              <Route path="contracts" element={<AdminContracts />} />
              <Route path="invoices" element={<AdminInvoices />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="timesheets" element={<AdminTimesheets />} />
              <Route path="consultations" element={<AdminConsultations />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes >
        </BrowserRouter >
      </TooltipProvider >
    </AuthProvider >
  </QueryClientProvider >
);

export default App;
