import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import AdminSignup from "./pages/auth/AdminSignup";
import ResetPassword from "./pages/auth/ResetPassword";
import ClientLayout from "./components/client/ClientLayout";
import ClientOnboarding from "./pages/client/Onboarding";
import ClientDashboard from "./pages/client/Dashboard";
import BrowseTalents from "./pages/client/BrowseTalents";
import Jobs from "./pages/client/Jobs";
import Contracts from "./pages/client/Contracts";
import Invoices from "./pages/client/Invoices";
import Team from "./pages/client/Team";
import TalentLayout from "./components/talent/TalentLayout";
import TalentOnboarding from "./pages/talent/Onboarding";
import TalentDashboard from "./pages/talent/Dashboard";
import TalentProfile from "./pages/talent/Profile";
import TalentJobs from "./pages/talent/Jobs";
import TalentTeam from "./pages/talent/Team";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminTalents from "./pages/admin/Talents";
import AdminTalentDetail from "./pages/admin/TalentDetail";
import AdminClients from "./pages/admin/Clients";
import AdminJobs from "./pages/admin/Jobs";
import AdminOffers from "./pages/admin/Offers";
import AdminContracts from "./pages/admin/Contracts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/auth/login?portal=client" replace />} />
            
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
              <Route path="talents" element={<BrowseTalents />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="team" element={<Team />} />
            </Route>

            {/* Talent Portal */}
            <Route path="/talent/onboarding" element={<TalentOnboarding />} />
            <Route path="/talent" element={<TalentLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TalentDashboard />} />
              <Route path="profile" element={<TalentProfile />} />
              <Route path="jobs" element={<TalentJobs />} />
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
              <Route path="offers" element={<AdminOffers />} />
              <Route path="contracts" element={<AdminContracts />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
