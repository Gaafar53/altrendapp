import { trpc } from "@/lib/trpc";
import VideoCard from "@/components/VideoCard";
import { Loader2, Hash, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";

export default function HashtagVideos() {
  const params = useParams<{ name: string }>();
  const [, navigate] = useLocation();
  const hashtagName = params.name ?? "";

  const { data: videos, isLoading } = trpc.hashtag.videos.useQuery(
    { name: hashtagName, limit: 30, offset: 0 },
    { enabled: !!hashtagName }
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/hashtags")}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Hash className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{hashtagName}</h1>
          </div>
          {videos && (
            <span className="text-muted-foreground text-sm">({videos.length} فيديو)</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : !videos?.length ? (
          <div className="text-center py-16">
            <Hash className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد فيديوهات</h3>
            <p className="text-muted-foreground text-sm">لم يتم نشر فيديوهات بهذا الهاشتاق بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(video => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
