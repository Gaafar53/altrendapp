import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Loader2, Crown, Trophy, Medal, Star } from "lucide-react";
import { useLocation } from "wouter";

function calculateLevel(points: number) {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
  const names = ["مبتدئ", "نشيط", "مميز", "محترف", "خبير", "نجم", "أسطورة", "ملك", "إمبراطور", "أسطورة حية"];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i]) return { level: i + 1, name: names[i] };
  }
  return { level: 1, name: names[0] };
}

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const { data: leaderboard, isLoading } = trpc.leaderboard.top.useQuery({ limit: 50 });
  const { data: winners } = trpc.competition.recentWinners.useQuery({ limit: 6 });

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return { bg: "bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-500/40", icon: <Crown className="h-6 w-6 text-amber-400" />, badge: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      case 2: return { bg: "bg-gradient-to-br from-gray-400/10 to-gray-300/10 border-gray-400/30", icon: <Medal className="h-6 w-6 text-gray-400" />, badge: "bg-gray-400/20 text-gray-400 border-gray-400/30" };
      case 3: return { bg: "bg-gradient-to-br from-orange-600/10 to-orange-500/10 border-orange-500/30", icon: <Medal className="h-6 w-6 text-orange-500" />, badge: "bg-orange-500/20 text-orange-500 border-orange-500/30" };
      default: return { bg: "", icon: null, badge: "" };
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-accent/20 mb-4">
            <Trophy className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">لوحة المتصدرين</h1>
          <p className="text-muted-foreground text-sm mt-1">أكثر المستخدمين نشاطاً وتفاعلاً</p>
        </div>

        {winners && winners.length > 0 && (
          <Card className="p-5 mb-6 bg-gradient-to-br from-accent/10 to-card border-accent/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-accent" /> أبطال المسابقات</h2>
                <p className="text-sm text-muted-foreground mt-1">فائزون حصلوا على جوائز رمزية تضاف إلى إنجازاتهم.</p>
              </div>
              <button className="text-sm text-primary hover:underline" onClick={() => navigate("/competitions")}>المسابقات</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {winners.map(winner => (
                <button key={winner.rewardId} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 p-3 text-right hover:border-accent/50 transition-colors" onClick={() => navigate(`/profile/${winner.userId}`)}>
                  <Avatar className="h-10 w-10"><AvatarImage src={winner.avatarUrl ?? undefined} /><AvatarFallback className="bg-accent/15 text-accent">{(winner.userName ?? "ف")[0]}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1"><p className="font-semibold text-sm truncate">{winner.userName ?? "فائز في المسابقة"}</p><p className="text-xs text-muted-foreground truncate">{winner.competitionTitle ?? "مسابقة الترند"}</p></div>
                  <div className="text-left"><Badge className="bg-accent/15 text-accent border-accent/20 text-[10px]">{winner.title}</Badge><p className="text-xs text-primary mt-1">+{winner.pointsAwarded}</p></div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : !leaderboard?.length ? (
          <Card className="p-8 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">لا يوجد متصدرين بعد</h3>
            <p className="text-muted-foreground text-sm">ابدأ بالتفاعل لتظهر في القائمة!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Top 3 Podium */}
            {leaderboard.length > 0 && (
              <div className={`grid gap-3 mb-6 ${leaderboard.length === 1 ? "grid-cols-1 max-w-xs mx-auto" : leaderboard.length === 2 ? "grid-cols-2 max-w-xl mx-auto" : "grid-cols-3"}`}>
                {[1, 0, 2].filter(idx => idx < leaderboard.length).map(idx => {
                  const entry = leaderboard[idx];
                  if (!entry) return null;
                  const rank = idx + 1;
                  const rankStyle = getRankStyle(rank);
                  const levelInfo = calculateLevel(entry.totalPoints);
                  return (
                    <Card
                      key={entry.id}
                      className={`p-4 text-center cursor-pointer transition-all hover:shadow-lg ${rankStyle.bg} ${idx === 0 ? "md:-mt-4" : ""}`}
                      onClick={() => navigate(`/profile/${entry.id}`)}
                    >
                      <div className="flex justify-center mb-2">{rankStyle.icon}</div>
                      <Avatar className={`mx-auto mb-2 ${idx === 0 ? "h-16 w-16" : "h-12 w-12"}`}>
                        <AvatarImage src={entry.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {(entry.name ?? "م")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold text-foreground text-sm truncate">{entry.name ?? "مستخدم"}</h3>
                      <Badge className={`mt-1 text-[10px] ${rankStyle.badge}`}>
                        {levelInfo.name}
                      </Badge>
                      <p className="text-primary font-bold mt-2">{entry.totalPoints.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">نقطة</p>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Rest of leaderboard */}
            {leaderboard.slice(3).map((entry, idx) => {
              const rank = idx + 4;
              const levelInfo = calculateLevel(entry.totalPoints);
              return (
                <Card
                  key={entry.id}
                  className="p-3 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-all"
                  onClick={() => navigate(`/profile/${entry.id}`)}
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                    {rank}
                  </div>
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={entry.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {(entry.name ?? "م")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm truncate">{entry.name ?? "مستخدم"}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3" />
                      المستوى {levelInfo.level} - {levelInfo.name}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-bold text-primary text-sm">{entry.totalPoints.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">نقطة</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
