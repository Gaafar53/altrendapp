import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Swords, Trophy, Clock, Users, ThumbsUp, ArrowRight, Crown, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation, useParams } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

export default function ChallengeDetail() {
  const params = useParams<{ id: string }>();
  const challengeId = parseInt(params.id ?? "0");
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [videoId, setVideoId] = useState("");
  const [submitOpen, setSubmitOpen] = useState(false);

  const { data: challenge, isLoading } = trpc.challenge.getById.useQuery(
    { id: challengeId },
    { enabled: challengeId > 0 }
  );

  const { data: entries, isLoading: entriesLoading, refetch: refetchEntries } = trpc.challenge.entries.useQuery(
    { challengeId },
    { enabled: challengeId > 0 }
  );

  const submitMutation = trpc.challenge.submit.useMutation({
    onSuccess: () => {
      toast.success("تم تقديم مشاركتك بنجاح!");
      setSubmitOpen(false);
      setVideoId("");
      refetchEntries();
    },
    onError: (err) => toast.error(err.message),
  });

  const voteMutation = trpc.challenge.vote.useMutation({
    onSuccess: (data) => {
      toast.success(data.voted ? "تم التصويت!" : "تم إلغاء التصويت");
      refetchEntries();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Swords className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">التحدي غير موجود</h2>
        <Button onClick={() => navigate("/challenges")}>العودة للتحديات</Button>
      </div>
    );
  }

  const isActive = challenge.status === "active";
  const isVoting = challenge.status === "voting";

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Back Button */}
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate("/challenges")}>
          <ArrowRight className="h-4 w-4" />
          العودة للتحديات
        </Button>

        {/* Challenge Header */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{challenge.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{challenge.title}</h1>
                <Badge className={
                  isActive ? "bg-green-500/20 text-green-400 border-green-500/30" :
                  isVoting ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                  "bg-muted text-muted-foreground"
                }>
                  {isActive ? "نشط" : isVoting ? "تصويت" : "منتهي"}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4">{challenge.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  ينتهي {formatDistanceToNow(new Date(challenge.endDate), { addSuffix: true, locale: ar })}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {challenge.participantCount} مشارك
                </span>
                <span className="flex items-center gap-1 text-accent font-medium">
                  <Trophy className="h-4 w-4" />
                  الجائزة: {challenge.prizePoints} نقطة
                </span>
              </div>
            </div>
          </div>

          {isAuthenticated && isActive && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-l from-primary to-accent text-white">
                    <Swords className="h-4 w-4" />
                    شارك في التحدي
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>المشاركة في التحدي</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      أدخل رقم الفيديو الذي تريد المشاركة به في هذا التحدي.
                      يمكنك إيجاد رقم الفيديو من رابط صفحة الفيديو.
                    </p>
                    <Input
                      type="number"
                      placeholder="رقم الفيديو (مثال: 5)"
                      value={videoId}
                      onChange={e => setVideoId(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      disabled={!videoId || submitMutation.isPending}
                      onClick={() => submitMutation.mutate({ challengeId, videoId: parseInt(videoId) })}
                    >
                      {submitMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : null}
                      تقديم المشاركة
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </Card>

        {/* Entries */}
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          المشاركات ({entries?.length ?? 0})
        </h2>

        {entriesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
          </div>
        ) : !entries?.length ? (
          <Card className="p-8 text-center border-dashed">
            <Play className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">لا توجد مشاركات بعد</h3>
            <p className="text-muted-foreground text-sm">كن أول من يشارك في هذا التحدي!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <Card
                key={entry.id}
                className={`p-4 transition-all ${entry.isWinner ? "border-accent bg-accent/5" : "hover:border-border"}`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    index === 0 ? "bg-amber-500/20 text-amber-400" :
                    index === 1 ? "bg-gray-400/20 text-gray-400" :
                    index === 2 ? "bg-orange-600/20 text-orange-500" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {entry.isWinner ? <Crown className="h-5 w-5" /> : `#${index + 1}`}
                  </div>

                  {/* User Info */}
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => navigate(`/profile/${entry.userId}`)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.userAvatar ?? undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {(entry.userName ?? "م")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground text-sm hover:text-primary transition-colors">
                      {entry.userName ?? "مستخدم"}
                    </span>
                  </div>

                  {/* Video Link */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => navigate(`/video/${entry.videoId}`)}
                  >
                    <Play className="h-3 w-3" />
                    شاهد الفيديو
                  </Button>

                  <div className="flex-1" />

                  {/* Vote */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{entry.voteCount}</span>
                    {isAuthenticated && (isActive || isVoting) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => voteMutation.mutate({ entryId: entry.id })}
                        disabled={voteMutation.isPending}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        صوّت
                      </Button>
                    )}
                  </div>

                  {entry.isWinner && (
                    <Badge className="bg-accent/20 text-accent border-accent/30 gap-1">
                      <Crown className="h-3 w-3" />
                      الفائز
                    </Badge>
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
