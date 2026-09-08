import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function NewCommunityTrend() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const create = trpc.communityTrend.create.useMutation({
    onSuccess: data => { toast.success("تم إنشاء الترند الجماعي"); navigate(`/community-trends/${data.trendId}`); },
    onError: error => toast.error(error.message),
  });

  return <div className="min-h-screen bg-background pb-20"><Navbar /><main className="container max-w-2xl py-8"><Button variant="ghost" className="gap-2 mb-5" onClick={() => navigate("/community-trends")}><ArrowRight className="w-4 h-4" /> العودة للترندات</Button><Card className="p-6 md:p-8 bg-card/70 border-border/70"><div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center"><Sparkles className="w-6 h-6 text-primary" /></div><div><h1 className="text-2xl font-bold">إنشاء ترند جماعي</h1><p className="text-sm text-muted-foreground">اصنع فكرة بسيطة يستطيع المجتمع تنفيذها والتصويت عليها.</p></div></div><div className="space-y-5"><div><label className="text-sm font-medium block mb-2">عنوان الترند</label><Input value={title} onChange={event => setTitle(event.target.value.slice(0, 180))} placeholder="مثال: لقطة من مدينتي" /></div><div><label className="text-sm font-medium block mb-2">فكرة المشاركة</label><Input value={prompt} onChange={event => setPrompt(event.target.value.slice(0, 280))} placeholder="صوّر أجمل مكان في مدينتك خلال 10 ثوانٍ" /></div><div><label className="text-sm font-medium block mb-2">وصف اختياري</label><textarea value={description} onChange={event => setDescription(event.target.value.slice(0, 1000))} rows={4} className="w-full rounded-xl border border-border bg-input px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary" placeholder="اشرح القواعد أو أسلوب التصويت..." /></div><div><label className="text-sm font-medium block mb-2">مدة الترند</label><select value={durationDays} onChange={event => setDurationDays(event.target.value)} className="w-full h-10 rounded-lg border border-border bg-input px-3"><option value="3">3 أيام</option><option value="7">أسبوع</option><option value="14">أسبوعان</option><option value="30">شهر</option></select></div><Button className="w-full gap-2 bg-gradient-to-l from-primary to-accent text-white" disabled={title.trim().length < 3 || prompt.trim().length < 3 || create.isPending} onClick={() => create.mutate({ title: title.trim(), prompt: prompt.trim(), description: description.trim() || undefined, durationDays: Number(durationDays) })}>{create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} إطلاق الترند</Button></div></Card></main></div>;
}
