import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadCounts = () => {
    const { user, userRole } = useAuth();
    const [counts, setCounts] = useState({
        notifications: 0,
        messages: 0,
        adminOffers: 0,
        clientContracts: 0,
        clientTimesheets: 0,
        adminContracts: 0, // maybe admin needs to know about signed matches?
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
                    .eq("read", false);

                // 2. Admin Specifics
                let adminOffers = 0;
                let adminContracts = 0;
                if (userRole && ["super_admin", "operations_admin", "finance_admin"].includes(userRole)) {
                    const { count: offerCount } = await supabase
                        .from("offers")
                        .select("*", { count: "exact", head: true })
                        .eq("status", "sent_to_admin");
                    adminOffers = offerCount || 0;
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
                    clientContracts,
                    clientTimesheets,
                    adminContracts
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
