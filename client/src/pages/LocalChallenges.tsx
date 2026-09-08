import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarDays, ChevronLeft, Globe2, Loader2, MapPin, Users } from "lucide-react";
import { Link } from "wouter";

export default function LocalChallenges() {
  const [scope, setScope] = useState<"global" | "city" | "community" | undefined>(undefined);
  const [locationName, setLocationName] = useState("");
  const [communityName, setCommunityName] = useState("");
  const filterInput = scope === "city" ? "اسم المدينة" : scope === "community" ? "اسم المجتمع" : "";
  const { data: challenges, isLoading } = trpc.localChallenge.active.useQuery(
    scope || locationName.trim() || communityName.trim()
      ? {
          scope,
          locationName: scope === "city" ? locationName.trim() || undefined : undefined,
          communityName: scope === "community" ? communityName.trim() || undefined : undefined,
        }
      : undefined
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container py-8">
        <div className="mb-8"><p className="text-sm text-accent font-semibold mb-1">نافس من حولك</p><h1 className="text-3xl font-bold">التحديات المحلية</h1><p className="text-muted-foreground mt-2">اكتشف تحديات مدينتك ومجتمعاتك المفضلة، وشارك محتوى يكسبك نقاطًا وشارات.</p></div>
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {([undefined, "city", "community", "global"] as const).map(item => (
            <Button
              key={item ?? "all"}
              size="sm"
              variant={scope === item ? "default" : "outline"}
              onClick={() => {
                setScope(item);
                if (item !== "city") setLocationName("");
                if (item !== "community") setCommunityName("");
              }}
            >
              {item === undefined ? "الكل" : item === "city" ? "حسب المدينة" : item === "community" ? "المجتمعات" : "عالمي"}
            </Button>
          ))}
          {scope === "city" && (
            <input
              value={locationName}
              onChange={event => setLocationName(event.target.value.slice(0, 160))}
              placeholder="اسم المدينة"
              className="h-9 w-44 rounded-lg border border-border bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          {scope === "community" && (
            <input
              value={communityName}
              onChange={event => setCommunityName(event.target.value.slice(0, 160))}
              placeholder="اسم المجتمع"
              className="h-9 w-44 rounded-lg border border-border bg-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>
        {isLoading ? <div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary" /></div> : !challenges?.length ? <Card className="p-12 text-center bg-card/60"><MapPin className="w-12 h-12 text-primary mx-auto mb-4" /><h2 className="font-bold text-xl">لا توجد تحديات نشطة في هذا التصنيف</h2><p className="text-muted-foreground mt-2">جرّب تصنيفًا آخر أو عد لاحقًا.</p></Card> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{challenges.map(challenge => <Card key={challenge.id} className="p-5 bg-card/70 border-border/70"><div className="flex items-center justify-between mb-4"><span className="inline-flex items-center gap-1 text-xs text-accent"><CalendarDays className="w-3 h-3" /> حتى {new Date(challenge.endsAt).toLocaleDateString("ar-EG")}</span><span className="rounded-full bg-accent/10 text-accent px-2 py-1 text-xs">+{challenge.rewardPoints} نقطة</span></div><h2 className="font-bold text-xl mb-2">{challenge.title}</h2><p className="text-sm text-muted-foreground leading-6 min-h-12">{challenge.description ?? "شارك بأفضل محتوى لديك وتنافس مع المجتمع."}</p><div className="flex items-center gap-3 text-xs text-muted-foreground mt-5"><span className="flex items-center gap-1">{challenge.scope === "city" ? <MapPin className="w-3 h-3" /> : challenge.scope === "community" ? <Users className="w-3 h-3" /> : <Globe2 className="w-3 h-3" />}{challenge.locationName ?? challenge.communityName ?? "تحدٍ عالمي"}</span><Link href={`/local-challenges/${challenge.id}`} className="mr-auto"><Button size="sm" variant="outline" className="gap-1">التفاصيل <ChevronLeft className="w-3 h-3" /></Button></Link></div></Card>)}</div>}
      </main>
    </div>
  );
}
