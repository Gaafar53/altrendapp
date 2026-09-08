import { trpc } from "@/lib/trpc";
import VideoCard from "@/components/VideoCard";
import Navbar from "@/components/Navbar";
import { Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") ?? "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  const { data: results, isLoading } = trpc.video.search.useQuery(
    { query: activeQuery },
    { enabled: activeQuery.length > 0 }
  );

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") ?? "";
    setSearchQuery(q);
    setActiveQuery(q);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveQuery(searchQuery.trim());
      window.history.replaceState(null, "", `/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <div className="container py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto mb-10">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن فيديو..."
              className="pr-10 bg-input h-12 text-base"
              autoFocus
            />
          </div>
          <Button type="submit" className="h-12 px-6 bg-gradient-to-l from-primary to-accent text-white">
            بحث
          </Button>
        </form>

        {/* Results */}
        {activeQuery && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              نتائج البحث عن: <span className="text-primary">"{activeQuery}"</span>
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : results && results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.map((video) => (
                  <VideoCard key={video.id} {...video} createdAt={video.createdAt} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد نتائج</h3>
                <p className="text-muted-foreground">جرب كلمات بحث مختلفة</p>
              </div>
            )}
          </div>
        )}

        {!activeQuery && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">ابحث عن فيديوهات</h3>
            <p className="text-muted-foreground">أدخل كلمة للبحث عن الفيديوهات بالعنوان</p>
          </div>
        )}
      </div>
    </div>
  );
}
