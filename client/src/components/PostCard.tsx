import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Share2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

type PostBlock = {
  id: number;
  blockType: "text" | "image" | "video";
  textContent?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  blockOrder: number;
};

type PostCardProps = {
  post: {
    id: number;
    userId: number;
    createdAt: Date;
    blocks: PostBlock[];
  };
};

export default function PostCard({ post }: PostCardProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: liked } = trpc.post.isLiked.useQuery({ postId: post.id }, { enabled: isAuthenticated });
  const toggleLike = trpc.post.toggleLike.useMutation({
    onSuccess: () => utils.post.isLiked.invalidate({ postId: post.id }),
    onError: error => toast.error(error.message),
  });

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: "منشور من الترند", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("تم نسخ رابط المنشور");
      }
    } catch {
      // المستخدم أغلق نافذة المشاركة؛ لا حاجة لعرض خطأ.
    }
  };

  return (
    <Card className="overflow-hidden bg-card/70 border-border/70">
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center"><UserRound className="w-4 h-4 text-primary" /></div>
        <div>
          <Link href={`/profile/${post.userId}`} className="text-sm font-semibold text-foreground hover:text-primary">مستخدم الترند</Link>
          <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString("ar-EG")}</p>
        </div>
      </div>
      <div className="divide-y divide-border/40">
        {post.blocks.map(block => (
          <div key={block.id} className="p-4">
            {block.blockType === "text" && <p className="whitespace-pre-line leading-8 text-foreground">{block.textContent}</p>}
            {block.blockType === "image" && block.mediaUrl && <img src={block.mediaUrl} alt="محتوى المنشور" loading="lazy" className="max-h-[34rem] w-full object-contain rounded-xl bg-black/20" />}
            {block.blockType === "video" && block.mediaUrl && <video src={block.mediaUrl} poster={block.thumbnailUrl ?? undefined} controls preload="metadata" className="max-h-[34rem] w-full rounded-xl bg-black/20" />}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 p-3 border-t border-border/50">
        <Button variant="ghost" size="sm" className={`gap-2 ${liked ? "text-rose-400" : "text-muted-foreground"}`} disabled={!isAuthenticated || toggleLike.isPending} onClick={() => toggleLike.mutate({ postId: post.id })}>
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} /> {liked ? "أعجبني" : "إعجاب"}
        </Button>
        <Link href={`/post/${post.id}`}><Button variant="ghost" size="sm" className="text-muted-foreground">التعليقات</Button></Link>
        <Button variant="ghost" size="sm" className="gap-2 mr-auto text-muted-foreground" onClick={handleShare}><Share2 className="w-4 h-4" /> مشاركة</Button>
      </div>
    </Card>
  );
}
