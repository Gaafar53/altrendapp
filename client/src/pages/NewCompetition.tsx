import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Loader2, Shield, Trophy } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function NewCompetition() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("إبداع");
  const [prizeTitle, setPrizeTitle] = useState("شارة بطل الترند");
  const [prizePoints, setPrizePoints] = useState("250");
  const [durationDays, setDurationDays] = useState("7");
  const create = trpc.competition.create.useMutation({ onSuccess: data => { toast.success("تم إنشاء المسابقة"); navigate(`/competitions/${data.competitionId}`); }, onError: error => toast.error(error.message) });
  if (loading) return <div className="min-h-screen bg-background"><Navbar /></div>;
  if (user?.role !== "admin") return <div className="min-h-screen bg-background"><Navbar /><main className="container max-w-xl py-24 text-center"><Shield className="w-12 h-12 text-accent mx-auto mb-4" /><h1 className="text-2xl font-bold">هذه الصفحة مخصصة للإدارة</h1><p className="text-muted-foreground mt-2">يمكن للإدارة فقط إطلاق مسابقات بجوائز رسمية.</p></main></div>;
  const createCompetition = () => {
    const startsAt = new Date();
    const endsAt = new Date(Date.now() + Number(durationDays) * 86400000);
    create.mutate({ title: title.trim(), description: description.trim() || undefined, category, prizeTitle: prizeTitle.trim(), prizeIcon: "trophy", prizePoints: Number(prizePoints), startsAt, endsAt });
  };
  return <div className="min-h-screen bg-background pb-20"><Navbar /><main className="container max-w-2xl py-8"><Button variant="ghost" className="gap-2 mb-5" onClick={() => navigate("/competitions")}><ArrowRight className="w-4 h-4" /> العودة للمسابقات</Button><Card className="p-6 md:p-8 bg-card/70 border-border/70"><div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center"><Trophy className="w-6 h-6 text-accent" /></div><div><h1 className="text-2xl font-bold">إطلاق مسابقة جديدة</h1><p className="text-sm text-muted-foreground">حدد الفكرة والمدة والجائزة الرمزية للمشاركين.</p></div></div><div className="space-y-5"><div><label className="text-sm font-medium block mb-2">عنوان المسابقة</label><Input value={title} onChange={event => setTitle(event.target.value.slice(0, 180))} placeholder="مثال: أفضل لقطة كوميدية لهذا الأسبوع" /></div><div><label className="text-sm font-medium block mb-2">الوصف</label><textarea value={description} onChange={event => setDescription(event.target.value.slice(0, 1000))} rows={4} className="w-full rounded-xl border border-border bg-input px-4 py-3 resize-none" placeholder="اشرح شروط المشاركة والتصويت..." /></div><div className="grid sm:grid-cols-2 gap-4"><div><label className="text-sm font-medium block mb-2">الفئة</label><Input value={category} onChange={event => setCategory(event.target.value.slice(0, 80))} /></div><div><label className="text-sm font-medium block mb-2">مدة المسابقة</label><select value={durationDays} onChange={event => setDurationDays(event.target.value)} className="w-full h-10 rounded-lg border border-border bg-input px-3"><option value="3">3 أيام</option><option value="7">أسبوع</option><option value="14">أسبوعان</option><option value="30">شهر</option></select></div></div><div className="grid sm:grid-cols-2 gap-4"><div><label className="text-sm font-medium block mb-2">اسم الجائزة</label><Input value={prizeTitle} onChange={event => setPrizeTitle(event.target.value.slice(0, 120))} /></div><div><label className="text-sm font-medium block mb-2">نقاط الفائز</label><Input type="number" min="10" max="10000" value={prizePoints} onChange={event => setPrizePoints(event.target.value)} /></div></div><Button className="w-full gap-2 bg-gradient-to-l from-primary to-accent text-white" disabled={title.trim().length < 3 || prizeTitle.trim().length < 2 || create.isPending} onClick={createCompetition}>{create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />} إطلاق المسابقة</Button></div></Card></main></div>;
}
