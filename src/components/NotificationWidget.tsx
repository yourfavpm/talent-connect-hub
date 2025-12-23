import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, ArrowRight, Briefcase, Check, FileText, Star, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

const NotificationWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Subscribe to realtime notifications
      const channel = supabase
        .channel('dashboard-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user?.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error) {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const getIcon = (type: string | null) => {
    switch (type) {
      case "job_approved":
      case "job_submitted":
        return <Briefcase className="h-4 w-4" />;
      case "shortlisted":
      case "hired":
        return <Star className="h-4 w-4" />;
      case "interview_scheduled":
        return <Calendar className="h-4 w-4" />;
      case "offer_received":
      case "offer_created":
      case "contract_ready":
        return <FileText className="h-4 w-4" />;
      case "job_rejected":
      case "application_rejected":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getIconColor = (type: string | null) => {
    switch (type) {
      case "job_approved":
      case "hired":
        return "bg-success/10 text-success";
      case "job_rejected":
      case "application_rejected":
        return "bg-destructive/10 text-destructive";
      case "shortlisted":
      case "offer_received":
        return "bg-primary/10 text-primary";
      case "interview_scheduled":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleClick = async (notification: Notification) => {
    // Mark as read
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notification.id);

    setNotifications(prev => prev.filter(n => n.id !== notification.id));

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" />
          Recent Notifications
          {notifications.length > 0 && (
            <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {notifications.length} new
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleClick(notification)}
                className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
              >
                <div className="flex gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    getIconColor(notification.type)
                  )}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationWidget;
