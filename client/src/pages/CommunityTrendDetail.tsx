import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUp, Clock3, Loader2, Send, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

export default function CommunityTrendDetail() {
  const { id } = useParams<{ id: string }>();
  const trendId = Number(id);
  const { isAuthenticated, user } = useAuth();
  const [contentType, setContentType] = useState<"video" | "post">("video");
  const [contentId, setContentId] = useState("");
  const [caption, setCaption] = useState("");
  const { data: trend, isLoading } = trpc.communityTrend.getById.useQuery({ trendId }, { enabled: Number.isFinite(trendId) });
  const { data: userVideos } = trpc.video.getUserVideos.useQuery({ userId: user?.id ?? 0, limit: 50, offset: 0 }, { enabled: Boolean(user?.id) });
  const { data: userPosts } = trpc.post.byUser.useQuery({ userId: user?.id ?? 0 }, { enabled: Boolean(user?.id) });
  const utils = trpc.useUtils();
  const join = trpc.communityTrend.join.useMutation({
    onSuccess: async () => {
      toast.success("تمت إضافتك إلى الترند الجماعي");
      setContentId("");
      await utils.communityTrend.getById.invalidate({ trendId });
    },
    onError: error => toast.error(error.message),
  });
  const vote = trpc.communityTrend.vote.useMutation({
    onSuccess: async () => {
      await utils.communityTrend.getById.invalidate({ trendId });
    },
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary" /></div></div>;
  }
  if (!trend) {
    return <div className="min-h-screen bg-background"><Navbar /><p className="text-center py-24 text-muted-foreground">الترند غير موجود أو انتهى</p></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container max-w-4xl py-8">
        <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/15 via-card to-accent/10 border-primary/20 mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="inline-flex items-center gap-1 text-sm text-accent"><Trophy className="w-4 h-4" /> ترند جماعي نشط</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock3 className="w-3 h-3" /> ينتهي {new Date(trend.expiresAt).toLocaleDateString("ar-EG")}</span>
          </div>
          <h1 className="text-3xl font-bold">{trend.title}</h1>
          <p className="text-muted-foreground mt-3 leading-7">{trend.description ?? trend.prompt}</p>
          <div className="mt-5 rounded-2xl bg-background/40 p-4"><p className="text-sm"><span className="text-accent font-semibold">نفّذ الفكرة: </span>{trend.prompt}</p></div>
          <div className="flex items-center gap-4 mt-5 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Users className="w-4 h-4" /> {trend.participantCount} مشارك</span></div>
        </Card>

        {isAuthenticated && (
          <Card className="p-5 bg-card/70 border-border/70 mb-6">
            <h2 className="font-bold mb-4">أضف مشاركتك</h2>
            <div className="flex gap-2 mb-3">
              <Button size="sm" variant={contentType === "video" ? "default" : "outline"} onClick={() => setContentType("video")}>فيديو</Button>
              <Button size="sm" variant={contentType === "post" ? "default" : "outline"} onClick={() => setContentType("post")}>منشور</Button>
            </div>
            <div className="grid md:grid-cols-[140px_1fr] gap-3">
              <select value={contentId} onChange={event => setContentId(event.target.value)} className="rounded-xl border border-border bg-input px-3"><option value="">اختر {contentType === "video" ? "فيديو" : "منشورًا"}</option>{contentType === "video" ? userVideos?.map(video => <option key={video.id} value={video.id}>{video.title}</option>) : userPosts?.map(post => <option key={post.id} value={post.id}>منشور #{post.id}</option>)}</select>
              <input value={caption} onChange={event => setCaption(event.target.value.slice(0, 280))} placeholder="تعليق قصير على المشاركة (اختياري)" className="rounded-xl border border-border bg-input px-3" />
            </div>
            <Button className="mt-3 gap-2" disabled={!contentId || join.isPending} onClick={() => join.mutate({ trendId, ...(contentType === "video" ? { videoId: Number(contentId) } : { postId: Number(contentId) }), caption: caption || undefined })}>{join.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} مشاركة في الترند</Button>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {trend.entries.map((entry, index) => (
            <Card key={entry.id} className="p-5 bg-card/70 border-border/70">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-2 text-sm font-semibold"><span className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center">{index + 1}</span> مشاركة المجتمع</span>
                <Button variant="ghost" size="sm" className="gap-1 text-accent" onClick={() => vote.mutate({ entryId: entry.id })}><ArrowUp className="w-4 h-4" /> {entry.votes}</Button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{entry.caption ?? "مشاركة في الترند الجماعي"}</p>
              {entry.video ? (
                <video src={entry.video.videoUrl} poster={entry.video.thumbnailUrl ?? undefined} controls preload="metadata" className="max-h-72 w-full rounded-xl bg-black" />
              ) : entry.post ? (
                <div className="space-y-2">
                  {entry.post.blocks.slice(0, 3).map(block => {
                    if (block.blockType === "text") return <p key={block.id} className="whitespace-pre-line text-sm leading-6">{block.textContent}</p>;
                    if (block.blockType === "image") return <img key={block.id} src={block.mediaUrl ?? ""} alt="مشاركة" className="max-h-60 w-full object-contain rounded-xl" loading="lazy" />;
                    return <video key={block.id} src={block.mediaUrl ?? ""} controls preload="metadata" className="max-h-60 w-full rounded-xl bg-black" />;
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground">{entry.videoId ? `فيديو رقم ${entry.videoId}` : `منشور رقم ${entry.postId}`}</div>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
