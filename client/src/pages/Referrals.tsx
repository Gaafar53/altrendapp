import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Gift, Share2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function Referrals() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const { data: myCode } = trpc.referral.getCode.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: stats } = trpc.referral.getStats.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user }
  );

  const redeemMutation = trpc.referral.redeem.useMutation({
    onSuccess: (data) => {
      toast.success(`تم الاسترجاع بنجاح! حصلت على ${data.points} نقطة`);
      setReferralCode("");
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ ما");
    },
  });

  const handleCopyCode = () => {
    if (myCode?.referralCode) {
      navigator.clipboard.writeText(myCode.referralCode);
      toast.success("تم نسخ الكود");
    }
  };

  const handleRedeem = async () => {
    if (!referralCode.trim()) {
      toast.error("أدخل كود الإحالة");
      return;
    }

    setIsRedeeming(true);
    try {
      await redeemMutation.mutateAsync({ referralCode });
    } finally {
      setIsRedeeming(false);
    }
  };

  const referralLink = myCode?.referralCode
    ? `${window.location.origin}?ref=${myCode.referralCode}`
    : "";

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">نظام الإحالات</h1>
        <p className="text-muted-foreground mb-8">
          ادعُ أصدقاءك واكسب نقاط مكافآت لكل صديق ينضم عبر كودك
        </p>

        <Tabs defaultValue="my-code" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-code">كودي</TabsTrigger>
            <TabsTrigger value="redeem">استرجاع كود</TabsTrigger>
          </TabsList>

          {/* My Code Tab */}
          <TabsContent value="my-code" className="space-y-4">
            {myCode && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      كود الإحالة الخاص بك
                    </CardTitle>
                    <CardDescription>
                      شارك هذا الكود مع أصدقاءك واكسب نقاط عند انضمامهم
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={myCode.referralCode}
                        readOnly
                        className="font-mono text-lg font-bold"
                      />
                      <Button onClick={handleCopyCode} size="icon">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    {referralLink && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">رابط الإحالة:</p>
                        <div className="flex gap-2">
                          <Input
                            value={referralLink}
                            readOnly
                            className="text-sm"
                          />
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(referralLink);
                              toast.success("تم نسخ الرابط");
                            }}
                            size="icon"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  title: "الترند",
                                  text: "انضم إلى الترند واكسب نقاط!",
                                  url: referralLink,
                                });
                              }
                            }}
                            size="icon"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {stats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        إحصائيات الإحالات
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">عدد الأصدقاء</p>
                          <p className="text-2xl font-bold">{stats.referredCount}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">النقاط المكتسبة</p>
                          <p className="text-2xl font-bold">{stats.totalRewardPoints}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Redeem Tab */}
          <TabsContent value="redeem" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>استرجاع كود إحالة</CardTitle>
                <CardDescription>
                  أدخل كود الإحالة من صديقك لتحصل على نقاط مكافآت
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">كود الإحالة</label>
                  <Input
                    placeholder="مثال: REF12345678"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>
                <Button
                  onClick={handleRedeem}
                  disabled={isRedeeming || !referralCode.trim()}
                  className="w-full"
                >
                  {isRedeeming ? "جاري الاسترجاع..." : "استرجاع الكود"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">كيف يعمل نظام الإحالات؟</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold">شارك كودك</p>
                    <p className="text-muted-foreground">شارك كود الإحالة الخاص بك مع أصدقاءك</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold">ينضم صديقك</p>
                    <p className="text-muted-foreground">يستخدم صديقك كودك عند التسجيل</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold">اكسب نقاط</p>
                    <p className="text-muted-foreground">تحصل على 100 نقطة مكافآت لكل صديق</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
