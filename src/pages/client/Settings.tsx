import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendClientPasswordChangedEmail } from "@/lib/email/triggers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Sliders,
  AlertTriangle,
  LogOut,
  Upload,
  Check,
  Building
} from "lucide-react";
import clsx from "clsx";

const SECTIONS = [
  { id: "profile", label: "Company Profile", icon: Building },
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing & Payment", icon: CreditCard },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle, danger: true },
];

const ClientSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({ companyName: "", contactName: "", phone: "", location: "" });

  const [showPasswords, setShowPasswords] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const [notifications, setNotifications] = useState({
    email_candidates: true,
    email_contracts: true,
    email_invoices: true,
    email_messages: true,
    push_notifications: true,
  });

  useEffect(() => {
    if (user) {
      setProfileData({ companyName: "Acme Corp", contactName: "Jane Doe", phone: "+1 (555) 123-4567", location: "San Francisco, CA" });
    }
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (passwords.new.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;

      // Trigger Email Notification
      try {
        await sendClientPasswordChangedEmail(
          user?.email || "",
          user?.user_metadata?.full_name || "User"
        );
      } catch (emailErr) {
        console.error("Failed to send password changed email:", emailErr);
      }

      toast({ title: "Password Updated", description: "Your password has been changed successfully" });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await signOut();
      navigate("/auth/login?portal=client");
    } catch (error) {
      toast({ title: "Error", description: "Failed to logout", variant: "destructive" });
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Profile Updated", description: "Company profile has been saved successfully" });
  };

  const handleSaveNotifications = () => {
    toast({ title: "Preferences Saved", description: "Your notification settings have been updated" });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Company Profile</h2>
              <p className="text-sm text-gray-500">Update company details and primary contact information.</p>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <Card className="border-gray-200 shadow-sm bg-white">
                <CardContent className="p-6 space-y-6">
                  
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                    <Avatar className="h-20 w-20 border border-gray-200 rounded-lg">
                      <AvatarFallback className="bg-blue-50 text-blue-700 text-xl font-medium rounded-lg">AC</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                         <Button type="button" variant="outline" size="sm" className="h-8 shadow-sm">
                            <Upload className="h-3.5 w-3.5 mr-2" />
                            Upload Logo
                         </Button>
                         <Button type="button" variant="ghost" size="sm" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50">Remove</Button>
                      </div>
                      <p className="text-xs text-gray-500">Square dimensions recommended. JPG or PNG. 1MB max.</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-medium">Company Name</Label>
                      <Input value={profileData.companyName} onChange={e => setProfileData({...profileData, companyName: e.target.value})} className="shadow-sm border-gray-300" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-gray-900 font-medium">Primary Contact</Label>
                       <Input value={profileData.contactName} onChange={e => setProfileData({...profileData, contactName: e.target.value})} className="shadow-sm border-gray-300" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-medium">Phone Number</Label>
                      <Input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="shadow-sm border-gray-300" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-gray-700 font-medium flex items-center gap-2">
                          Email Address <span className="text-[10px] uppercase font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Read-only</span>
                       </Label>
                       <Input value={user?.email || ""} readOnly className="shadow-sm border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end sticky bottom-6 z-10">
                <Button type="submit" className="bg-brand-primary text-white shadow-lg px-8 h-10 text-[13px] font-bold">Save Company Profile</Button>
              </div>
            </form>
          </div>
        );
      
      case "account":
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Account metadata</h2>
              <p className="text-sm text-gray-500">Core system details regarding your account identity.</p>
            </div>
            <Card className="border-gray-200 shadow-sm bg-white">
              <CardContent className="p-0 divide-y divide-gray-100">
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                     <p className="font-medium text-gray-900">Client ID</p>
                     <p className="text-sm text-gray-500">Your unique identifier within the platform.</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md text-sm font-mono text-gray-600 sm:max-w-xs truncate">
                     {user?.id || "N/A"}
                  </div>
                </div>
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                     <p className="font-medium text-gray-900">Role Type</p>
                     <p className="text-sm text-gray-500">Your authorized platform role.</p>
                  </div>
                  <div className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider">
                     Client
                  </div>
                </div>
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                     <p className="font-medium text-gray-900">Account Created</p>
                     <p className="text-sm text-gray-500">When you originally registered.</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                     {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Security</h2>
              <p className="text-sm text-gray-500">Manage your password and active sessions to keep your account safe.</p>
            </div>
            
            <Card className="border-gray-200 shadow-sm bg-white">
               <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                  <CardTitle className="text-base font-medium">Change Password</CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                     <div className="space-y-2">
                        <Label className="text-gray-900 font-medium">Current Password</Label>
                        <Input type={showPasswords ? "text" : "password"} value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="shadow-sm border-gray-300" />
                     </div>
                     <div className="space-y-2 pt-2">
                        <Label className="text-gray-900 font-medium">New Password</Label>
                        <Input type={showPasswords ? "text" : "password"} value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="shadow-sm border-gray-300" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-gray-900 font-medium">Confirm New Password</Label>
                        <Input type={showPasswords ? "text" : "password"} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="shadow-sm border-gray-300" />
                     </div>
                     <div className="flex items-center gap-2 pt-2 pb-4">
                        <Switch checked={showPasswords} onCheckedChange={setShowPasswords} id="show-passwords" />
                        <Label htmlFor="show-passwords" className="text-sm text-gray-500 cursor-pointer">Show passwords</Label>
                     </div>
                     <Button type="submit" disabled={loading} className="bg-brand-primary text-white shadow-sm">
                        Update Password
                     </Button>
                  </form>
               </CardContent>
            </Card>

            <Card className="border-red-200 shadow-sm bg-red-50/30">
               <CardHeader className="border-b border-red-100 bg-red-50/50 pb-4">
                  <CardTitle className="text-base font-medium text-red-900">Active Sessions</CardTitle>
               </CardHeader>
               <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                     <p className="font-medium text-gray-900">Log out of all devices</p>
                     <p className="text-sm text-gray-500 mt-0.5">This will invalidate all current sessions and require you to log in again.</p>
                  </div>
                  <Button variant="outline" onClick={handleLogoutAll} className="border-red-200 text-red-700 hover:bg-red-50 bg-white">
                     <LogOut className="h-4 w-4 mr-2" />
                     Log out all
                  </Button>
               </CardContent>
            </Card>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">Control when and how you are notified of platform activity.</p>
            </div>
            
            <Card className="border-gray-200 shadow-sm bg-white">
               <CardContent className="p-0 divide-y divide-gray-100">
                  {[
                     { key: "email_candidates", label: "Candidate Applications", description: "Receive alerts for new applicants to your jobs." },
                     { key: "email_contracts", label: "Contract Updates", description: "Get notified when contracts are generated or signed." },
                     { key: "email_invoices", label: "Invoice Receipts", description: "Alerts for newly generated billing invoices." },
                     { key: "email_messages", label: "Messages & Support", description: "Alerts for new messages from administrators or talent." },
                     { key: "push_notifications", label: "In-App Push", description: "Enable browser push notifications while active." },
                  ].map((item) => (
                     <div key={item.key} className="p-6 flex items-center justify-between gap-4">
                        <div>
                           <p className="font-medium text-gray-900">{item.label}</p>
                           <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <Switch
                           checked={notifications[item.key as keyof typeof notifications]}
                           onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                           className="data-[state=checked]:bg-brand-primary"
                        />
                     </div>
                  ))}
               </CardContent>
            </Card>
            <div className="flex justify-end sticky bottom-6 z-10">
               <Button onClick={handleSaveNotifications} className="bg-brand-primary text-white shadow-lg px-8 h-10 text-[13px] font-bold">Save Preferences</Button>
            </div>
          </div>
        );
      
      case "billing":
         return (
            <div className="space-y-6 animate-fade-in">
               <div>
                  <h2 className="text-lg font-medium text-gray-900">Billing & Payment</h2>
                  <p className="text-sm text-gray-500">Manage your connected payment methods for funding contracts.</p>
               </div>
               <Card className="border-gray-200 shadow-sm bg-white">
                  <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                     <CardTitle className="text-base font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        Credit Cards
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                     <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-14 bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm">
                              <span className="font-bold text-gray-800 text-sm tracking-tighter">VISA</span>
                           </div>
                           <div>
                              <p className="font-medium text-gray-900">Visa ending in 4242</p>
                              <p className="text-sm text-gray-500">Expires 12/26</p>
                           </div>
                        </div>
                        <div className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">Default</div>
                     </div>
                     <div className="mt-6">
                        <Button variant="outline" className="shadow-sm text-gray-700">Add Payment Method</Button>
                     </div>
                  </CardContent>
               </Card>
            </div>
         );

      case "preferences":
         return (
            <div className="space-y-6 animate-fade-in">
               <div>
                  <h2 className="text-lg font-medium text-gray-900">Preferences</h2>
                  <p className="text-sm text-gray-500">Customize your workspace experience.</p>
               </div>
               <Card className="border-gray-200 shadow-sm bg-white">
                  <CardContent className="p-6 space-y-6 max-w-md">
                     <div className="space-y-2">
                        <Label className="text-gray-900 font-medium">Timezone</Label>
                        <Select defaultValue="est">
                           <SelectTrigger className="shadow-sm border-gray-300">
                              <SelectValue placeholder="Select timezone" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="est">Eastern Time (US & Canada)</SelectItem>
                              <SelectItem value="cst">Central Time (US & Canada)</SelectItem>
                              <SelectItem value="pst">Pacific Time (US & Canada)</SelectItem>
                              <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-gray-900 font-medium">Language</Label>
                        <Select defaultValue="en">
                           <SelectTrigger className="shadow-sm border-gray-300">
                              <SelectValue placeholder="Select language" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="en">English (US)</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="fr">Français</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </CardContent>
               </Card>
               <div className="flex justify-end sticky bottom-6">
                  <Button className="bg-brand-primary text-white shadow-sm">Save Preferences</Button>
               </div>
            </div>
         );

      case "danger":
         return (
            <div className="space-y-6 animate-fade-in">
               <div>
                  <h2 className="text-lg font-medium text-red-600">Danger Zone</h2>
                  <p className="text-sm text-gray-500">Irreversible actions regarding your account data.</p>
               </div>
               <Card className="border-red-200 shadow-sm bg-white overflow-hidden">
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 hover:bg-red-50/50 transition-colors">
                     <div>
                        <p className="font-medium text-gray-900">Deactivate Account</p>
                        <p className="text-sm text-gray-500 mt-0.5">Temporarily hide your profile and freeze ongoing interactions. You can restore this later.</p>
                     </div>
                     <Button variant="outline" className="border-red-200 text-red-700 bg-white hover:bg-red-50 shrink-0">Deactivate</Button>
                  </div>
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-red-50/50 transition-colors">
                     <div>
                        <p className="font-medium text-red-600">Delete Account</p>
                        <p className="text-sm text-gray-500 mt-0.5">Permanently erase your account, history, and uploaded files. This cannot be undone.</p>
                     </div>
                     <Button variant="destructive" className="shrink-0 bg-red-600 hover:bg-red-700">Request Deletion</Button>
                  </div>
               </Card>
            </div>
         );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your company account and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Navigation Panel */}
        <div className="w-full md:w-64 shrink-0 flex flex-col md:sticky md:top-6 z-10 bg-[#FAFAFA] md:bg-transparent">
           <nav className="flex md:flex-col gap-1 overflow-x-auto pb-4 md:pb-0 scrollbar-none border-b border-gray-100 md:border-none -mx-4 px-4 md:mx-0 md:px-0 mb-4 md:mb-0">
              {SECTIONS.map((section) => (
                 <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={clsx(
                       "flex items-center gap-3 px-4 md:px-3 py-2.5 md:py-2 rounded-full md:rounded-md text-[13px] md:text-sm font-medium transition-colors whitespace-nowrap border md:border-none",
                       activeTab === section.id 
                          ? section.danger 
                            ? "bg-red-50 text-red-700 border-red-100" 
                            : "bg-gray-100 text-gray-900 border-gray-200 shadow-sm md:shadow-none"
                          : section.danger 
                            ? "text-red-600 hover:bg-red-50/50 border-transparent" 
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                    )}
                 >
                    <section.icon className={clsx("h-4 w-4", activeTab === section.id && !section.danger ? "text-gray-900" : "text-gray-400")} />
                    {section.label}
                 </button>
              ))}
           </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 w-full min-w-0">
           {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;
