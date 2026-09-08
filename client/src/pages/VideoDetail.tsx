import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Heart, Eye, MessageCircle, Send, Loader2, Trash2, Share2, Hash, MessageSquare } from "lucide-react";
import ShareDialog from "@/components/ShareDialog";
import { useParams } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { getLoginUrl } from "@/const";
import { useSEO, useStructuredData } from "@/hooks/useSEO";

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const videoId = parseInt(id ?? "0");
  const { user, isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  const { data: video, isLoading } = trpc.video.getById.useQuery({ id: videoId }, { enabled: videoId > 0 });
  const { data: comments, refetch: refetchComments } = trpc.comment.list.useQuery({ videoId }, { enabled: videoId > 0 });
  const { data: userLikes } = trpc.like.userLikes.useQuery(undefined, { enabled: isAuthenticated });

  useSEO({
    title: video ? `${video.title} - الترند` : "تحميل الفيديو - الترند",
    description: video?.description || "شاهد هذا الفيديو على الترند",
    keywords: "فيديو، ترند، مشاركة",
    image: video?.thumbnailUrl || undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  useStructuredData(video ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.description,
    "thumbnailUrl": video.thumbnailUrl,
    "uploadDate": video.createdAt,
  } : {});

  const stableVideoId = useMemo(() => videoId, [videoId]);

  const recordView = trpc.video.recordView.useMutation();
  const toggleLike = trpc.like.toggle.useMutation({
    onMutate: () => {
      setIsLiked((prev) => !prev);
    },
    onError: () => {
      setIsLiked((prev) => !prev);
      toast.error("حدث خطأ");
    },
    onSuccess: () => {
      utils.video.getById.invalidate({ id: videoId });
    },
  });
  const addComment = trpc.comment.add.useMutation({
    onSuccess: () => {
      setCommentText("");
      refetchComments();
      utils.video.getById.invalidate({ id: videoId });
      toast.success("تم إضافة التعليق");
    },
    onError: () => toast.error("حدث خطأ"),
  });
  const deleteComment = trpc.comment.delete.useMutation({
    onSuccess: () => {
      refetchComments();
      toast.success("تم حذف التعليق");
    },
  });

  const utils = trpc.useUtils();

  useEffect(() => {
    if (stableVideoId > 0) {
      recordView.mutate({ videoId: stableVideoId });
    }
  }, [stableVideoId]);

  useEffect(() => {
    if (userLikes) {
      setIsLiked(userLikes.includes(videoId));
    }
  }, [userLikes, videoId]);

  const handleLike = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    toggleLike.mutate({ videoId });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!commentText.trim()) return;
    addComment.mutate({ videoId, content: commentText.trim() });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-32">
          <h2 className="text-xl font-bold text-foreground">الفيديو غير موجود</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl overflow-hidden bg-black">
              <video
                src={video.videoUrl}
                controls
                autoPlay
                className="w-full max-h-[70vh] object-contain"
              />
            </div>

            {/* Video Info */}
            <div className="space-y-3">
              <h1 className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">{video.title}</h1>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <a href={`/profile/${video.userId}`} className="flex items-center gap-2 no-underline">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={video.userAvatar ?? undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {video.userName?.charAt(0) ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground hover:text-primary transition-colors">
                      {video.userName ?? "مستخدم"}
                    </span>
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <Eye className="w-4 h-4" />
                    {video.viewCount}
                  </div>
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    className={`gap-1.5 ${isLiked ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : ""}`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                    {video.likeCount}
                  </Button>
                  <ShareDialog videoId={videoId} title={video.title}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Share2 className="w-4 h-4" />
                      مشاركة
                    </Button>
                  </ShareDialog>
                  {isAuthenticated && video.userId !== user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => window.location.href = `/messages`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      راسل
                    </Button>
                  )}
                </div>
              </div>

              {video.description && (
                <Card className="bg-secondary/30 border-border/30 p-4">
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{video.description}</p>
                </Card>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">التعليقات ({video.commentCount})</h2>
            </div>

            {/* Add Comment */}
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isAuthenticated ? "أضف تعليقاً..." : "سجل دخولك للتعليق"}
                maxLength={500}
                className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!isAuthenticated}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!commentText.trim() || addComment.isPending}
                className="bg-primary"
              >
                {addComment.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>

            {/* Comments List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <Card key={comment.id} className="bg-card/50 border-border/30 p-3">
                    <div className="flex items-start gap-2">
                      <a href={`/profile/${comment.userId}`}>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.userAvatar ?? undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {comment.userName?.charAt(0) ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                      </a>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{comment.userName ?? "مستخدم"}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ar })}
                            </span>
                            {user?.id === comment.userId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6 text-destructive hover:text-destructive"
                                onClick={() => deleteComment.mutate({ commentId: comment.id })}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">لا توجد تعليقات بعد</p>
                  <p className="text-xs text-muted-foreground">كن أول من يعلق!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
