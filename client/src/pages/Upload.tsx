import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Video, Sparkles } from "lucide-react";

export default function Upload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { setMsg("الفيديو كبير > 100MB"); return; }
      setVideoFile(file); setPreviewUrl(URL.createObjectURL(file));
    }
  };
  const removeVideo = () => { setVideoFile(null); setPreviewUrl(null); setProgress(0); if(fileInputRef.current) fileInputRef.current.value=""; };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile ||!title.trim()) { setMsg("اختار فيديو وعنوان"); return; }
    setUploading(true); setProgress(5); setMsg("");
    try {
      const form = new FormData();
      form.append("video", videoFile);
      form.append("title", title);
      form.append("description", description);
      const xhr = new XMLHttpRequest();
      const data = await new Promise<any>((resolve, reject) => {
        xhr.upload.onprogress = (ev) => { if(ev.lengthComputable) setProgress(Math.round(ev.loaded/ev.total*90)); };
        xhr.onload = () => { if(xhr.status>=200&&xhr.status<300){ try{ resolve(JSON.parse(xhr.responseText)); }catch{ resolve({}); } } else reject(new Error(xhr.responseText)); };
        xhr.onerror = () => reject(new Error("Failed to fetch - تأكد node server-eg-native.cjs شغال"));
        xhr.open("POST", "/api/upload"); xhr.send(form);
      });
      setProgress(100); setMsg(`✅ اتنشر بلوك #${data.block?.index||''} ${title}`);
      setTimeout(()=> window.location.href="/eg-chain", 1200);
    } catch(err:any){ setMsg("❌ "+err.message); setProgress(0); }
    finally{ setUploading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 pb-24 max-w-lg mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-lg font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-400" /> نشر فيديو جديد</h1><p className="text-[11px] text-white/50">فيديوهاتك هتتوثق في سلسلة 315 ⛓️</p></div>
      </div>
      {msg && <div className="mb-3 bg-white/10 border border-white/20 rounded-xl p-3 text-xs text-center">{msg}</div>}
      <Card className="bg-[#15151d] border-white/10 overflow-hidden mb-4">
        {previewUrl? (
          <div className="relative bg-black"><video src={previewUrl} controls className="w-full max-h-[60vh] object-contain" /><Button variant="destructive" size="icon" className="absolute top-2 left-2 w-7 h-7 rounded-full" onClick={removeVideo}><X className="w-4 h-4" /></Button><div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-[10px]">{(videoFile!.size/1024/1024).toFixed(1)}MB</div></div>
        ) : (
          <div className="p-10 text-center cursor-pointer" onClick={()=>fileInputRef.current?.click()}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center mx-auto mb-3"><Video className="w-6 h-6" /></div>
            <h3 className="text-sm font-bold">دوس لاختيار فيديو</h3><p className="text-[11px] text-white/40 mt-1">يا سعد من شاهد الرسول ﷺ</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
      </Card>
      {uploading && <div className="mb-4 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-400 to-purple-600 transition-all" style={{width: `${progress}%`}} /></div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div><label className="text-[11px] text-white/60 mb-1 block">* عنوان الفيديو</label><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="صلي الله عليه وسلم" className="bg-[#1a1a25] border-white/10 h-11 text-white" required /></div>
        <div><label className="text-[11px] text-white/60 mb-1 block">الوصف</label><Textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="صلي على النبي" rows={2} className="bg-[#1a1a25] border-white/10 text-white" /></div>
        <Button type="submit" disabled={uploading ||!videoFile} className="w-full bg-gradient-to-r from-[#f5c75d] to-[#8b5cf6] text-black font-bold h-11 rounded-xl">{uploading? `جاري الرفع ${progress}% ⛓️` : "⬆️ نشر الفيديو"}</Button>
        <p className="text-center text-[10px] text-white/30">نشر للجمهور العام - كل فيديو = 1/315</p>
      </form>
    </div>
  );
}
