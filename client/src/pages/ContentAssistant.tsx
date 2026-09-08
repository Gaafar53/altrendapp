import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Check, Copy, Hash, Lightbulb, Loader2, Sparkles, Type } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ContentAssistant() {
  useAuth({ redirectOnUnauthenticated: true });
  const [idea, setIdea] = useState("");
  const [tone, setTone] = useState<"حماسي" | "كوميدي" | "تعليمي" | "ملهم" | "عفوي">("عفوي");
  const [result, setResult] = useState<{ title: string; description: string; hashtags: string[]; hook: string } | null>(null);
  const suggest = trpc.aiContent.suggest.useMutation({ onSuccess: data => setResult(data), onError: error => toast.error(error.message) });

  const copyAll = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(`${result.title}\n\n${result.description}\n\n${result.hashtags.map(tag => `#${tag.replace(/^#/, "")}`).join(" ")}`);
    toast.success("تم نسخ الاقتراح");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container max-w-5xl py-8">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-accent/10 p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center"><Bot className="w-7 h-7 text-primary" /></div>
            <div><p className="text-sm text-accent font-semibold mb-1">مساعد الترند الذكي</p><h1 className="text-3xl font-bold">حوّل فكرتك إلى محتوى قابل للمشاركة</h1><p className="text-muted-foreground mt-2 max-w-2xl">اكتب فكرتك كما هي، وسيقترح لك المساعد عنوانًا، وصفًا، هاشتاقات، وجملة افتتاحية. راجع الاقتراح قبل نشره.</p></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
          <Card className="p-6 bg-card/70 border-border/70 space-y-5">
            <div className="flex items-center gap-2 font-semibold"><Lightbulb className="w-5 h-5 text-accent" /> فكرتك</div>
            <textarea value={idea} onChange={event => setIdea(event.target.value.slice(0, 1200))} rows={8} placeholder="مثال: أريد تصوير فيديو قصير عن أفضل أماكن الفطور في مدينتي..." className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
            <div><label className="text-sm font-medium block mb-2">نبرة المحتوى</label><div className="flex flex-wrap gap-2">{(["عفوي", "حماسي", "كوميدي", "تعليمي", "ملهم"] as const).map(item => <Button key={item} type="button" size="sm" variant={tone === item ? "default" : "outline"} onClick={() => setTone(item)}>{item}</Button>)}</div></div>
            <Button className="w-full gap-2 bg-gradient-to-l from-primary to-accent text-white" disabled={idea.trim().length < 5 || suggest.isPending} onClick={() => suggest.mutate({ idea: idea.trim(), tone })}>{suggest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} إنشاء اقتراح ذكي</Button>
            <p className="text-xs text-muted-foreground">لا تنشر الاقتراح تلقائيًا؛ أنت تراجع وتعدّل قبل المشاركة.</p>
          </Card>

          <Card className="p-6 bg-card/70 border-border/70 min-h-[24rem]">
            {!result ? <div className="h-full min-h-80 flex flex-col items-center justify-center text-center text-muted-foreground"><Sparkles className="w-12 h-12 text-primary/50 mb-4" /><p className="font-semibold text-foreground">اقتراحك سيظهر هنا</p><p className="text-sm mt-2 max-w-xs">استخدم المساعد كبداية، ثم أضف لمستك الشخصية قبل النشر.</p></div> : <div className="space-y-5"><div className="flex items-center justify-between"><h2 className="font-bold text-lg">اقتراح جاهز للمراجعة</h2><Button variant="outline" size="sm" className="gap-2" onClick={copyAll}><Copy className="w-4 h-4" /> نسخ الكل</Button></div><div className="rounded-2xl bg-secondary/40 p-4"><p className="text-xs text-primary mb-2 flex items-center gap-1"><Type className="w-3 h-3" /> العنوان</p><p className="font-bold text-lg">{result.title}</p></div><div className="rounded-2xl bg-secondary/40 p-4"><p className="text-xs text-primary mb-2">الجملة الافتتاحية</p><p className="leading-7">{result.hook}</p></div><div className="rounded-2xl bg-secondary/40 p-4"><p className="text-xs text-primary mb-2">الوصف</p><p className="leading-7">{result.description}</p></div><div className="flex flex-wrap gap-2">{result.hashtags.map(tag => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm"><Hash className="w-3 h-3" />{tag.replace(/^#/, "")}</span>)}</div><div className="flex items-center gap-2 text-sm text-emerald-400"><Check className="w-4 h-4" /> تمت مراجعة الاقتراح ويمكنك تعديله قبل النشر</div></div>}
          </Card>
        </div>
      </main>
    </div>
  );
}
