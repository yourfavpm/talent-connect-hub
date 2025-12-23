import { Outlet } from "react-router-dom";
import TalentSidebar from "./TalentSidebar";
import ProtectedRoute from "@/components/ProtectedRoute";

const TalentLayout = () => {
  return (
    <ProtectedRoute portalType="talent" allowedRoles={["talent"]}>
      <div className="flex min-h-screen bg-background">
        <TalentSidebar />
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TalentLayout;
