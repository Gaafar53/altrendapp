import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Loader2, Send, Share2, UserRound } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const { isAuthenticated } = useAuth();
  const [comment, setComment] = useState("");
  const { data: post, isLoading } = trpc.post.getById.useQuery({ postId }, { enabled: Number.isFinite(postId) });
  const { data: comments } = trpc.post.comments.useQuery({ postId }, { enabled: Number.isFinite(postId) });
  const { data: liked } = trpc.post.isLiked.useQuery({ postId }, { enabled: isAuthenticated && Number.isFinite(postId) });
  const utils = trpc.useUtils();
  const toggleLike = trpc.post.toggleLike.useMutation({ onSuccess: () => utils.post.isLiked.invalidate({ postId }) });
  const addComment = trpc.post.addComment.useMutation({
    onSuccess: async () => {
      setComment("");
      await utils.post.comments.invalidate({ postId });
      toast.success("تمت إضافة تعليقك");
    },
    onError: error => toast.error(error.message),
  });

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: "منشور من الترند", url });
      else { await navigator.clipboard.writeText(url); toast.success("تم نسخ الرابط"); }
    } catch { /* إغلاق المشاركة ليس خطأ */ }
  };

  if (isLoading) return <div className="min-h-screen bg-background"><Navbar /><div className="flex justify-center py-24"><Loader2 className="animate-spin text-primary" /></div></div>;
  if (!post) return <div className="min-h-screen bg-background"><Navbar /><p className="text-center py-24 text-muted-foreground">المنشور غير موجود</p></div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container max-w-2xl py-8">
        <Card className="overflow-hidden bg-card/70 border-border/70">
          <div className="flex items-center gap-3 p-4 border-b border-border/50"><div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center"><UserRound className="w-4 h-4 text-primary" /></div><div><p className="font-semibold">منشور من الترند</p><p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString("ar-EG")}</p></div></div>
          <div className="divide-y divide-border/40">{post.blocks.map(block => <div key={block.id} className="p-4">{block.blockType === "text" && <p className="whitespace-pre-line leading-8">{block.textContent}</p>}{block.blockType === "image" && block.mediaUrl && <img src={block.mediaUrl} alt="محتوى المنشور" className="max-h-[38rem] w-full object-contain rounded-xl" />}{block.blockType === "video" && block.mediaUrl && <video src={block.mediaUrl} controls preload="metadata" className="max-h-[38rem] w-full rounded-xl bg-black" />}</div>)}</div>
          <div className="flex items-center gap-2 p-3 border-t border-border/50"><Button variant="ghost" className={liked ? "text-rose-400" : "text-muted-foreground"} disabled={!isAuthenticated || toggleLike.isPending} onClick={() => toggleLike.mutate({ postId })}><Heart className={`w-4 h-4 ml-2 ${liked ? "fill-current" : ""}`} />إعجاب</Button><Button variant="ghost" className="mr-auto text-muted-foreground" onClick={share}><Share2 className="w-4 h-4 ml-2" />مشاركة</Button></div>
        </Card>

        <Card className="mt-5 p-5 bg-card/70 border-border/70"><h2 className="font-bold mb-4">التعليقات</h2>{isAuthenticated && <div className="flex gap-2 mb-5"><input value={comment} onChange={event => setComment(event.target.value.slice(0, 500))} placeholder="اكتب تعليقك..." className="flex-1 rounded-xl border border-border bg-input px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /><Button size="icon" disabled={!comment.trim() || addComment.isPending} onClick={() => addComment.mutate({ postId, content: comment.trim() })}><Send className="w-4 h-4" /></Button></div>}{comments?.length ? <div className="space-y-3">{comments.map(item => <div key={item.id} className="rounded-xl bg-secondary/40 p-3"><p className="text-xs text-muted-foreground mb-1">مستخدم الترند</p><p className="text-sm">{item.content}</p></div>)}</div> : <p className="text-sm text-muted-foreground">لا توجد تعليقات بعد. كن أول من يشارك رأيه.</p>}</Card>
      </main>
    </div>
  );
}
