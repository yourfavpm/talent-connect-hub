import { useState } from "react";
import { LogOut, Menu, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminTopbarProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

const AdminTopbar = ({ onMenuClick, onLogout }: AdminTopbarProps) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white px-4 shrink-0">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationBell variant="light" />

        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full ml-1"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary cursor-pointer hover:bg-brand-primary/20 transition-colors">
                <span className="font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-gray-900">Admin User</p>
                <p className="text-xs leading-none text-gray-500">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
               <Link to={getInternalPath("/admin/settings")} className="cursor-pointer text-gray-700">
                 <User className="mr-2 h-4 w-4" />
                 <span>My Profile</span>
               </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
               <Link to={getInternalPath("/admin/settings")} className="cursor-pointer text-gray-700">
                 <Settings className="mr-2 h-4 w-4" />
                 <span>Settings</span>
               </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AdminTopbar;
