import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import VideoCard from "@/components/VideoCard";
import { Users, Loader2, Video } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Feed() {
  const { user, isAuthenticated, loading } = useAuth();

  const { data: feedVideos, isLoading } = trpc.follow.feed.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: userLikes } = trpc.like.userLikes.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">سجل دخولك لمشاهدة فيد المتابعين</h2>
          <p className="text-muted-foreground mb-4">تابع مستخدمين آخرين لمشاهدة فيديوهاتهم هنا</p>
          <Button asChild className="bg-gradient-to-l from-primary to-accent text-white">
            <a href={getLoginUrl()}>تسجيل الدخول</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container py-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-7 h-7 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">فيد المتابعين</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !feedVideos || feedVideos.length === 0 ? (
          <div className="text-center py-20">
            <Video className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">لا توجد فيديوهات بعد</h3>
            <p className="text-muted-foreground mb-6">تابع مستخدمين آخرين لمشاهدة فيديوهاتهم هنا</p>
            <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
              <Link href="/trending">اكتشف الترند</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedVideos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnailUrl={video.thumbnailUrl}
                videoUrl={video.videoUrl}
                viewCount={video.viewCount}
                likeCount={video.likeCount}
                commentCount={video.commentCount}
                createdAt={video.createdAt}
                userName={video.userName}
                userAvatar={video.userAvatar}
                userId={video.userId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
