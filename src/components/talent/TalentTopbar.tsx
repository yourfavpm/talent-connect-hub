import { Menu, Search, HelpCircle, ChevronRight, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import { useLocation, Link } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

interface TalentTopbarProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

const TalentTopbar = ({ onMenuClick, onLogout }: TalentTopbarProps) => {
  const location = useLocation();
  const { user } = useAuth();

  // Generate a simple breadcrumb based on path
  const pathnames = location.pathname.split('/').filter((x) => x);
  const breadcrumb = pathnames[1] ? pathnames[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shrink-0 transition-all duration-300">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden text-gray-500 hover:text-gray-900 focus-visible:ring-0"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        
        <div className="hidden md:flex items-center text-sm font-medium text-gray-500">
          <span className="opacity-70">Talent</span>
          <ChevronRight className="h-4 w-4 mx-1 opacity-50" />
          <span className="text-gray-900">{breadcrumb}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Optional Search */}
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="h-8 w-64 rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition-colors focus:border-gray-300 focus:bg-white focus:ring-1 focus:ring-gray-200"
          />
        </div>

        <Link to={getInternalPath("/talent/support")} className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <HelpCircle className="h-4.5 w-4.5" />
        </Link>

        <div className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center transition-colors">
          <NotificationBell variant="light" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full focus-visible:ring-0 p-0 border border-gray-200">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={user?.email || "Avatar"} />
                <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-medium">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal text-gray-500">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-gray-900">{user?.email}</p>
                <p className="text-xs leading-none text-gray-500">Talent Account</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-gray-50 focus:text-gray-900 text-gray-600">
              <Link to={getInternalPath("/talent/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-gray-50 focus:text-gray-900 text-gray-600">
              <Link to={getInternalPath("/talent/support")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Support Tickets</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer focus:bg-red-50 focus:text-red-700 text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TalentTopbar;
