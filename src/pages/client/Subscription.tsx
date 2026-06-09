import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Users,
  TrendingUp,
  CheckCircle,
  Loader2,
  Zap,
  Building2,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    period: "14-day trial",
    seats: 3,
    color: "border-gray-200",
    badge: "",
    features: [
      "Up to 3 team members",
      "Workforce Dashboard",
      "Timesheet approval",
      "Team management",
      "In-platform messaging",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$49",
    period: "/month",
    seats: 10,
    color: "border-blue-500",
    badge: "Most Popular",
    features: [
      "Up to 10 team members",
      "All Starter features",
      "KPI tracking",
      "Performance reviews",
      "Priority support",
      "Export reports",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$149",
    period: "/month",
    seats: -1,
    color: "border-purple-500",
    badge: "Best Value",
    features: [
      "Unlimited team members",
      "All Growth features",
      "Custom KPI templates",
      "Dedicated account manager",
      "API access",
      "SLA guarantee",
    ],
  },
];

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [subscription, setSubscription] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [usage, setUsage] = useState({ members: 0, activeHires: 0, pendingTimesheets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: cId } = await (supabase.rpc("get_my_client_id" as any) as any);
      if (!cId) return;
      setClientId(cId);

      const { data: sub } = await (supabase
        .from("client_subscriptions" as any)
        .select("*")
        .eq("client_id", cId)
        .single() as any);
      setSubscription(sub);

      const { count: memberCount } = await (supabase
        .from("client_members" as any)
        .select("*", { count: "exact", head: true })
        .eq("client_id", cId)
        .eq("status", "active") as any);

      const { count: hireCount } = await supabase
        .from("contracts")
        .select("*", { count: "exact", head: true })
        .eq("client_id", cId)
        .eq("status", "active");

      const { count: tsCount } = await supabase
        .from("timesheets")
        .select("*, contracts!inner(client_id)", { count: "exact", head: true })
        .eq("contracts.client_id", cId)
        .eq("status", "submitted");

      setUsage({
        members: (memberCount || 0) + 1,
        activeHires: hireCount || 0,
        pendingTimesheets: tsCount || 0,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const requestUpgrade = (planId: string) => {
    const subject = encodeURIComponent(`OpslyHR Plan Upgrade Request — ${planId.charAt(0).toUpperCase() + planId.slice(1)}`);
    const body = encodeURIComponent(`Hi OpslyHR team,\n\nI'd like to upgrade my workspace to the ${planId} plan.\n\nClient ID: ${clientId}\nUser: ${user?.email}\n\nPlease get in touch to arrange this.\n\nThank you.`);
    window.open(`mailto:support@opslyhr.com?subject=${subject}&body=${body}`);
  };

  const STATUS_COLOR: Record<string, string> = {
    trialing: "bg-amber-100 text-amber-800 border-amber-200",
    active: "bg-green-100 text-green-800 border-green-200",
    past_due: "bg-red-100 text-red-800 border-red-200",
    canceled: "bg-gray-100 text-gray-600 border-gray-200",
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>;
  }

  const currentPlan = subscription?.plan || "starter";
  const subStatus = subscription?.status || "trialing";

  return (
    <div className="w-full max-w-none space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Subscription & Billing</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your OpslyHR workspace plan.</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-r from-[#0f2147] to-[#1e3a6e] rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-blue-300" />
              <span className="text-blue-200 text-sm">Current Plan</span>
            </div>
            <h2 className="text-2xl font-bold capitalize">{currentPlan} Plan</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn(STATUS_COLOR[subStatus], "text-xs font-medium capitalize")}>
                {subStatus.replace("_", " ")}
              </Badge>
              {subscription?.trial_ends_at && subStatus === "trialing" && (
                <span className="text-blue-200 text-xs">
                  Trial ends {format(new Date(subscription.trial_ends_at), "MMM d, yyyy")}
                </span>
              )}
              {subscription?.current_period_end && subStatus === "active" && (
                <span className="text-blue-200 text-xs">
                  Renews {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs mb-1">Seat Usage</p>
            <p className="text-3xl font-bold">{usage.members} <span className="text-xl font-normal text-blue-300">/ {subscription?.max_team_members === -1 ? "∞" : (subscription?.max_team_members || 3)}</span></p>
          </div>
        </div>
      </div>

      {/* Usage Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Active Members", value: usage.members, color: "text-blue-600 bg-blue-50" },
          { icon: Building2, label: "Active Hires", value: usage.activeHires, color: "text-emerald-600 bg-emerald-50" },
          { icon: TrendingUp, label: "Pending Timesheets", value: usage.pendingTimesheets, color: "text-amber-600 bg-amber-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-3", stat.color)}>
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">All Plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative bg-white border-2 rounded-2xl p-6 shadow-sm flex flex-col",
                  isCurrentPlan ? plan.color : "border-gray-200",
                  plan.id === "growth" && "shadow-md"
                )}
              >
                {plan.badge && (
                  <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold",
                    plan.id === "growth" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                  )}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-gray-400 text-sm mb-1">{plan.period}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {plan.seats === -1 ? "Unlimited seats" : `Up to ${plan.seats} seats`}
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button disabled className="w-full" variant="outline">
                    <Zap className="h-4 w-4 mr-2" /> Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.id === "growth" ? "default" : "outline"}
                    onClick={() => requestUpgrade(plan.id)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {PLANS.findIndex(p => p.id === currentPlan) < PLANS.findIndex(p => p.id === plan.id)
                      ? `Upgrade to ${plan.name}`
                      : `Downgrade to ${plan.name}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-center text-gray-400 mt-4">
          To change your plan, click the button above to email our team. Automated billing with Stripe is coming soon.
        </p>
      </div>
    </div>
  );
}
