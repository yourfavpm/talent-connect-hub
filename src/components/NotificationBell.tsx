import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInternalPath } from "@/utils/subdomain";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";
import { Notification } from "@/types";

interface NotificationBellProps {
  variant?: "light" | "dark";
}

const NotificationBell = ({ variant = "dark" }: NotificationBellProps) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(getInternalPath(notification.action_url));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            variant === "light"
              ? "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
              : "text-foreground hover:bg-muted"
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="text-xs h-8"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-muted/50 transition-colors",
                    !notification.read_at && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      notification.read_at ? "bg-transparent" : "bg-primary"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {notification.action_url && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
