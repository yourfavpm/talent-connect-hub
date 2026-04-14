import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isAdminRole } from "@/lib/roles";

export const useUnreadCounts = () => {
    const { user, userRole } = useAuth();
    const [counts, setCounts] = useState({
        notifications: 0,
        messages: 0,
        adminOffers: 0,
        adminJobs: 0,
        adminTalents: 0,
        adminTimesheets: 0,
        clientContracts: 0,
        clientTimesheets: 0,
        adminContracts: 0,
        adminSupportTickets: 0,
    });

    useEffect(() => {
        if (!user) return;

        const fetchCounts = async () => {
            try {
                // 1. Notifications (All users)
                const { count: notifCount } = await supabase
                    .from("notifications")
                    .select("*", { count: "exact", head: true })
                    .eq("user_id", user.id)
                    .is("read_at", null);

                // 2. Admin Specifics
                let adminOffers = 0;
                let adminContracts = 0;
                let adminSupportTickets = 0;
                let adminJobs = 0;
                let adminTalents = 0;
                let adminTimesheets = 0;
                if (isAdminRole(userRole)) {
                    const [
                        { count: offerCount },
                        { count: supportCount },
                        { count: jobCount },
                        { count: tsCount },
                        { count: contractCount },
                    ] = await Promise.all([
                        supabase.from("offers").select("*", { count: "exact", head: true }).eq("status", "sent_to_admin"),
                        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("unread_by_admin", true),
                        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "submitted"),
                        supabase.from("timesheets").select("*", { count: "exact", head: true }).eq("status", "submitted"),
                        supabase.from("contracts").select("*", { count: "exact", head: true }).eq("status", "pending"),
                    ]);
                    
                    adminOffers = offerCount || 0;
                    adminSupportTickets = supportCount || 0;
                    adminJobs = jobCount || 0;
                    adminTimesheets = tsCount || 0;
                    adminContracts = contractCount || 0;

                    const { data: v2 } = await supabase.from("app_settings").select("value").eq("key", "vetting_system_version").maybeSingle();
                    const isV2 = v2?.value === "v2";

                    if (isV2) {
                        const { count: v2Count } = await supabase
                            .from("v2_talent_profiles")
                            .select("*", { count: "exact", head: true })
                            .in("status", ["submitted", "resubmitted", "revett_pending"]);
                        adminTalents = v2Count || 0;
                    } else {
                        const { count: v1Count } = await (supabase.from("talent_profiles" as any) as any)
                            .select("*", { count: "exact", head: true })
                            .in("status", ["SUBMITTED", "RESUBMITTED"]);
                        adminTalents = v1Count || 0;
                    }
                }

                // 3. Client Specifics
                let clientContracts = 0;
                let clientTimesheets = 0;
                if (userRole === "client") {
                    // Need client_id
                    const { data: client } = await supabase.from('clients').select('id').eq('user_id', user.id).maybeSingle();
                    if (client) {
                        const { count: contractCount } = await supabase
                            .from("contracts")
                            .select("*", { count: "exact", head: true })
                            .eq("client_id", client.id)
                            .eq("status", "pending");
                        clientContracts = contractCount || 0;

                        const { count: timesheetCount } = await supabase
                            .from("timesheets")
                            .select("id", { count: "exact", head: true })
                            .eq("status", "submitted") // Only pending approval
                        // We need to join contracts to filter by client_id, but supabase count with join is tricky in one go if RLS handles it.
                        // However, we enabled RLS: "Clients view timesheets for their contracts". So checking count of "submitted" should implicitly filter by RLS?
                        // Yes, if RLS is correct. "auth.uid() IN (SELECT user_id FROM clients ...)"
                        // So simply counting timesheets where status=submitted is safer if RLS works.
                        // But usually, explicit filter is better. 
                        // Supabase JS doesn't support deep join filtering easily in `count` query without `.rpc` or flattened views sometimes. 
                        // But let's trust RLS or try.
                        // Actually, I can query timesheets with inner join.
                        // But `head: true` with deep filter?
                        // Let's assume RLS filters it for us.
                        // Wait, RLS "Clients view contract timesheets" ensures they only see theirs.
                        // So `supabase.from('timesheets').select('*', { count: 'exact', head: true }).eq('status', 'submitted')` should work and return count of submitted timesheets visible to this user.

                        const { count: tsCount } = await supabase
                            .from("timesheets")
                            .select("*", { count: "exact", head: true })
                            .eq("status", "submitted");

                        clientTimesheets = tsCount || 0;
                    }
                }

                setCounts({
                    notifications: notifCount || 0,
                    messages: 0,
                    adminOffers,
                    adminJobs,
                    adminTalents,
                    adminTimesheets,
                    clientContracts,
                    clientTimesheets,
                    adminContracts,
                    adminSupportTickets
                });

            } catch (error) {
                console.error("Error fetching unread counts:", error);
            }
        };

        fetchCounts();

        // Subscribe to realtime - optional for optimization, leaving out for MVP to avoid complexity
        const interval = setInterval(fetchCounts, 30000); // Poll every 30s
        return () => clearInterval(interval);

    }, [user, userRole]);

    return counts;
};
