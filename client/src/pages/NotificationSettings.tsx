import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Bell, Heart, Loader2, MessageCircle, Swords, Trophy, Users } from "lucide-react";
import { toast } from "sonner";

const settings = [
  { key: "likesEnabled", label: "الإعجابات", description: "عند إعجاب الآخرين بمحتواك", icon: Heart },
  { key: "commentsEnabled", label: "التعليقات", description: "عند إضافة تعليق أو رد جديد", icon: MessageCircle },
  { key: "followsEnabled", label: "المتابعات", description: "عند حصولك على متابع جديد", icon: Users },
  { key: "challengesEnabled", label: "التحديات", description: "عند بدء أو تحديث تحدٍ تشارك فيه", icon: Swords },
  { key: "competitionsEnabled", label: "المسابقات والجوائز", description: "عند ورود خبر عن مسابقة أو فوز", icon: Trophy },
] as const;

export default function NotificationSettings() {
  useAuth({ redirectOnUnauthenticated: true });
  const { data, isLoading } = trpc.notification.preferences.useQuery();
  const utils = trpc.useUtils();
  const update = trpc.notification.updatePreferences.useMutation({ onSuccess: async () => { await utils.notification.preferences.invalidate(); toast.success("تم حفظ إعدادات الإشعارات"); }, onError: error => toast.error(error.message) });
  if (isLoading || !data) return <div className="min-h-screen bg-background"><Navbar /><div className="flex justify-center py-28"><Loader2 className="animate-spin text-primary" /></div></div>;
  return <div className="min-h-screen bg-background pb-20"><Navbar /><main className="container max-w-2xl py-8"><section className="mb-6"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center"><Bell className="w-6 h-6 text-primary" /></div><div><h1 className="text-3xl font-bold">إعدادات الإشعارات</h1><p className="text-muted-foreground mt-1">اختر التنبيهات التي تريد أن تراها داخل التطبيق.</p></div></div></section><Card className="divide-y divide-border/60 bg-card/70 border-border/70">{settings.map(item => { const Icon = item.icon; const checked = data[item.key]; return <div key={item.key} className="flex items-center gap-4 p-5"><div className="w-10 h-10 rounded-xl bg-secondary/70 flex items-center justify-center"><Icon className="w-5 h-5 text-accent" /></div><div className="flex-1"><p className="font-semibold">{item.label}</p><p className="text-sm text-muted-foreground mt-1">{item.description}</p></div><Switch checked={checked} disabled={update.isPending} onCheckedChange={value => update.mutate({ [item.key]: value })} /></div>; })}</Card><p className="text-xs text-muted-foreground mt-4">تظهر التنبيهات في مركز الإشعارات داخل تطبيق الترند. إعدادات إشعارات المتصفح الخارجية يمكن تفعيلها لاحقًا بعد ربط خدمة دفع إشعارات متوافقة.</p></main></div>;
}
