import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, Loader2, UserPlus, Heart, MessageCircle, Repeat2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";

const NotificationIcon = ({ type }: { type: Notification["type"] }) => {
  switch (type) {
    case "follow":
      return <UserPlus className="h-4 w-4 text-primary" />;
    case "like":
      return <Heart className="h-4 w-4 text-red-500" />;
    case "comment":
      return <MessageCircle className="h-4 w-4 text-green-500" />;
    case "repost":
      return <Repeat2 className="h-4 w-4 text-blue-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getNotificationText = (type: Notification["type"]) => {
  switch (type) {
    case "follow":
      return "เริ่มติดตามคุณ";
    case "like":
      return "ถูกใจโพสต์ของคุณ";
    case "comment":
      return "แสดงความคิดเห็นในโพสต์ของคุณ";
    case "repost":
      return "รีโพสต์โพสต์ของคุณ";
    default:
      return "";
  }
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: th,
  });

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b border-border p-4 transition-colors hover:bg-muted/50",
        !notification.read && "bg-primary/5"
      )}
    >
      <Link
        to={`/profile/${notification.actor_id}`}
        onClick={handleClick}
        className="shrink-0"
      >
        <Avatar className="h-12 w-12">
          <AvatarImage src={notification.actor?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {(notification.actor?.display_name || "ผู้ใช้").charAt(0)}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          to={`/profile/${notification.actor_id}`}
          onClick={handleClick}
          className="block"
        >
          <div className="flex items-center gap-2">
            <NotificationIcon type={notification.type} />
            <p className="text-sm">
              <span className="font-semibold text-foreground">
                {notification.actor?.display_name || "ผู้ใช้"}
              </span>{" "}
              <span className="text-muted-foreground">
                {getNotificationText(notification.type)}
              </span>
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{timeAgo}</p>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        {!notification.read && (
          <div className="h-2 w-2 rounded-full bg-primary" />
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          title="ลบการแจ้งเตือน"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <MainLayout showRightSidebar={false}>
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex h-14 items-center justify-between px-4">
            <h1 className="text-lg font-bold text-foreground">แจ้งเตือน</h1>
          </div>
        </header>
        <div className="space-y-4 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout showRightSidebar={false}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">แจ้งเตือน</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-primary"
            >
              <Check className="mr-1 h-4 w-4" />
              อ่านทั้งหมด
            </Button>
          )}
        </div>
      </header>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">
            ยังไม่มีการแจ้งเตือน
          </h2>
          <p className="text-muted-foreground">
            เมื่อมีคนติดตาม กดไลค์ หรือคอมเมนต์ จะแสดงที่นี่
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default Notifications;
