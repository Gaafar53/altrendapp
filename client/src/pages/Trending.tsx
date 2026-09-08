import { trpc } from "@/lib/trpc";
import VideoCard from "@/components/VideoCard";
import Navbar from "@/components/Navbar";
import { Flame, Loader2 } from "lucide-react";

export default function Trending() {
  const { data: videos, isLoading } = trpc.video.trending.useQuery({ limit: 30, offset: 0 });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      {/* Header */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-transparent" />
        <div className="container relative text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-4">
            <Flame className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent">الأكثر رواجاً</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold gradient-text mb-2">الترند</h1>
          <p className="text-muted-foreground">أكثر الفيديوهات شعبية بناءً على المشاهدات والإعجابات</p>
        </div>
      </section>

      {/* Videos Grid */}
      <section className="container pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="space-y-6">
            {/* Top 3 Featured */}
            {videos.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {videos.slice(0, 3).map((video, index) => (
                  <div key={video.id} className="relative">
                    <div className={`absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? "bg-yellow-500 text-black" :
                      index === 1 ? "bg-gray-300 text-black" :
                      "bg-amber-700 text-white"
                    }`}>
                      {index + 1}
                    </div>
                    <VideoCard {...video} createdAt={video.createdAt} />
                  </div>
                ))}
              </div>
            )}

            {/* Rest of videos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.slice(3).map((video) => (
                <VideoCard key={video.id} {...video} createdAt={video.createdAt} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <Flame className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد فيديوهات في الترند بعد</h3>
            <p className="text-muted-foreground">كن أول من ينشر فيديو ويبدأ الترند!</p>
          </div>
        )}
      </section>
    </div>
  );
}
