import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Swords, Trophy, Clock, Users, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function Challenges() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: activeChallenges, isLoading: activeLoading } = trpc.challenge.active.useQuery();
  const { data: allChallenges, isLoading: allLoading } = trpc.challenge.all.useQuery();

  const completedChallenges = allChallenges?.filter(c => c.status === "completed") ?? [];

  const statusLabel = (status: string) => {
    switch (status) {
      case "active": return { text: "نشط", color: "bg-green-500/20 text-green-400 border-green-500/30" };
      case "voting": return { text: "تصويت", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      case "completed": return { text: "منتهي", color: "bg-muted text-muted-foreground border-border" };
      default: return { text: status, color: "" };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
            <Swords className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">التحديات الأسبوعية</h1>
            <p className="text-muted-foreground text-sm">شارك في التحديات وفز بنقاط مضاعفة وشارات مميزة</p>
          </div>
        </div>

        {/* Active Challenges */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            التحديات النشطة
          </h2>

          {activeLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : !activeChallenges?.length ? (
            <Card className="p-8 text-center border-dashed">
              <Swords className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">لا توجد تحديات نشطة حالياً</h3>
              <p className="text-muted-foreground text-sm">ترقب التحديات القادمة!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChallenges.map(challenge => {
                const status = statusLabel(challenge.status);
                const now = new Date();
                const end = new Date(challenge.endDate);
                const start = new Date(challenge.startDate);
                const total = end.getTime() - start.getTime();
                const elapsed = now.getTime() - start.getTime();
                const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));

                return (
                  <Card
                    key={challenge.id}
                    className="p-5 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 group"
                    onClick={() => navigate(`/challenge/${challenge.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{challenge.emoji}</span>
                        <div>
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {challenge.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {challenge.description}
                          </p>
                        </div>
                      </div>
                      <Badge className={status.color}>{status.text}</Badge>
                    </div>

                    <div className="space-y-2">
                      <Progress value={progress} className="h-1.5" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ينتهي {formatDistanceToNow(end, { addSuffix: true, locale: ar })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {challenge.participantCount} مشارك
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-accent flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          الجائزة: {challenge.prizePoints} نقطة
                        </span>
                        <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              التحديات المنتهية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedChallenges.map(challenge => (
                <Card
                  key={challenge.id}
                  className="p-4 cursor-pointer hover:border-border transition-all opacity-75 hover:opacity-100"
                  onClick={() => navigate(`/challenge/${challenge.id}`)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{challenge.emoji}</span>
                    <h3 className="font-semibold text-foreground text-sm">{challenge.title}</h3>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{challenge.participantCount} مشارك</span>
                    <Badge variant="secondary" className="text-[10px]">منتهي</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
