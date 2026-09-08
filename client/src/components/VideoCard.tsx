"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Eye, Heart, MessageCircle, Bookmark } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type VideoCardProps = {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  videoUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  userName?: string | null;
  userAvatar?: string | null;
  userId: number;
};

export default function VideoCard({
  id,
  title,
  thumbnailUrl,
  videoUrl,
  viewCount,
  likeCount,
  commentCount,
  createdAt,
  userName,
  userAvatar,
  userId,
}: VideoCardProps) {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ar });
  const { isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const checkFavorite = trpc.favorite.isFavorite.useQuery(
    { videoId: id },
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (checkFavorite.data !== undefined) {
      setIsFavorited(checkFavorite.data);
    }
  }, [checkFavorite.data]);

  const addFavoriteMutation = trpc.favorite.add.useMutation({
    onSuccess: () => {
      setIsFavorited(true);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    },
  });

  const removeFavoriteMutation = trpc.favorite.remove.useMutation({
    onSuccess: () => {
      setIsFavorited(false);
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    if (isFavorited) {
      removeFavoriteMutation.mutate({ videoId: id });
    } else {
      addFavoriteMutation.mutate({ videoId: id });
    }
  };

  return (
    <Link href={`/video/${id}`}>
      <Card className="overflow-hidden bg-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:glow-primary group cursor-pointer">
        {/* Thumbnail / Video Preview */}
        <div className="relative aspect-video bg-secondary overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <video
              src={videoUrl}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              muted
              preload="metadata"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
          >
            <Bookmark
              className={`w-5 h-5 transition-all duration-300 ${
                isFavorited
                  ? "fill-accent text-accent scale-110"
                  : "text-white"
              } ${isAnimating ? "animate-pulse" : ""}`}
            />
          </button>

          <div className="absolute bottom-2 right-2 flex items-center gap-3 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {likeCount}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm text-card-foreground line-clamp-2 mb-2 leading-relaxed">
            {title}
          </h3>
          <div className="flex items-center justify-between">
            <Link href={`/profile/${userId}`} className="flex items-center gap-2 no-underline" onClick={(e) => e.stopPropagation()}>
              <Avatar className="w-6 h-6">
                <AvatarImage src={userAvatar ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                  {userName?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {userName ?? "مستخدم"}
              </span>
            </Link>
            <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
              <span className="flex items-center gap-0.5">
                <MessageCircle className="w-3 h-3" />
                {commentCount}
              </span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
