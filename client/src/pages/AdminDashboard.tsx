import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import {
  Shield, Users, Video, MessageCircle, Heart, Eye,
  Trash2, Loader2, ArrowRight, UserCog,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const isAdmin = user?.role === "admin";

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: allUsers } = trpc.admin.users.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: allVideos } = trpc.admin.videos.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: allComments } = trpc.admin.comments.useQuery(undefined, {
    enabled: isAdmin,
  });

  const deleteVideo = trpc.admin.deleteVideo.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الفيديو");
      utils.admin.videos.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const deleteComment = trpc.admin.deleteComment.useMutation({
    onSuccess: () => {
      toast.success("تم حذف التعليق");
      utils.admin.comments.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الدور");
      utils.admin.users.invalidate();
    },
    onError: () => toast.error("حدث خطأ"),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">غير مصرح</h2>
          <p className="text-muted-foreground">هذه الصفحة متاحة فقط للمشرفين</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/">
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "المستخدمون", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "الفيديوهات", value: stats?.totalVideos ?? 0, icon: Video, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "التعليقات", value: stats?.totalComments ?? 0, icon: MessageCircle, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "الإعجابات", value: stats?.totalLikes ?? 0, icon: Heart, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "المشاهدات", value: stats?.totalViews ?? 0, icon: Eye, color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <div className="container py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-accent/10">
            <Shield className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-sm text-muted-foreground">إدارة المحتوى والمستخدمين</p>
          </div>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {statCards.map((stat) => (
              <Card key={stat.label} className="p-4 bg-card/50 border-border/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Management Tabs */}
        <Tabs defaultValue="users" dir="rtl">
          <TabsList className="mb-6 bg-secondary/50">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              المستخدمون
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Video className="w-4 h-4" />
              الفيديوهات
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              التعليقات
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-3">
              {allUsers?.map((u) => (
                <Card key={u.id} className="p-4 bg-card/50 border-border/30">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {(u.name || "م")[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{u.name || "مستخدم"}</p>
                          {u.role === "admin" && (
                            <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">
                              مشرف
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {u.email || "بدون بريد"} | المستوى {u.level} | {u.totalPoints} نقطة
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={u.role}
                        onValueChange={(value) => {
                          if (value !== u.role) {
                            updateRole.mutate({ userId: u.id, role: value as "user" | "admin" });
                          }
                        }}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">مستخدم</SelectItem>
                          <SelectItem value="admin">مشرف</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" asChild className="w-8 h-8">
                        <Link href={`/profile/${u.id}`}>
                          <UserCog className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {(!allUsers || allUsers.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">لا يوجد مستخدمون</div>
              )}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="space-y-3">
              {allVideos?.map((v) => (
                <Card key={v.id} className="p-4 bg-card/50 border-border/30">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <Link href={`/video/${v.id}`} className="font-semibold text-foreground hover:text-primary transition-colors no-underline">
                        {v.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        بواسطة {v.userName || "مستخدم"} | {v.viewCount} مشاهدة | {v.likeCount} إعجاب | {v.commentCount} تعليق
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف الفيديو</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف هذا الفيديو؟ سيتم حذف جميع التعليقات والإعجابات المرتبطة به.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteVideo.mutate({ videoId: v.id })}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
              {(!allVideos || allVideos.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">لا توجد فيديوهات</div>
              )}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <div className="space-y-3">
              {allComments?.map((c) => (
                <Card key={c.id} className="p-4 bg-card/50 border-border/30">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{c.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        بواسطة {c.userName || "مستخدم"} | على فيديو #{c.videoId}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild className="w-8 h-8">
                        <Link href={`/video/${c.videoId}`}>
                          <Video className="w-4 h-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف التعليق</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف هذا التعليق؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteComment.mutate({ commentId: c.id })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
              {(!allComments || allComments.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">لا توجد تعليقات</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
