import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
    Building2, 
    CreditCard, 
    FileText, 
    Banknote, 
    GitBranch, 
    Bell, 
    ShieldCheck, 
    Palette, 
    Puzzle, 
    Database, 
    History 
} from "lucide-react";

const categories = [
    { name: "Organization", icon: Building2, path: "organization", group: "Organization" },
    { name: "Service Models", icon: GitBranch, path: "service-models", group: "Service Models & Pricing" },
    { name: "Contracts", icon: FileText, path: "contracts", group: "Contracts & Agreements" },
    { name: "Finance", icon: Banknote, path: "finance", group: "Finance & Payouts" },
    { name: "Workflows", icon: GitBranch, path: "workflows", group: "Workflows" },
    { name: "Notifications", icon: Bell, path: "notifications", group: "Notifications" },
    { name: "Security", icon: ShieldCheck, path: "security", group: "Security & Access" },
    { name: "Branding", icon: Palette, path: "branding", group: "Branding" },
    { name: "Integrations", icon: Puzzle, path: "integrations", group: "Integrations" },
    { name: "Data", icon: Database, path: "data", group: "Data & Compliance" },
    { name: "Audit Logs", icon: History, path: "audit", group: "Audit Logs" },
];

const SettingsSidebar = () => {
    // Group categories
    const groups = Array.from(new Set(categories.map(c => c.group)));

    return (
        <div className="w-64 flex-shrink-0 space-y-8 pr-8 border-r border-gray-100 min-h-[calc(100vh-12rem)]">
            {groups.map((group) => (
                <div key={group} className="space-y-2">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">
                        {group}
                    </h3>
                    <div className="space-y-1">
                        {categories
                            .filter(c => c.group === group)
                            .map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
                                        isActive 
                                            ? "bg-gray-100 text-gray-900 shadow-sm" 
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    <span>{item.name}</span>
                                </NavLink>
                            ))
                        }
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SettingsSidebar;
