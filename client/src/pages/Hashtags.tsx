import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Hash, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function Hashtags() {
  const [, navigate] = useLocation();
  const { data: trendingTags, isLoading } = trpc.hashtag.trending.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">الهاشتاقات الرائجة</h1>
            <p className="text-muted-foreground text-sm">اكتشف المواضيع الأكثر شعبية</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : !trendingTags?.length ? (
          <div className="text-center py-16">
            <Hash className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد هاشتاقات بعد</h3>
            <p className="text-muted-foreground text-sm">ابدأ بنشر فيديوهات مع هاشتاقات!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingTags.map((tag, index) => (
              <Card
                key={tag.id}
                className="p-4 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 group"
                onClick={() => navigate(`/hashtag/${tag.name}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <Hash className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-semibold text-foreground truncate">{tag.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tag.videoCount} فيديو
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    <TrendingUp className="h-3 w-3 ml-1" />
                    رائج
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
