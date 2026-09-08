import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Hook للإشعارات الفورية داخل التطبيق
 * يقوم بالاستطلاع السريع عن إشعارات جديدة وعرضها كـ toast
 */
export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const lastCountRef = useRef<number | null>(null);
  const shownIdsRef = useRef<Set<number>>(new Set());

  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15_000, // كل 15 ثانية
  });

  const { data: notifications } = trpc.notification.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (!notifications || !isAuthenticated) return;

    // عند أول تحميل، نسجل الـ IDs الموجودة بدون عرض toast
    if (lastCountRef.current === null) {
      notifications.forEach(n => shownIdsRef.current.add(n.id));
      lastCountRef.current = notifications.length;
      return;
    }

    // نعرض toast للإشعارات الجديدة فقط
    notifications.forEach(n => {
      if (!shownIdsRef.current.has(n.id) && !n.isRead) {
        shownIdsRef.current.add(n.id);
        const icon = n.type === "like" ? "❤️" : n.type === "comment" ? "💬" : n.type === "follow" ? "👤" : n.type === "challenge" ? "🎯" : n.type === "competition" ? "🏁" : n.type === "winner" ? "🏆" : "📩";
        toast(`${icon} ${n.message}`, {
          duration: 5000,
          action: n.videoId
            ? {
                label: "شاهد",
                onClick: () => { window.location.href = `/video/${n.videoId}`; },
              }
            : undefined,
        });
      }
    });

    lastCountRef.current = notifications.length;
  }, [notifications, isAuthenticated]);

  return { unreadCount: unreadCount ?? 0 };
}
