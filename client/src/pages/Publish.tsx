import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Check, ChevronDown, ChevronUp, FileImage, FileVideo, Loader2, Plus, Send, Trash2, Type, Video } from "lucide-react";
import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type TextBlock = { blockType: "text"; textContent: string };
type MediaBlock = { blockType: "image" | "video"; file: File; preview: string };
type ComposerBlock = TextBlock | MediaBlock;

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("تعذر قراءة الملف"));
    reader.readAsDataURL(file);
  });
}

export default function Publish() {
  useAuth({ redirectOnUnauthenticated: true });
  const [, navigate] = useLocation();
  const initialMode = new URLSearchParams(window.location.search).get("mode") === "story" ? "story" : "post";
  const [mode, setMode] = useState<"post" | "story">(initialMode);
  const [blocks, setBlocks] = useState<ComposerBlock[]>([{ blockType: "text", textContent: "" }]);
  const [visibility, setVisibility] = useState<"public" | "followers">("public");
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string | null>(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const [pendingMediaType, setPendingMediaType] = useState<"image" | "video">("image");

  const uploadMedia = trpc.media.upload.useMutation();
  const publishPost = trpc.post.publish.useMutation();
  const publishStory = trpc.story.publish.useMutation();

  const addTextBlock = () => {
    if (blocks.length % 2 !== 0) {
      toast.error("أضف صورة أو فيديو قبل المقطع النصي التالي");
      return;
    }
    setBlocks(current => [...current, { blockType: "text", textContent: "" }]);
  };
  const addMediaBlock = (type: "image" | "video") => {
    if (blocks.length % 2 === 0) {
      toast.error("ابدأ بمقطع نصي ثم أضف صورة أو فيديو");
      return;
    }
    setPendingMediaType(type);
    window.setTimeout(() => mediaInputRef.current?.click(), 0);
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const allowed = pendingMediaType === "image" ? file.type.startsWith("image/") : file.type.startsWith("video/");
    if (!allowed) {
      toast.error(pendingMediaType === "image" ? "اختر صورة فقط لهذا المقطع" : "اختر فيديو فقط لهذا المقطع");
      return;
    }
    if (file.size > 80 * 1024 * 1024) {
      toast.error("الحد الأقصى للملف 80 ميجابايت");
      return;
    }
    setBlocks(current => [...current, { blockType: pendingMediaType, file, preview: URL.createObjectURL(file) }]);
  };

  const updateText = (index: number, value: string) => {
    const limited = value.split(/\r?\n/).slice(0, 5).join("\n").slice(0, 1000);
    setBlocks(current => current.map((block, blockIndex) => blockIndex === index && block.blockType === "text" ? { ...block, textContent: limited } : block));
  };

  const removeBlock = (index: number) => {
    setBlocks(current => {
      const next = current.filter((_, blockIndex) => blockIndex !== index);
      const validOrder = next.every((block, blockIndex) => blockIndex % 2 === 0 ? block.blockType === "text" : block.blockType !== "text");
      if (!validOrder) {
        toast.error("احذف المقاطع من النهاية حتى يبقى ترتيب النص والوسائط صحيحًا");
        return current;
      }
      return next;
    });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setBlocks(current => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleStorySelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("القصة تقبل صورة أو فيديو فقط");
      return;
    }
    if (file.size > 80 * 1024 * 1024) {
      toast.error("الحد الأقصى للقصة 80 ميجابايت");
      return;
    }
    setStoryFile(file);
    setStoryPreview(URL.createObjectURL(file));
  };

  const publishPostNow = async () => {
    const validBlocks = blocks.filter(block => block.blockType !== "text" || block.textContent.trim());
    if (!validBlocks.length) {
      toast.error("أضف نصًا أو صورة أو فيديو قبل النشر");
      return;
    }
    setUploading(true);
    try {
      const uploadedBlocks = [];
      for (const block of validBlocks) {
        if (block.blockType === "text") {
          uploadedBlocks.push({ blockType: "text" as const, textContent: block.textContent.trim() });
        } else {
          const result = await uploadMedia.mutateAsync({ base64: await fileToBase64(block.file), mimeType: block.file.type as "image/jpeg" | "image/png" | "image/webp" | "video/mp4" | "video/webm" | "video/quicktime" });
          uploadedBlocks.push({ blockType: block.blockType, mediaUrl: result.url, mediaKey: result.key });
        }
      }
      const result = await publishPost.mutateAsync({ visibility, blocks: uploadedBlocks });
      toast.success("تم نشر المنشور بنجاح");
      navigate(`/post/${result.postId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر نشر المنشور");
    } finally {
      setUploading(false);
    }
  };

  const publishStoryNow = async () => {
    if (!storyFile) {
      toast.error("اختر صورة أو فيديو للقصة");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadMedia.mutateAsync({ base64: await fileToBase64(storyFile), mimeType: storyFile.type as "image/jpeg" | "image/png" | "image/webp" | "video/mp4" | "video/webm" | "video/quicktime" });
      await publishStory.mutateAsync({ mediaType: storyFile.type.startsWith("video/") ? "video" : "image", mediaUrl: result.url, mediaKey: result.key, caption: storyCaption.trim() || undefined });
      toast.success("تم نشر القصة لمدة 24 ساعة");
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر نشر القصة");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container max-w-3xl py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-accent font-semibold mb-1">شارك لحظتك</p>
            <h1 className="text-3xl font-bold text-foreground">نشر محتوى جديد</h1>
            <p className="text-muted-foreground mt-2">اكتب، أضف وسائط، ورتّب كل شيء داخل منشور واحد.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant={mode === "post" ? "default" : "outline"} className="gap-2" onClick={() => setMode("post")}>
              <Type className="w-4 h-4" /> منشور عام
            </Button>
            <Button type="button" variant={mode === "story" ? "default" : "outline"} className="gap-2" onClick={() => setMode("story")}>
              <BookOpen className="w-4 h-4" /> قصة 24 ساعة
            </Button>
          </div>
        </div>

        {mode === "story" ? (
          <Card className="p-6 bg-card/70 border-border/70 space-y-5">
            <div className="rounded-2xl border-2 border-dashed border-primary/30 min-h-80 flex items-center justify-center overflow-hidden bg-secondary/20">
              {storyPreview ? (
                storyFile?.type.startsWith("video/") ? <video src={storyPreview} controls className="max-h-[28rem] w-full object-contain" /> : <img src={storyPreview} alt="معاينة القصة" className="max-h-[28rem] w-full object-contain" />
              ) : (
                <button type="button" className="p-10 text-center" onClick={() => storyInputRef.current?.click()}>
                  <BookOpen className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="font-semibold">اختر صورة أو فيديو للقصة</p>
                  <p className="text-sm text-muted-foreground mt-1">ستختفي القصة تلقائيًا بعد 24 ساعة</p>
                </button>
              )}
            </div>
            <input ref={storyInputRef} type="file" accept="image/*,video/*" onChange={handleStorySelect} className="hidden" />
            <Input value={storyCaption} onChange={event => setStoryCaption(event.target.value)} maxLength={280} placeholder="اكتب تعليقًا قصيرًا للقصة (اختياري)" />
            <Button onClick={publishStoryNow} disabled={uploading} className="w-full gap-2 bg-gradient-to-l from-primary to-accent text-white">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} نشر القصة
            </Button>
          </Card>
        ) : (
          <div className="space-y-5">
            <Card className="p-5 bg-card/70 border-border/70">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold">ظهور المنشور:</span>
                <Button type="button" size="sm" variant={visibility === "public" ? "default" : "outline"} onClick={() => setVisibility("public")}>عام للجميع</Button>
                <Button type="button" size="sm" variant={visibility === "followers" ? "default" : "outline"} onClick={() => setVisibility("followers")}>للمتابعين</Button>
                <span className="text-xs text-muted-foreground mr-auto">يمكنك ترتيب النص والوسائط كما تريد</span>
              </div>
            </Card>

            {blocks.map((block, index) => (
              <Card key={`${block.blockType}-${index}`} className="p-5 bg-card/70 border-border/70 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {block.blockType === "text" ? <Type className="w-4 h-4 text-primary" /> : block.blockType === "image" ? <FileImage className="w-4 h-4 text-accent" /> : <FileVideo className="w-4 h-4 text-accent" />}
                    {block.blockType === "text" ? "مقطع نصي — حتى 5 أسطر" : block.blockType === "image" ? "صورة" : "فيديو Reel"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => moveBlock(index, -1)}><ChevronUp className="w-4 h-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" disabled={index === blocks.length - 1} onClick={() => moveBlock(index, 1)}><ChevronDown className="w-4 h-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeBlock(index)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                {block.blockType === "text" ? (
                  <>
                    <textarea value={block.textContent} onChange={event => updateText(index, event.target.value)} rows={5} placeholder="اكتب حتى خمسة أسطر..." className="w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                    <p className="text-xs text-muted-foreground mt-2">{block.textContent.split(/\r?\n/).length}/5 أسطر</p>
                  </>
                ) : block.blockType === "image" ? (
                  <img src={block.preview} alt="معاينة الصورة" className="max-h-96 w-full object-contain rounded-xl bg-black/20" />
                ) : (
                  <video src={block.preview} controls className="max-h-96 w-full rounded-xl bg-black/20" />
                )}
              </Card>
            ))}

            <input ref={mediaInputRef} type="file" accept={pendingMediaType === "image" ? "image/*" : "video/*"} onChange={handleMediaSelect} className="hidden" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button type="button" variant="outline" className="gap-2" disabled={blocks.length % 2 !== 0} onClick={addTextBlock}><Plus className="w-4 h-4" /> إضافة 5 أسطر</Button>
              <Button type="button" variant="outline" className="gap-2" disabled={blocks.length % 2 === 0} onClick={() => addMediaBlock("image")}><FileImage className="w-4 h-4" /> إضافة صورة</Button>
              <Button type="button" variant="outline" className="gap-2" disabled={blocks.length % 2 === 0} onClick={() => addMediaBlock("video")}><Video className="w-4 h-4" /> إضافة Reel</Button>
            </div>
            <Button onClick={publishPostNow} disabled={uploading} className="w-full gap-2 bg-gradient-to-l from-primary to-accent text-white py-6 text-lg">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} نشر المنشور العام
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
