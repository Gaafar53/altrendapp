import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Bell, Heart, MessageCircle, UserPlus, CheckCheck, Loader2, Mail } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const typeIcons: Record<string, React.ReactNode> = {
  like: <Heart className="w-5 h-5 text-red-400" />,
  comment: <MessageCircle className="w-5 h-5 text-blue-400" />,
  follow: <UserPlus className="w-5 h-5 text-green-400" />,
  message: <Mail className="w-5 h-5 text-purple-400" />,
};

const typeBg: Record<string, string> = {
  like: "bg-red-500/10",
  comment: "bg-blue-500/10",
  follow: "bg-green-500/10",
  message: "bg-purple-500/10",
};

export default function Notifications() {
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const { data: notifications, isLoading } = trpc.notification.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">سجل دخولك لمشاهدة الإشعارات</h2>
          <Button asChild className="mt-4 bg-gradient-to-l from-primary to-accent text-white">
            <a href={getLoginUrl()}>تسجيل الدخول</a>
          </Button>
        </div>
      </div>
    );
  }

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container py-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-7 h-7 text-accent" />
            <h1 className="text-2xl font-bold text-foreground">الإشعارات</h1>
            {unreadCount > 0 && (
              <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-muted-foreground hover:text-foreground gap-1"
            >
              <CheckCheck className="w-4 h-4" />
              قراءة الكل
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد إشعارات بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 border-border/30 transition-all cursor-pointer hover:bg-secondary/30 ${
                  !notification.isRead ? "bg-primary/5 border-primary/20" : "bg-card/50"
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    markRead.mutate({ notificationId: notification.id });
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${typeBg[notification.type]}`}>
                    {typeIcons[notification.type]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {notification.fromUserAvatar ? (
                        <img
                          src={notification.fromUserAvatar}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">
                          {(notification.fromUserName || "م")[0]}
                        </div>
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {notification.fromUserName || "مستخدم"}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">{notification.message}</p>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground/60">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                      </span>
                      {notification.videoId && (
                        <Link
                          href={`/video/${notification.videoId}`}
                          className="text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          عرض الفيديو
                        </Link>
                      )}
                      {notification.type === "follow" && (
                        <Link
                          href={`/profile/${notification.fromUserId}`}
                          className="text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          عرض الملف الشخصي
                        </Link>
                      )}
                      {(notification.type as string) === "message" && (
                        <Link
                          href="/messages"
                          className="text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          فتح الرسائل
                        </Link>
                      )}
                    </div>
                  </div>

                  {!notification.isRead && (
                    <div className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0 mt-2" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
