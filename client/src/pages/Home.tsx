import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import VideoCard from "@/components/VideoCard";
import PostCard from "@/components/PostCard";
import StoriesTray from "@/components/StoriesTray";
import Navbar from "@/components/Navbar";
import { Flame, Upload, Dices, TrendingUp, Loader2, Trophy, FileText, Sparkles, MapPinned, Users } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: latestVideos, isLoading } = trpc.video.latest.useQuery({ limit: 12, offset: 0 });
  const { data: trendingVideos } = trpc.video.trending.useQuery({ limit: 4, offset: 0 });
  const { data: communityPosts } = trpc.post.latest.useQuery({ limit: 4, offset: 0 });

  // SEO: تعيين عنوان ووصف الصفحة الرئيسية
  useEffect(() => {
    document.title = "الترند - منصة مشاركة الفيديوهات الاجتماعية";
    // تحديث meta description ديناميكياً
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      (metaDesc as HTMLMetaElement).name = 'description';
      document.head.appendChild(metaDesc);
    }
    (metaDesc as HTMLMetaElement).content = "الترند منصة اجتماعية لمشاركة الفيديوهات والتفاعل مع المحتوى. انشر فيديوهاتك، اكتشف الترند، وشارك في التحديات الأسبوعية لتربح نقاطاً ومستويات.";
    return () => {
      document.title = "الترند - منصة مشاركة الفيديوهات الاجتماعية";
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <StoriesTray />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="container relative">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Flame className="w-4 h-4 text-accent" />
              <span className="text-sm text-primary">منصة الفيديو الأولى</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
              <span className="gradient-text">الترند</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              شارك فيديوهاتك، تفاعل مع المحتوى، واكسب نقاط يومية من عجلة الحظ.
              <br />
              كل تفاعل يقربك من المستوى التالي!
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {isAuthenticated ? (
                <>
                  <Link href="/upload">
                    <Button size="lg" className="gap-2 bg-gradient-to-l from-primary to-accent text-white hover:opacity-90 glow-primary">
                      <Upload className="w-5 h-5" />
                      نشر فيديو جديد
                    </Button>
                  </Link>
                  <Link href="/spin">
                    <Button size="lg" variant="outline" className="gap-2 border-accent/50 text-accent hover:bg-accent/10">
                      <Dices className="w-5 h-5" />
                      عجلة الحظ اليومية
                    </Button>
                  </Link>
                </>
              ) : (
                <Button
                  size="lg"
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="gap-2 bg-gradient-to-l from-primary to-accent text-white hover:opacity-90 glow-primary"
                >
                  ابدأ الآن - سجل دخولك
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Signature Features */}
      <section className="container mb-12">
        <div className="flex items-end justify-between mb-5"><div><p className="text-xs text-accent font-semibold">تجربة مختلفة</p><h2 className="text-2xl font-bold">الترند أكثر من فيديو</h2></div><p className="text-sm text-muted-foreground hidden sm:block">شارك، نافس، وخلّي فكرتك تتحول إلى حركة جماعية</p></div>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/community-trends"><div className="group rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 to-card p-5 hover:border-primary/50 transition-colors"><Sparkles className="w-7 h-7 text-primary mb-4" /><h3 className="font-bold mb-2">ترند جماعي</h3><p className="text-sm text-muted-foreground leading-6">انضم إلى فكرة واحدة وصوّت للمشاركة الأقوى.</p></div></Link>
          <Link href="/local-challenges"><div className="group rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/15 to-card p-5 hover:border-accent/50 transition-colors"><MapPinned className="w-7 h-7 text-accent mb-4" /><h3 className="font-bold mb-2">تحديات محلية</h3><p className="text-sm text-muted-foreground leading-6">نافس مدينتك أو مجتمعك واربح نقاطًا وشارات.</p></div></Link>
          <Link href="/content-assistant"><div className="group rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-5 hover:border-primary/50 transition-colors"><Users className="w-7 h-7 text-primary mb-4" /><h3 className="font-bold mb-2">مساعد صناعة المحتوى</h3><p className="text-sm text-muted-foreground leading-6">حوّل فكرتك إلى عنوان ووصف وهاشتاقات قبل النشر.</p></div></Link>
        </div>
      </section>

      {/* Trending Section */}
      {trendingVideos && trendingVideos.length > 0 && (
        <section className="container mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">الأكثر رواجاً</h2>
                <p className="text-xs text-muted-foreground">الفيديوهات الأكثر شعبية الآن</p>
              </div>
            </div>
            <Link href="/trending">
              <Button variant="ghost" size="sm" className="text-primary">
                عرض الكل
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingVideos.map((video) => (
              <VideoCard key={video.id} {...video} createdAt={video.createdAt} />
            ))}
          </div>
        </section>
      )}

      {/* Community Posts */}
      {communityPosts && communityPosts.length > 0 && (
        <section className="container mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
              <div><h2 className="text-xl font-bold text-foreground">منشورات المجتمع</h2><p className="text-xs text-muted-foreground">نصوص وصور وReels في منشور واحد</p></div>
            </div>
            <Link href="/publish"><Button variant="ghost" size="sm" className="text-primary">اكتب منشورًا</Button></Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{communityPosts.map(post => <PostCard key={post.id} post={post} />)}</div>
        </section>
      )}

      {/* Latest Videos */}
      <section className="container mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">آخر الفيديوهات</h2>
              <p className="text-xs text-muted-foreground">أحدث المحتوى المنشور</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : latestVideos && latestVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {latestVideos.map((video) => (
              <VideoCard key={video.id} {...video} createdAt={video.createdAt} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد فيديوهات بعد</h3>
            <p className="text-muted-foreground mb-4">كن أول من ينشر فيديو على المنصة!</p>
            {isAuthenticated && (
              <Link href="/upload">
                <Button className="gap-2 bg-gradient-to-l from-primary to-accent text-white">
                  <Upload className="w-4 h-4" />
                  نشر أول فيديو
                </Button>
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Launch ideas: weekly competition and rewards */}
      <section className="container mb-10">
        <div className="glass-card rounded-2xl border border-accent/20 bg-gradient-to-l from-accent/10 via-transparent to-primary/10 p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold text-accent mb-1">ميزة الأسبوع</p>
              <h2 className="text-lg font-bold text-foreground">شارك في التحدي واربح نقاطاً وشارة مميزة</h2>
              <p className="text-sm text-muted-foreground mt-1">اكتشف التحديات، صوّت للمبدعين، واصنع لحظتك على الترند.</p>
            </div>
          </div>
          <Link href="/challenges">
            <Button variant="outline" className="border-accent/40 text-accent hover:bg-accent/10 shrink-0">اكتشف التحديات</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">شارك محتواك</h3>
            <p className="text-sm text-muted-foreground">انشر فيديوهاتك وشاركها مع العالم واكسب نقاط مع كل فيديو</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-accent" />
            </div>
            <h3 className="font-bold text-foreground mb-2">اطلع على الترند</h3>
            <p className="text-sm text-muted-foreground">تابع أكثر الفيديوهات شعبية وتفاعل معها بالإعجاب والتعليق</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Dices className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">عجلة الحظ اليومية</h3>
            <p className="text-sm text-muted-foreground">ادخل كل يوم وأدر العجلة لتفوز بنقاط إضافية وترتقي بمستواك</p>
          </div>
        </div>
      </section>
    </div>
  );
}
