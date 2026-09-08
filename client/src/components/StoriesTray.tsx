import { trpc } from "@/lib/trpc";
import { BookOpen, Play, Plus, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function StoriesTray() {
  const { data: stories, isLoading } = trpc.story.active.useQuery(undefined, { refetchInterval: 60_000 });
  const viewStory = trpc.story.view.useMutation();
  const [selected, setSelected] = useState<NonNullable<typeof stories>[number] | null>(null);

  if (isLoading || !stories?.length) {
    return (
      <div className="container mb-8">
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 p-4">
          <Link href="/publish?mode=story" className="w-16 shrink-0 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-accent flex items-center justify-center mx-auto"><Plus className="w-5 h-5 text-accent" /></div>
            <span className="text-[11px] text-muted-foreground mt-1 block">قصتك</span>
          </Link>
          <div className="flex items-center gap-2 text-muted-foreground text-sm"><BookOpen className="w-4 h-4" /> انشر قصة تظهر لمدة 24 ساعة</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="container mb-8">
        <div className="flex gap-4 overflow-x-auto rounded-2xl border border-border/60 bg-card/40 p-4 scrollbar-hide">
          <Link href="/publish?mode=story" className="w-16 shrink-0 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-accent flex items-center justify-center mx-auto"><Plus className="w-5 h-5 text-accent" /></div>
            <span className="text-[11px] text-muted-foreground mt-1 block">قصتك</span>
          </Link>
          {stories.map(story => (
            <button key={story.id} type="button" className="w-16 shrink-0 text-center" onClick={() => { setSelected(story); viewStory.mutate({ storyId: story.id }); }}>
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-accent to-primary mx-auto">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-background bg-secondary">
                  {story.mediaType === "video" ? <video src={story.mediaUrl} muted className="w-full h-full object-cover" /> : <img src={story.mediaUrl} alt="قصة" className="w-full h-full object-cover" loading="lazy" />}
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 block truncate">قصة جديدة</span>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" aria-label="إغلاق" className="absolute top-5 left-5 text-white/80 hover:text-white" onClick={() => setSelected(null)}><X className="w-7 h-7" /></button>
          <div className="relative max-w-lg w-full max-h-[90vh] rounded-2xl overflow-hidden bg-black">
            {selected.mediaType === "video" ? <video src={selected.mediaUrl} controls autoPlay className="max-h-[80vh] w-full object-contain" /> : <img src={selected.mediaUrl} alt={selected.caption ?? "قصة"} className="max-h-[80vh] w-full object-contain" />}
            {selected.caption && <p className="absolute bottom-0 inset-x-0 p-4 text-white bg-gradient-to-t from-black/80 to-transparent">{selected.caption}</p>}
            <div className="absolute top-4 right-4 text-white/80 flex items-center gap-1 text-xs"><Play className="w-3 h-3" /> قصة مؤقتة</div>
          </div>
        </div>
      )}
    </>
  );
}
