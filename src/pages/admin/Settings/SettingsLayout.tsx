import { Outlet } from "react-router-dom";
import SettingsSidebar from "./SettingsSidebar";

const SettingsLayout = () => {
    return (
        <div className="space-y-6 animate-fade-in bg-white p-8 -m-8 rounded-lg min-h-screen">
            <div className="flex justify-between items-center border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings Console</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Configure OpslyHR Connect operational defaults, service models, and platform security.
                    </p>
                </div>
            </div>

            <div className="flex gap-8 pt-4">
                <SettingsSidebar />
                <main className="flex-1 max-w-4xl">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SettingsLayout;
