import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sendClientEmailVerifiedEmail } from "@/lib/email/triggers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Briefcase,
  Users,
  Clock,
  FileText,
  Copy,
  Inbox,
  HelpCircle,
} from "lucide-react";
import { getInternalPath } from "@/utils/subdomain";
import { cn } from "@/lib/utils";

const ClientDashboard = () => {
  const [client, setClient] = useState<any>(null);
  const [baseProfile, setBaseProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    activeJobs: 0,
    pendingRequests: 0,
    talentsHired: 0,
    pendingOffers: 0,
    outstandingInvoices: 0,
    activeMembers: 0,
    pendingTimesheets: 0,
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [shortlistedTalents, setShortlistedTalents] = useState<any[]>([]);
  const [activeContracts, setActiveContracts] = useState<any[]>([]);
  const verificationTriggered = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        setUser(authData.user);

        const { data: clientData } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (clientData) {
          setClient(clientData);
        }

        const { data: profileData } = await (supabase
          .from("profiles" as any)
          .select("*")
          .eq("user_id", authData.user.id)
          .maybeSingle() as any);
        
        if (profileData) {
          setBaseProfile(profileData);
        }

        // Fetch Stats - Using hr_v2 system and legacy tables
        // Note: For invoices and offers, we need the clientData.id (the UUID from clients table, not user_id)
        const queries: any[] = [
          supabase.from("hr_v2_hire_requests").select("*", { count: "exact", head: true }).eq("client_user_id", authData.user.id).eq("status", "published"),
          supabase.from("hr_v2_hire_requests").select("*", { count: "exact", head: true }).eq("client_user_id", authData.user.id).in("status", ["submitted", "admin_review", "approved"]),
          supabase.from("hr_v2_hires").select("*", { count: "exact", head: true }).eq("client_user_id", authData.user.id),
        ];

        // Only add client-specific queries if we actually found a client record
        if (clientData) {
          queries.push(supabase.from("invoices").select("*", { count: "exact", head: true }).eq("client_id", clientData.id).neq("status", "paid"));
          queries.push(supabase.from("offers").select("*", { count: "exact", head: true }).eq("client_id", clientData.id).eq("status", "pending"));
          queries.push(supabase.from("client_members").select("*", { count: "exact", head: true }).eq("client_id", clientData.id).eq("status", "active"));
          queries.push(supabase.from("timesheets").select("*, contracts!inner(client_id)", { count: "exact", head: true }).eq("contracts.client_id", clientData.id).eq("status", "submitted"));
        } else {
          // Push dummy empty results if no client record
          queries.push(Promise.resolve({ count: 0 }));
          queries.push(Promise.resolve({ count: 0 }));
          queries.push(Promise.resolve({ count: 0 }));
          queries.push(Promise.resolve({ count: 0 }));
        }

        const [
          { count: activeJobs },
          { count: pendingRequests },
          { count: hiredTalents },
          { count: outstandingInvoices },
          { count: pendingOffers },
          { count: activeMembers },
          { count: pendingTimesheets }
        ] = await Promise.all(queries);

        setStatsData({
          activeJobs: activeJobs || 0,
          pendingRequests: pendingRequests || 0,
          talentsHired: hiredTalents || 0,
          outstandingInvoices: outstandingInvoices || 0,
          pendingOffers: pendingOffers || 0,
          activeMembers: (activeMembers || 0) + 1, // +1 for the owner
          pendingTimesheets: pendingTimesheets || 0,
        });

        // Fetch recent jobs
        const { data: jobs } = await supabase
          .from("hr_v2_hire_requests")
          .select("id, title, status, created_at, service_model")
          .eq("client_user_id", authData.user.id)
          .order("created_at", { ascending: false })
          .limit(3);
        setRecentJobs(jobs || []);

        if (clientData) {
          // Fetch active contracts
          const { data: contracts } = await supabase
            .from("contracts")
            .select("id, role_title, status, talents(first_name, last_name)")
            .eq("client_id", clientData.id)
            .eq("status", "active")
            .limit(3);
          setActiveContracts(contracts || []);

          // Fetch shortlisted talents
          const { data: shortlists } = await supabase
            .from("hr_v2_shortlists")
            .select("id, talent_user_id, status, created_at, hr_v2_hire_requests!inner(title, client_user_id)")
            .eq("hr_v2_hire_requests.client_user_id", authData.user.id)
            .order("created_at", { ascending: false })
            .limit(3);
            
          if (shortlists && shortlists.length > 0) {
            const talentIds = shortlists.map(s => s.talent_user_id);
            const { data: profiles } = await supabase
              .from("profiles")
              .select("user_id, first_name, last_name, avatar_url")
              .in("user_id", talentIds);
              
            const enriched = shortlists.map(s => ({
              ...s,
              profile: profiles?.find(p => p.user_id === s.talent_user_id)
            }));
            setShortlistedTalents(enriched);
          } else {
            setShortlistedTalents([]);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const triggerVerificationSuccess = async () => {
      if (verificationTriggered.current) return;
      
      // Check if user is verified but we haven't sent the success email
      if (user?.email_confirmed_at && baseProfile && !baseProfile.email_verified_sent) {
        verificationTriggered.current = true;
        try {
          console.log("Triggering client verification success email...");
          await sendClientEmailVerifiedEmail(
            user.email || "",
            client?.company_name || user.user_metadata?.full_name || "Client"
          );
          
          // Mark as sent in DB
          await (supabase
            .from('profiles' as any)
            .update({ email_verified_sent: true } as any)
            .eq('user_id', user.id) as any);
            
        } catch (err) {
          console.error("Failed to send verification success email:", err);
          verificationTriggered.current = false;
        }
      }
    };

    if (user && baseProfile && client) {
      triggerVerificationSuccess();
    }
  }, [user, baseProfile, client]);

  const copyToClipboard = () => {
    if (client?.client_id) {
      navigator.clipboard.writeText(client.client_id);
      toast({
        title: "Copied to clipboard",
        description: "Your Client ID has been copied.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        <p className="text-sm font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const stats = [
    { label: "Active Team", value: statsData.activeMembers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Talents Hired", value: statsData.talentsHired, icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending Timesheets", value: statsData.pendingTimesheets, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Outstanding Invoices", value: statsData.outstandingInvoices, icon: FileText, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="w-full max-w-none space-y-6 font-sans">
      
      {/* 1. Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium text-gray-900">
            Welcome back, {client?.company_name || "Partner"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={getInternalPath("/client/team-members")}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Users className="mr-2 h-4 w-4" />
              Invite Team
            </Button>
          </Link>
          <Link to={getInternalPath("/client/jobs")}>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Post Job
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-4 flex flex-col justify-between h-28 border border-gray-200 shadow-sm rounded-xl bg-white hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-sm font-medium">{stat.label}</span>
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (Left) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 3. Active Engagements Section */}
          <Card className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900">Active Contracts</h2>
            </div>
            {activeContracts.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="bg-gray-50 h-10 w-10 rounded-full flex items-center justify-center mb-3">
                  <Inbox className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No active contracts yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activeContracts.map((contract) => (
                  <div key={contract.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-medium text-sm text-gray-900">{contract.role_title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Talent: {contract.talents?.first_name} {contract.talents?.last_name}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-normal capitalize">
                      {contract.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 4. Recent Jobs Section */}
          <Card className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900">Recent Job Posts</h2>
              <Link to={getInternalPath("/client/jobs")}>
                <Button variant="ghost" size="sm" className="h-8 text-gray-500 hover:text-gray-900 text-xs font-medium">
                  View All Jobs
                </Button>
              </Link>
            </div>
            {recentJobs.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="bg-gray-50 h-10 w-10 rounded-full flex items-center justify-center mb-3">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No recent job posts.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentJobs.map((job) => (
                  <div key={job.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <Link to={getInternalPath(`/client/jobs/${job.id}`)} className="font-medium text-sm text-brand-primary hover:underline">
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="capitalize">{job.service_model?.replace(/_/g, " ")}</span>
                        <span>•</span>
                        <span>{new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 font-normal capitalize">
                      {job.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 5. Shortlisted Talents */}
          <Card className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-medium text-gray-900">Recently Shortlisted</h2>
            </div>
            {shortlistedTalents.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="bg-blue-50 h-10 w-10 rounded-full flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-sm text-gray-500">No talents shortlisted yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {shortlistedTalents.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                        {item.profile?.avatar_url ? (
                          <img src={item.profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500 text-sm font-medium">
                            {item.profile?.first_name?.[0] || ""}{item.profile?.last_name?.[0] || ""}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-gray-900">
                          {item.profile?.first_name} {item.profile?.last_name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          For: <span className="font-medium text-gray-700">{item.hr_v2_hire_requests?.title}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                  <Link to={getInternalPath("/client/jobs")} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                    View all in Jobs
                  </Link>
                </div>
              </div>
            )}
          </Card>

        </div>

        {/* Sidebar Column (Right) */}
        <div className="space-y-6">
          
          {/* 6. Billing Overview */}
          <Card className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900">Billing Overview</h2>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Outstanding Amount</p>
                <div className="text-2xl font-semibold text-gray-900">$0.00</div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Next Due Date</p>
                <div className="text-sm text-gray-900 font-medium">—</div>
              </div>
            </div>
            <div className="p-4 bg-gray-50/50 border-t border-gray-100">
              <Link to={getInternalPath("/client/invoices")} className="block">
                <Button variant="outline" className="w-full bg-white text-gray-700 border-gray-200 hover:bg-gray-50">
                  View Invoices
                </Button>
              </Link>
            </div>
          </Card>

          {/* 7. Client Information Panel */}
          <Card className="rounded-xl border border-gray-200 shadow-sm bg-white p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-3">Your Client ID</h2>
            <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-md border border-gray-100 mb-3">
              <code className="text-xs text-brand-primary font-mono truncate">
                {client?.client_id || "Pending..."}
              </code>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-gray-400 hover:text-gray-900 ml-2" 
                onClick={copyToClipboard}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Use this ID when contacting OpslyHR support.
            </p>
          </Card>

          {/* 8. Support Access */}
          <Card className="rounded-xl border border-gray-200 shadow-sm bg-white p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <HelpCircle className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-medium text-gray-900">Need help?</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Get in touch with our team for dedicated assistance.
            </p>
            <div className="space-y-2">
              <Link to={getInternalPath("/client/support")} className="block">
                <Button className="w-full text-sm h-9">
                  Contact Support
                </Button>
              </Link>
              <Link to={getInternalPath("/client/support")} className="block text-center mt-2">
                <span className="text-xs text-brand-primary hover:underline font-medium cursor-pointer">
                  View Support Tickets
                </span>
              </Link>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
