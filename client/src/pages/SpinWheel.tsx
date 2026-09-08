import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Dices, Trophy, Star, Loader2, Gift } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";

const PRIZES = [
  { label: "5", value: 5, color: "oklch(0.55 0.22 280)" },
  { label: "10", value: 10, color: "oklch(0.65 0.2 300)" },
  { label: "15", value: 15, color: "oklch(0.5 0.2 260)" },
  { label: "20", value: 20, color: "oklch(0.82 0.12 85)" },
  { label: "25", value: 25, color: "oklch(0.6 0.18 320)" },
  { label: "30", value: 30, color: "oklch(0.55 0.22 280)" },
  { label: "50", value: 50, color: "oklch(0.7 0.15 140)" },
  { label: "100", value: 100, color: "oklch(0.75 0.18 60)" },
];

const SEGMENT_ANGLE = 360 / PRIZES.length;

export default function SpinWheel() {
  const { user, isAuthenticated } = useAuth();
  const { data: canSpin, refetch: refetchCanSpin } = trpc.spin.canSpin.useQuery(undefined, { enabled: isAuthenticated });
  const { data: spinHistoryData } = trpc.spin.history.useQuery(undefined, { enabled: isAuthenticated });
  const { data: pointsData, refetch: refetchPoints } = trpc.points.myPoints.useQuery(undefined, { enabled: isAuthenticated });

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ points: number; message: string } | null>(null);

  const doSpin = trpc.spin.doSpin.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        const prizeIndex = PRIZES.findIndex(p => p.value === data.pointsWon);
        const targetAngle = 360 - (prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2);
        const spins = 5 + Math.floor(Math.random() * 3);
        const finalRotation = rotation + spins * 360 + targetAngle;
        setRotation(finalRotation);

        setTimeout(() => {
          setSpinning(false);
          setResult({ points: data.pointsWon, message: data.message });
          refetchCanSpin();
          refetchPoints();
          toast.success(`مبروك! فزت بـ ${data.pointsWon} نقطة! 🎉`);
        }, 4000);
      } else {
        setSpinning(false);
        toast.error(data.message);
      }
    },
    onError: () => {
      setSpinning(false);
      toast.error("حدث خطأ");
    },
  });

  const handleSpin = useCallback(() => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (spinning || !canSpin) return;
    setSpinning(true);
    setResult(null);
    doSpin.mutate();
  }, [isAuthenticated, spinning, canSpin, doSpin]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <div className="container py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-4">
            <Dices className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent">لعبة يومية</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold gradient-text mb-2">عجلة الحظ</h1>
          <p className="text-muted-foreground">أدر العجلة مرة واحدة يومياً واربح نقاط مجانية!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Wheel */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-accent" />
              </div>

              {/* Wheel SVG */}
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
                className="w-full h-full"
              >
                <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
                  {PRIZES.map((prize, i) => {
                    const startAngle = i * SEGMENT_ANGLE;
                    const endAngle = (i + 1) * SEGMENT_ANGLE;
                    const startRad = (startAngle - 90) * (Math.PI / 180);
                    const endRad = (endAngle - 90) * (Math.PI / 180);
                    const x1 = 150 + 140 * Math.cos(startRad);
                    const y1 = 150 + 140 * Math.sin(startRad);
                    const x2 = 150 + 140 * Math.cos(endRad);
                    const y2 = 150 + 140 * Math.sin(endRad);
                    const midAngle = (startAngle + endAngle) / 2;
                    const midRad = (midAngle - 90) * (Math.PI / 180);
                    const textX = 150 + 95 * Math.cos(midRad);
                    const textY = 150 + 95 * Math.sin(midRad);
                    const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;

                    return (
                      <g key={i}>
                        <path
                          d={`M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={prize.color}
                          stroke="oklch(0.13 0.015 280)"
                          strokeWidth="2"
                        />
                        <text
                          x={textX}
                          y={textY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="white"
                          fontSize="18"
                          fontWeight="bold"
                          transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                        >
                          {prize.label}
                        </text>
                      </g>
                    );
                  })}
                  {/* Center circle */}
                  <circle cx="150" cy="150" r="25" fill="oklch(0.13 0.015 280)" stroke="oklch(0.82 0.12 85)" strokeWidth="3" />
                  <text x="150" y="150" textAnchor="middle" dominantBaseline="central" fill="oklch(0.82 0.12 85)" fontSize="10" fontWeight="bold">
                    نقاط
                  </text>
                </svg>
              </motion.div>
            </div>
          </div>

          {/* Controls & Info */}
          <div className="space-y-6">
            {/* Spin Button */}
            <div className="text-center lg:text-right">
              {result && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-6"
                >
                  <Card className="bg-gradient-to-br from-accent/20 to-primary/20 border-accent/30 p-6 text-center glow-gold">
                    <Gift className="w-12 h-12 text-accent mx-auto mb-3" />
                    <h3 className="text-2xl font-bold text-accent mb-1">+{result.points} نقطة</h3>
                    <p className="text-foreground">{result.message}</p>
                  </Card>
                </motion.div>
              )}

              <Button
                size="lg"
                onClick={handleSpin}
                disabled={spinning || (isAuthenticated && !canSpin)}
                className="w-full lg:w-auto gap-2 bg-gradient-to-l from-primary to-accent text-white hover:opacity-90 glow-primary h-14 text-lg px-10"
              >
                {spinning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الدوران...
                  </>
                ) : !isAuthenticated ? (
                  "سجل دخولك لتدير العجلة"
                ) : canSpin ? (
                  <>
                    <Dices className="w-5 h-5" />
                    أدر العجلة!
                  </>
                ) : (
                  "استخدمت دورتك اليوم - عد غداً!"
                )}
              </Button>
            </div>

            {/* Points Info */}
            {isAuthenticated && pointsData && (
              <Card className="bg-card/50 border-border/30 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="w-6 h-6 text-accent" />
                  <h3 className="font-bold text-foreground">إحصائياتك</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-xl bg-secondary/30">
                    <p className="text-2xl font-bold text-accent">{pointsData.totalPoints}</p>
                    <p className="text-xs text-muted-foreground">إجمالي النقاط</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-secondary/30">
                    <p className="text-2xl font-bold text-primary">{pointsData.level}</p>
                    <p className="text-xs text-muted-foreground">المستوى</p>
                  </div>
                </div>
              </Card>
            )}

            {/* How to earn points */}
            <Card className="bg-card/50 border-border/30 p-5">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-6 h-6 text-accent" />
                <h3 className="font-bold text-foreground">كيف تكسب نقاط؟</h3>
              </div>
              <div className="space-y-3">
                {[
                  { action: "نشر فيديو", points: "+10", icon: "🎬" },
                  { action: "تعليق على فيديو", points: "+3", icon: "💬" },
                  { action: "إعجاب بفيديو", points: "+2", icon: "❤️" },
                  { action: "مشاهدة فيديو", points: "+1", icon: "👁️" },
                  { action: "عجلة الحظ", points: "+5-100", icon: "🎰" },
                ].map((item) => (
                  <div key={item.action} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <div className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span className="text-sm text-foreground">{item.action}</span>
                    </div>
                    <span className="text-sm font-semibold text-accent">{item.points}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Spin History */}
            {spinHistoryData && spinHistoryData.length > 0 && (
              <Card className="bg-card/50 border-border/30 p-5">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <Dices className="w-5 h-5 text-primary" />
                  آخر الدورات
                </h3>
                <div className="space-y-2">
                  {spinHistoryData.slice(0, 5).map((spin) => (
                    <div key={spin.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/20 last:border-0">
                      <span className="text-muted-foreground">{spin.spinDate}</span>
                      <span className="font-semibold text-accent">+{spin.pointsWon} نقطة</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
