import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ResetPassword from "./pages/auth/ResetPassword";
import ClientLayout from "./components/client/ClientLayout";
import ClientDashboard from "./pages/client/Dashboard";
import BrowseTalents from "./pages/client/BrowseTalents";
import Jobs from "./pages/client/Jobs";
import Contracts from "./pages/client/Contracts";
import Invoices from "./pages/client/Invoices";
import Team from "./pages/client/Team";
import TalentLayout from "./components/talent/TalentLayout";
import TalentOnboarding from "./pages/talent/Onboarding";
import TalentDashboard from "./pages/talent/Dashboard";
import TalentJobs from "./pages/talent/Jobs";
import TalentTeam from "./pages/talent/Team";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
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
            {/* Redirect root to client login */}
            <Route path="/" element={<Navigate to="/auth/login?portal=client" replace />} />
            
            {/* Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />

            {/* Client Portal */}
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
              <Route path="jobs" element={<TalentJobs />} />
              <Route path="team" element={<TalentTeam />} />
            </Route>

            {/* Admin Portal */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
