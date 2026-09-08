import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUp, Clock3, Flame, Link as LinkIcon, Loader2, Plus, Sparkles, Users } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function CommunityTrends() {
  const { isAuthenticated } = useAuth();
  const { data: trends, isLoading } = trpc.communityTrend.active.useQuery({ limit: 20 });
  const createTrend = trpc.communityTrend.create.useMutation({ onSuccess: () => toast.success("تم إنشاء الترند الجماعي") , onError: error => toast.error(error.message) });

  const copyLink = async (slug: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/community-trends/${slug}`);
    toast.success("تم نسخ رابط الترند");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div><p className="text-sm text-accent font-semibold mb-1">اللعب الجماعي يبدأ هنا</p><h1 className="text-3xl font-bold">الترند الجماعي</h1><p className="text-muted-foreground mt-2">شارك في فكرة واحدة مع المجتمع، واجعل تصويت الجمهور يحدد المقطع الأبرز.</p></div>
          {isAuthenticated && <Link href="/community-trends/new"><Button className="gap-2 bg-gradient-to-l from-primary to-accent text-white"><Plus className="w-4 h-4" /> إنشاء ترند</Button></Link>}
        </div>
        {isLoading ? <div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary" /></div> : !trends?.length ? <Card className="p-12 text-center bg-card/60"><Sparkles className="w-12 h-12 text-primary mx-auto mb-4" /><h2 className="font-bold text-xl">لا توجد ترندات نشطة الآن</h2><p className="text-muted-foreground mt-2">كن أول من يطلق فكرة يشارك فيها المجتمع.</p></Card> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{trends.map(trend => <Card key={trend.id} className="p-5 bg-card/70 border-border/70 hover:border-primary/40 transition-colors"><div className="flex items-center justify-between mb-4"><span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs"><Flame className="w-3 h-3" /> نشط الآن</span><span className="text-xs text-muted-foreground flex items-center gap-1"><Clock3 className="w-3 h-3" /> {new Date(trend.expiresAt).toLocaleDateString("ar-EG")}</span></div><h2 className="font-bold text-xl mb-2">{trend.title}</h2><p className="text-sm text-muted-foreground leading-6 min-h-12">{trend.description ?? trend.prompt}</p><div className="mt-4 rounded-xl bg-secondary/40 p-3 text-sm"><span className="text-accent font-semibold">الفكرة: </span>{trend.prompt}</div><div className="flex items-center justify-between mt-5 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Users className="w-4 h-4" /> {trend.participantCount} مشارك</span><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => copyLink(trend.slug)} aria-label="نسخ الرابط"><LinkIcon className="w-4 h-4" /></Button><Link href={`/community-trends/${trend.id}`}><Button size="sm" className="gap-1">استكشف <ArrowUp className="w-3 h-3 rotate-45" /></Button></Link></div></div></Card>)}</div>}
      </main>
    </div>
  );
}
