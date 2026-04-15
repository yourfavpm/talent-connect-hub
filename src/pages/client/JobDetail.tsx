import { useParams, Link } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Video, FileText, CheckCircle2, Clock, Briefcase, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Tab Components
import { OverviewTab } from "@/components/client/jobs/tabs/OverviewTab";
import { ApplicantsTab } from "@/components/client/jobs/tabs/ApplicantsTab";
import { ShortlistTab } from "@/components/client/jobs/tabs/ShortlistTab";
import { InterviewsTab } from "@/components/client/jobs/tabs/InterviewsTab";
import { OffersTab } from "@/components/client/jobs/tabs/OffersTab";
import { ActivityTab } from "@/components/client/jobs/tabs/ActivityTab";

const CURRENCIES = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "NGN", label: "NGN (₦)", symbol: "₦" },
  { value: "KES", label: "KES (KSh)", symbol: "KSh" },
  { value: "ZAR", label: "ZAR (R)", symbol: "R" },
];

const ClientJobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Job
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['client_job', id],
    queryFn: async () => {
      const { data: client } = await supabase.from('clients').select('id').eq('user_id', user?.id).maybeSingle();
      if (!client) throw new Error("Client not found");

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('client_id', client.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id
  });

  // Fetch Applications
  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['job_applications', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*, talent:talents(*)')
        .eq('job_id', id);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user?.id,
    refetchInterval: 5000 // Poll slightly
  });

  const requestInterviewMutation = useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase.from('job_applications').update({ status: 'interview_requested' }).eq('id', appId);
      if (error) throw error;

      const app = applications?.find(a => a.id === appId);
      if (app?.talent?.user_id) {
        await supabase.from('notifications').insert({
          user_id: app.talent.user_id,
          title: "Interview Request",
          message: `You have an interview request for ${job?.title}.`,
          type: 'interview',
          action_url: `/talent/messages`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_applications', id] });
      toast({ title: "Interview Requested", description: "The candidate will be notified." });
    }
  });

  const initiateOfferMutation = useMutation({
    mutationFn: async (appId: string) => {
      const app = applications?.find(a => a.id === appId);
      if (!app) throw new Error("Application not found");

      const { error: appError } = await supabase.from('job_applications').update({ status: 'offer_initiated' }).eq('id', appId);
      if (appError) throw appError;

      const { error: offerError } = await supabase.from('offers').insert({
        client_id: job.client_id,
        talent_id: app.talent_id,
        role_title: job.title,
        hourly_rate: job.budget_max || 0,
        weekly_hours: job.weekly_hours || 40,
        start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        duration: job.duration || 'Ongoing',
        status: 'sent_to_admin',
        special_terms: `Generated from role: ${job.title}`,
        created_by: user?.id
      });
      if (offerError) throw offerError;

      if (app?.talent?.user_id) {
        await supabase.from('notifications').insert({
          user_id: app.talent.user_id,
          title: "Offer Step Initiated",
          message: `An offer is being prepared for ${job?.title}.`,
          type: 'offer',
          action_url: `/talent/offers`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_applications', id] });
      toast({ title: "Offer Initiated", description: "Admin will generate the contract shortly." });
    }
  });

  const getCurrencySymbol = (code: string) => CURRENCIES.find(c => c.value === code)?.symbol || "$";

  if (jobLoading || appsLoading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
    </div>
  );
  if (!job) return <div className="p-20 text-center text-gray-500 font-medium">Job posting not found.</div>;

  const isOfferPending = applications?.some(a => ['offer_initiated', 'offer_sent', 'offer_accepted', 'contract_pending', 'contract_sent', 'waiting_for_talent', 'active', 'hired'].includes(a.status));
  const applicantsCount = applications?.filter(app => app.status === 'applied').length || 0;
  const shortlistCount = applications?.filter(app => ['shortlisted', 'interview_requested', 'interview_scheduled'].includes(app.status)).length || 0;
  const interviewsCount = applications?.filter(app => ['interview_requested', 'interview_scheduled'].includes(app.status)).length || 0;

  return (
    <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-8 font-sans animate-fade-in pb-32">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="h-9 w-9 border-gray-200">
            <Link to={getInternalPath("/client/jobs")}><ArrowLeft className="h-4 w-4 text-gray-700" /></Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{job.title}</h1>
              {job.status === "needs_changes" && job.rejection_reason && (
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">Needs Changes</Badge>
              )}
              {job.status === "published" && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Active & Receiving</Badge>
              )}
              {job.status === "submitted" && (
                <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none"><Clock className="w-3 h-3 mr-1" /> Awaiting Approval</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {isOfferPending && (
        <div className="mb-8 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
             <span className="font-semibold text-sm">Hiring in Progress</span>
             <p className="text-sm mt-0.5 text-blue-700/90">An offer has been initiated for this role. You cannot hire another candidate until the current process is finalized.</p>
          </div>
        </div>
      )}

      {/* Deep-linked Tabs Structure */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start h-auto p-0 flex flex-nowrap overflow-x-auto scrollbar-hide">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent text-gray-500 py-3 px-1 sm:px-4 flex items-center gap-2 font-medium">
            <LayoutDashboard className="w-4 h-4 hidden sm:block" /> Overview
          </TabsTrigger>
          <TabsTrigger value="applicants" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent text-gray-500 py-3 px-1 sm:px-4 flex items-center gap-2 font-medium">
            <User className="w-4 h-4 hidden sm:block" /> Applicants
            {applicantsCount > 0 && <span className="bg-gray-100 text-gray-900 text-xs px-2 py-0.5 rounded-full font-semibold">{applicantsCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="shortlist" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent text-gray-500 py-3 px-1 sm:px-4 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 hidden sm:block" /> Shortlist
            {shortlistCount > 0 && <span className="bg-gray-100 text-gray-900 text-xs px-2 py-0.5 rounded-full font-semibold">{shortlistCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="interviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent text-gray-500 py-3 px-1 sm:px-4 flex items-center gap-2 font-medium">
            <Video className="w-4 h-4 hidden sm:block" /> Interviews
            {interviewsCount > 0 && <span className="bg-gray-100 text-gray-900 text-xs px-2 py-0.5 rounded-full font-semibold">{interviewsCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="offers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent text-gray-500 py-3 px-1 sm:px-4 flex items-center gap-2 font-medium">
            <FileText className="w-4 h-4 hidden sm:block" /> Offers
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent text-gray-500 py-3 px-1 sm:px-4 flex items-center gap-2 font-medium">
            Activity
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <OverviewTab job={job} getCurrencySymbol={getCurrencySymbol} />
          </TabsContent>

          <TabsContent value="applicants" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <ApplicantsTab 
              applications={applications || []} 
              onRequestInterview={(id) => requestInterviewMutation.mutate(id)} 
            />
          </TabsContent>

          <TabsContent value="shortlist" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <ShortlistTab 
              applications={applications || []} 
              onRequestInterview={(id) => requestInterviewMutation.mutate(id)} 
              onInitiateOffer={(id) => initiateOfferMutation.mutate(id)}
              isOfferPending={isOfferPending}
            />
          </TabsContent>

          <TabsContent value="interviews" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <InterviewsTab applications={applications || []} />
          </TabsContent>

          <TabsContent value="offers" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <OffersTab applications={applications || []} />
          </TabsContent>

          <TabsContent value="activity" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <ActivityTab job={job} applications={applications || []} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ClientJobDetail;
