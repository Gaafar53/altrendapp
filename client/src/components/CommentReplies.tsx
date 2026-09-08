import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface CommentRepliesProps {
  commentId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentReplies({ commentId, isOpen, onClose }: CommentRepliesProps) {
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: replies, isLoading, refetch } = trpc.reply.list.useQuery(
    { commentId },
    { enabled: isOpen }
  );

  const addReplyMutation = trpc.reply.add.useMutation({
    onSuccess: () => {
      setReplyContent("");
      refetch();
    },
  });

  const deleteReplyMutation = trpc.reply.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleAddReply = async () => {
    if (!replyContent.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      await addReplyMutation.mutateAsync({
        commentId,
        content: replyContent,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-sm">الردود ({replies?.length || 0})</h4>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      {/* Add Reply Form */}
      {user && (
        <div className="mb-4 p-3 bg-background rounded-lg border border-border">
          <Textarea
            placeholder="اكتب ردك..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="mb-2 resize-none"
            rows={2}
          />
          <Button
            onClick={handleAddReply}
            disabled={!replyContent.trim() || isSubmitting}
            size="sm"
            className="w-full"
          >
            {isSubmitting ? "جاري الإرسال..." : "إرسال الرد"}
          </Button>
        </div>
      )}

      {/* Replies List */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        ) : replies && replies.length > 0 ? (
          replies.map((reply: any) => (
            <div key={reply.id} className="p-3 bg-background rounded-lg border border-border">
              <div className="flex items-start gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={reply.userAvatar} />
                  <AvatarFallback>{reply.userName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{reply.userName}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.createdAt), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1 break-words">{reply.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Heart className="w-3 h-3" />
                      <span>{reply.likeCount}</span>
                    </button>
                    {user?.id === reply.userId && (
                      <button
                        onClick={() =>
                          deleteReplyMutation.mutate({ replyId: reply.id })
                        }
                        className="flex items-center gap-1 text-xs text-destructive hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد ردود حتى الآن</p>
        )}
      </div>
    </div>
  );
}
