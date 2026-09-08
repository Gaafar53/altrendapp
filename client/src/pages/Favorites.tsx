"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import VideoCard from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Bookmark, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Favorites() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: favorites, isLoading } = trpc.favorite.userFavorites.useQuery(
    { limit: 20, offset: 0 },
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    document.title = "الفيديوهات المفضلة - الترند";
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <div className="container py-20">
          <div className="text-center max-w-md mx-auto">
            <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">سجل دخول أولاً</h1>
            <p className="text-muted-foreground mb-6">
              يجب أن تكون مسجل دخول لعرض الفيديوهات المفضلة
            </p>
            <Button onClick={() => navigate("/")} className="gap-2">
              العودة للرئيسية
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      {/* Header */}
      <section className="py-12 border-b border-border/50">
        <div className="container">
          <div className="flex items-center gap-3 mb-4">
            <Bookmark className="w-8 h-8 text-accent" />
            <h1 className="text-3xl md:text-4xl font-bold">الفيديوهات المفضلة</h1>
          </div>
          <p className="text-muted-foreground">
            {favorites?.length || 0} فيديو مفضل
          </p>
        </div>
      </section>

      {/* Favorites Grid */}
      <section className="py-12">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-video bg-secondary rounded-lg animate-pulse" />
              ))}
            </div>
          ) : favorites && favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favorites.map((video) => (
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
          ) : (
            <div className="text-center py-20">
              <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">لا توجد فيديوهات مفضلة</h2>
              <p className="text-muted-foreground mb-6">
                ابدأ بإضافة فيديوهات إلى المفضلة بالضغط على أيقونة الحفظ
              </p>
              <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
                استكشف الفيديوهات
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
