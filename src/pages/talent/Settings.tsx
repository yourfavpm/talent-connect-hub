import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendTalentPasswordChangedEmail } from "@/lib/email/triggers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Eye,
  EyeOff,
  Building,
  Lock,
  ChevronRight,
  Trash2,
  Cloud,
  Save,
  Loader2
} from "lucide-react";
import clsx from "clsx";

const SECTIONS = [
  { id: "profile", label: "Profile", sub: "Personal details and identity", icon: User },
  { id: "account", label: "Account", sub: "Enterprise and organizational settings", icon: Building },
  { id: "security", label: "Security", sub: "Password and access management", icon: Shield },
  { id: "notifications", label: "Notifications", sub: "Platform alerts and preferences", icon: Bell },
  { id: "payout", label: "Payment & Payout", sub: "Banking and currency setup", icon: CreditCard },
  { id: "preferences", label: "Preferences", sub: "System language and localization", icon: Sliders },
  { id: "danger", label: "Danger Zone", sub: "Irreversible account actions", icon: AlertTriangle, danger: true },
];


const TalentSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "unsaved">("idle");
  const [profileData, setProfileData] = useState({ name: "", phone: "", location: "" });

  const [showPasswords, setShowPasswords] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const [notifications, setNotifications] = useState({
    email_job_updates: true,
    email_application_status: true,
    email_timesheet_reminders: true,
    email_messages: true,
    push_notifications: true,
  });

  useEffect(() => {
    if (user) {
      setProfileData({ 
        name: user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}` : "Talent User", 
        phone: "+1 (555) 000-0000", 
        location: "New York, USA" 
      });
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
    setSaveStatus("saving");
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      
      // Trigger Email Notification
      try {
        await sendTalentPasswordChangedEmail(
          user?.email || "",
          user?.user_metadata?.first_name || "User"
        );
      } catch (emailErr) {
        console.error("Failed to send password changed email:", emailErr);
      }

      toast({ title: "Password Updated", description: "Your password has been changed successfully" });
      setPasswords({ current: "", new: "", confirm: "" });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update password";
      toast({ title: "Error", description: message, variant: "destructive" });
      setSaveStatus("unsaved");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await signOut();
      navigate("/auth/login?portal=talent");
    } catch (error) {
      toast({ title: "Error", description: "Failed to logout", variant: "destructive" });
    }
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      toast({ title: "Profile Updated", description: "Your profile has been saved successfully" });
      setTimeout(() => setSaveStatus("idle"), 3000);
    }, 1000);
  };

  const handleSaveNotifications = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      toast({ title: "Preferences Saved", description: "Your notification settings have been updated" });
      setTimeout(() => setSaveStatus("idle"), 3000);
    }, 1000);
  };

  const handleSavePreferences = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      toast({ title: "Preferences Saved", description: "Your workspace settings have been updated" });
      setTimeout(() => setSaveStatus("idle"), 3000);
    }, 1000);
  };

  // ── Layout Components ────────────────────────────────────────────────────────

  const SectionHeader = ({ title, description }: { title: string; description: string }) => (
    <div className="mb-6 md:mb-8 pb-5 border-b border-slate-50">
      <h2 className="text-[16px] md:text-[17px] font-semibold text-slate-900 tracking-tight leading-none mb-1.5">{title}</h2>
      <p className="text-[12px] md:text-[13px] text-slate-400 leading-relaxed max-w-2xl font-light">{description}</p>
    </div>
  );


  const FormSectionTitle = ({ title }: { title: string }) => (
    <div className="pt-8 pb-4">
      <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pl-0.5">{title}</h3>
    </div>
  );

  const SaveBar = ({ onSave }: { onSave: () => void }) => (
    <div className="fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[640px] px-4 md:px-6 z-50">
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-2 md:p-3 flex items-center justify-between gap-2 md:gap-4 overflow-hidden backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-2 px-2 min-w-0">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest truncate">Unsaved Changes</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
           <Button 
            variant="ghost" 
            onClick={() => window.location.reload()}
            className="h-8 md:h-9 px-3 md:px-5 text-[10px] font-medium uppercase tracking-wider text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
           >
             Discard
           </Button>
           <Button 
            onClick={onSave}
            disabled={loading}
            className="h-8 md:h-9 px-4 md:px-7 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all rounded-xl"
           >
             {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Save className="h-3 w-3 mr-1.5 md:mr-2" />}
             Save Changes
           </Button>
        </div>
      </div>
    </div>
  );


  const InputField = ({ label, readOnly, type = "text", value, onChange, placeholder }: {
    label: string;
    readOnly?: boolean;
    type?: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest px-0.5">
        {label}
      </Label>
      <div className="relative">
        <Input 
          type={type} 
          value={value} 
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className={clsx(
            "h-10 border-slate-200 rounded-lg text-[13px] font-light focus:ring-0 focus:border-slate-800 transition-all placeholder:text-slate-200",
            readOnly && "bg-slate-50/50 border-slate-100 text-slate-400 cursor-not-allowed pr-12"
          )}
        />
        {readOnly && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <span className="text-[9px] font-medium text-slate-300 uppercase tracking-tight">System</span>
            <Lock className="h-3 w-3 text-slate-200" />
          </div>
        )}
      </div>
    </div>
  );


  // ── Tab Rendering ────────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="animate-fade-in pb-24">
            <SectionHeader 
              title="Profile Settings" 
              description="Manage your personal details and visibility preferences." 
            />
            
            <div className="space-y-12">
              <div className="flex items-center gap-10 py-2">
                <Avatar className="h-24 w-24 border border-slate-100 bg-slate-50 ring-4 ring-slate-50/50">
                  <AvatarFallback className="text-xl font-bold text-slate-400">
                    {profileData.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-9 px-5 border-slate-200 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
                      Upload new
                    </Button>
                    <button className="text-[11px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors px-2">
                      Remove
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-[280px]">
                    At least 800x800px recommended. JPG or PNG is preferred.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                <div className="pb-10">
                  <FormSectionTitle title="Personal Information" />
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                    <InputField 
                      label="Full Name" 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                    />
                    <InputField 
                      label="Email Address" 
                      value={user?.email || ""} 
                      readOnly 
                    />
                  </div>
                </div>

                <div className="pt-4 pb-10">
                  <FormSectionTitle title="Contact Information" />
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                    <InputField 
                      label="Phone Number" 
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                    />
                    <InputField 
                      label="Current Location" 
                      value={profileData.location} 
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <SaveBar onSave={handleSaveProfile} />
          </div>
        );

      
      case "account":
        return (
          <div className="animate-fade-in pb-24">
            <SectionHeader 
              title="Account Details" 
              description="Core system details regarding your account identity and history." 
            />
            
            <div className="border border-slate-100 rounded-lg overflow-hidden divide-y divide-slate-100">
              <div className="px-6 py-5 flex items-center justify-between bg-slate-50/30">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-900">Talent ID</h4>
                  <p className="text-[12px] text-slate-500 mt-1">Your unique system identifier.</p>
                </div>
                <code className="bg-white border border-slate-200 px-3 py-1.5 rounded text-[11px] font-mono text-slate-600 select-all shadow-sm">
                  {user?.id || "N/A"}
                </code>
              </div>
              <div className="px-6 py-5 flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-900">Account Role</h4>
                  <p className="text-[12px] text-slate-500 mt-1">Authorized platform capability.</p>
                </div>
                <Badge className="bg-slate-900 text-white hover:bg-slate-900 border-none px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded">
                  Talent Professional
                </Badge>
              </div>
              <div className="px-6 py-5 flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-900">Creation Date</h4>
                  <p className="text-[12px] text-slate-500 mt-1">Original platform registration.</p>
                </div>
                <span className="text-[13px] font-medium text-slate-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "—"}
                </span>
              </div>
            </div>
          </div>
        );


      case "security":
        return (
          <div className="animate-fade-in pb-24">
            <SectionHeader 
              title="Authentication & Security" 
              description="Manage your security protocols and active sessions." 
            />
            
            <div className="space-y-12 divide-y divide-slate-100">
              <form onSubmit={handlePasswordChange} className="max-w-md space-y-8">
                <FormSectionTitle title="Update Password" />
                <div className="space-y-6">
                  <InputField 
                    label="Current Password" 
                    type={showPasswords ? "text" : "password"} 
                    value={passwords.current} 
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} 
                  />
                  <InputField 
                    label="New Password" 
                    type={showPasswords ? "text" : "password"} 
                    value={passwords.new} 
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} 
                  />
                  <InputField 
                    label="Confirm New Password" 
                    type={showPasswords ? "text" : "password"} 
                    value={passwords.confirm} 
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} 
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Switch checked={showPasswords} onCheckedChange={setShowPasswords} className="data-[state=checked]:bg-slate-900" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Show passwords</span>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 h-11 text-white font-bold uppercase tracking-widest text-[11px] rounded-lg shadow-sm">
                  Update Password
                </Button>
              </form>

              <div className="pt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h4 className="text-[13px] font-bold text-slate-900">Active Sessions</h4>
                  <p className="text-[12px] text-slate-500">Logs you out of all other active browser sessions immediately.</p>
                </div>
                <Button variant="outline" onClick={handleLogoutAll} className="h-10 px-6 border-slate-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold uppercase tracking-widest text-[10px] shrink-0 rounded-lg">
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Revoke All Sessions
                </Button>
              </div>
            </div>
          </div>
        );


      case "notifications":
        return (
          <div className="animate-fade-in pb-24">
            <SectionHeader 
              title="Notification Preferences" 
              description="Configure your event-driven alerts and platform communication." 
            />
            
            <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 overflow-hidden shadow-sm">
              {[
                  { key: "email_job_updates", label: "Job Alerts", description: "Receive instant notifications for new roles matching your profile." },
                  { key: "email_application_status", label: "Application Updates", description: "Get status change signals during the vetting process." },
                  { key: "email_timesheet_reminders", label: "Financial Reminders", description: "Periodic nudges to maintain accurate billing records." },
                  { key: "email_messages", label: "Platform Messages", description: "Admin and Client messaging notifications." },
                  { key: "push_notifications", label: "Browser Notifications", description: "Real-time signals while actively using the platform." },
              ].map((item) => (
                <div key={item.key} className="px-7 py-6 flex items-center justify-between gap-8 hover:bg-slate-50/50 transition-colors">
                  <div className="max-w-md space-y-1">
                    <h4 className="text-[13px] font-bold text-slate-900">{item.label}</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                    className="data-[state=checked]:bg-slate-900 scale-90"
                  />
                </div>
              ))}
            </div>
            
            <SaveBar onSave={handleSaveNotifications} />
          </div>
        );

      
      case "payout":
        return (
          <div className="animate-fade-in pb-24">
            <SectionHeader 
              title="Finance & Payouts" 
              description="Manage your verified banking details and payout schedule." 
            />
            
            <div className="space-y-6">
              <div className="border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50/20">
                <div className="flex items-center gap-6">
                  <div className="h-12 w-20 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                    <CreditCard className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[13px] font-bold text-slate-900">Chase Bank Checking</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-mono text-slate-500 tracking-wider">**** **** 4812</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Primary Method</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="h-10 px-5 border-slate-200 text-[10px] font-bold uppercase tracking-widest hover:bg-white shadow-sm rounded-lg">
                  Switch Account
                </Button>
              </div>
              <p className="text-[11px] text-slate-400 italic px-1">
                Payout methods are locked for 24 hours after modification for security purposes.
              </p>
            </div>
          </div>
        );


      case "preferences":
        return (
          <div className="animate-fade-in pb-24">
            <SectionHeader 
              title="System Preferences" 
              description="Customize your localization and interface language." 
            />
            
            <div className="space-y-12">
              <div className="grid sm:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Timezone</Label>
                  <Select defaultValue="est">
                    <SelectTrigger className="h-12 border-slate-200 rounded-lg focus:ring-0 focus:border-slate-900 text-[13px]">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="est" className="text-[13px]">Eastern Time (US & Canada)</SelectItem>
                      <SelectItem value="cst" className="text-[13px]">Central Time (US & Canada)</SelectItem>
                      <SelectItem value="pst" className="text-[13px]">Pacific Time (US & Canada)</SelectItem>
                      <SelectItem value="gmt" className="text-[13px]">Greenwich Mean Time (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">System Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="h-12 border-slate-200 rounded-lg focus:ring-0 focus:border-slate-900 text-[13px]">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en" className="text-[13px]">English (Professional)</SelectItem>
                      <SelectItem value="es" className="text-[13px]">Español</SelectItem>
                      <SelectItem value="fr" className="text-[13px]">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <SaveBar onSave={handleSavePreferences} />
          </div>
        );


      case "danger":
        return (
          <div className="animate-fade-in pb-24">
            <SectionHeader 
              title="Danger Zone" 
              description="Irreversible actions regarding your professional data and account access." 
            />
            
            <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 overflow-hidden bg-white shadow-sm">
              <div className="px-7 py-7 border-l-2 border-l-red-100 flex items-center justify-between gap-8 group">
                <div className="flex-1 space-y-1">
                  <h4 className="text-[13px] font-bold text-slate-900">Deactivate Account</h4>
                  <p className="text-[12px] text-slate-500 leading-relaxed">Temporarily disable your profile visibility and freeze pending applications.</p>
                </div>
                <button className="h-10 px-6 rounded-lg border border-red-100 text-red-500 font-bold uppercase tracking-widest text-[10px] hover:bg-red-50/50 transition-all">
                  Deactivate
                </button>
              </div>
              <div className="px-7 py-7 border-l-2 border-l-red-500 flex items-center justify-between gap-8 group">
                <div className="flex-1 space-y-1">
                  <h4 className="text-[13px] font-bold text-red-600">Delete Professional Account</h4>
                  <p className="text-[12px] text-slate-500 leading-relaxed">Permanently erase all work history, identity documents, and credentials. Cannot be undone.</p>
                </div>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 h-10 px-7 font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-md shadow-red-100 border-none transition-all">
                  Request Deletion
                </Button>
              </div>
            </div>
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto min-h-[calc(100vh-120px)] px-4 sm:px-6">
      
      {/* ── Page Header (Mobile Only) ───────────────── */}
      <div className="mb-8 block md:hidden">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-[14px] text-slate-500 mt-1">Manage your platform preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-16 items-start">
        
        {/* ── MIDDLE COLUMN: Settings Navigation ─────────────────────────── */}
        <aside className="w-full md:w-[280px] shrink-0 sticky top-10 self-start z-10">
          
          {/* Mobile Horizontal Scroll Tabs */}
          <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-4 scrollbar-none border-b border-slate-100 mb-8 -mx-4 px-4">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={clsx(
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border",
                  activeTab === section.id 
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "text-slate-500 hover:bg-slate-50 border-slate-100"
                )}
              >
                <section.icon className="h-3.5 w-3.5" />
                {section.label}
              </button>
            ))}
          </div>

          {/* Desktop Vertical Structured Navigation */}
          <nav className="hidden md:flex flex-col gap-1.5 p-1 bg-white border border-slate-100 rounded-2xl">
             {SECTIONS.map((section) => (
                <button
                   key={section.id}
                   onClick={() => setActiveTab(section.id)}
                   className={clsx(
                      "group flex flex-col items-start px-5 py-4 transition-all relative rounded-xl text-left",
                      activeTab === section.id 
                         ? "bg-slate-50/80 border border-slate-100 shadow-sm" 
                         : "hover:bg-slate-50/50 border border-transparent"
                   )}
                >
                   {/* Left Indicator Bar */}
                   {activeTab === section.id && (
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[2px] bg-slate-900 rounded-r" />
                   )}
                   
                   <div className="flex items-center gap-3.5 mb-1">
                      <section.icon className={clsx(
                        "h-[16px] w-[16px] transition-colors",
                        activeTab === section.id ? "text-slate-900" : "text-slate-400 group-hover:text-slate-500"
                      )} />
                      <span className={clsx(
                        "text-[14px] transition-colors leading-none",
                        activeTab === section.id ? "font-bold text-slate-900" : "font-semibold text-slate-500 group-hover:text-slate-700"
                      )}>{section.label}</span>
                   </div>
                   
                   {section.sub && (
                     <span className={clsx(
                       "text-[11px] pl-[30px] transition-colors line-clamp-1",
                       activeTab === section.id ? "text-slate-500 font-medium" : "text-slate-400 group-hover:text-slate-500 font-normal"
                     )}>
                       {section.sub}
                     </span>
                   )}
                </button>
             ))}
          </nav>
        </aside>

        {/* ── RIGHT COLUMN: Content Panel ───────────────────────────────── */}
        <main className="flex-1 w-full max-w-[720px] min-w-0 bg-white border border-slate-100 rounded-2xl p-4 md:p-8 shadow-sm">
           {renderContent()}
        </main>


      </div>
    </div>
  );
};


export default TalentSettings;
