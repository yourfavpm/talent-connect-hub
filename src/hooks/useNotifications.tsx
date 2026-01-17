import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Notification } from "@/types";
import { useToast } from "./use-toast";

export const useNotifications = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Setup real-time subscription
            const channel = supabase
                .channel('public:notifications')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        const newNotification = payload.new as Notification;
                        setNotifications((prev) => [newNotification, ...prev]);
                        setUnreadCount((prev) => prev + 1);
                        toast({
                            title: newNotification.title,
                            description: newNotification.message,
                        });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user?.id)
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;

            setNotifications(data as Notification[]);
            setUnreadCount(data?.filter((n) => !n.read_at).length || 0);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ read_at: new Date().toISOString() })
                .eq("id", id);

            if (error) throw error;

            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ read_at: new Date().toISOString() })
                .eq("user_id", user?.id)
                .is("read_at", null);

            if (error) throw error;

            setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
    };
};
