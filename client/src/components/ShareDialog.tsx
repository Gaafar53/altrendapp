import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ShareDialogProps = {
  videoId: number;
  title: string;
  children?: React.ReactNode;
};

export default function ShareDialog({ videoId, title, children }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/video/${videoId}`;
  const shareText = `شاهد "${title}" على الترند!`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("تم نسخ الرابط!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("فشل نسخ الرابط");
    }
  };

  const shareOptions = [
    {
      name: "واتساب",
      color: "bg-green-600 hover:bg-green-700",
      icon: "💬",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    },
    {
      name: "تويتر / X",
      color: "bg-black hover:bg-gray-900",
      icon: "𝕏",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "فيسبوك",
      color: "bg-blue-600 hover:bg-blue-700",
      icon: "📘",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "تيليجرام",
      color: "bg-sky-500 hover:bg-sky-600",
      icon: "✈️",
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="gap-1">
            <Share2 className="h-4 w-4" />
            مشاركة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">مشاركة الفيديو</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {shareOptions.map(opt => (
              <Button
                key={opt.name}
                className={`${opt.color} text-white gap-2 h-10`}
                onClick={() => window.open(opt.url, "_blank", "width=600,height=400")}
              >
                <span>{opt.icon}</span>
                {opt.name}
              </Button>
            ))}
          </div>

          {/* Copy Link */}
          <div className="flex items-center gap-2">
            <Input value={shareUrl} readOnly className="text-xs bg-muted" dir="ltr" />
            <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
