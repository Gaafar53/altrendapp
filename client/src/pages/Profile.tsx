import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import VideoCard from "@/components/VideoCard";
import Navbar from "@/components/Navbar";
import { Trophy, Star, Video, Edit2, Loader2, Camera, UserPlus, UserMinus, Users } from "lucide-react";
import { useParams } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id ?? "0");
  const { user: currentUser, isAuthenticated } = useAuth();
  const isOwnProfile = currentUser?.id === userId;
  const utils = trpc.useUtils();

  const { data: profile, isLoading, refetch } = trpc.user.getProfile.useQuery(
    { userId },
    { enabled: userId > 0 }
  );
  const { data: userVideos } = trpc.video.getUserVideos.useQuery(
    { userId, limit: 20, offset: 0 },
    { enabled: userId > 0 }
  );
  const { data: followStats } = trpc.follow.stats.useQuery(
    { userId },
    { enabled: userId > 0 }
  );
  const { data: isFollowingUser } = trpc.follow.isFollowing.useQuery(
    { userId },
    { enabled: isAuthenticated && !isOwnProfile && userId > 0 }
  );
  const { data: followers } = trpc.follow.followers.useQuery(
    { userId },
    { enabled: userId > 0 }
  );
  const { data: following } = trpc.follow.following.useQuery(
    { userId },
    { enabled: userId > 0 }
  );

  const toggleFollow = trpc.follow.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.followed ? "تمت المتابعة" : "تم إلغاء المتابعة");
      utils.follow.isFollowing.invalidate({ userId });
      utils.follow.stats.invalidate({ userId });
      utils.follow.followers.invalidate({ userId });
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الملف الشخصي");
      setEditOpen(false);
      refetch();
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const uploadAvatar = trpc.user.uploadAvatar.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الصورة الرمزية");
      refetch();
    },
    onError: () => toast.error("حدث خطأ في رفع الصورة"),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار صورة");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadAvatar.mutate({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const openEditDialog = () => {
    setEditName(profile?.name ?? "");
    setEditBio(profile?.bio ?? "");
    setEditOpen(true);
  };

  const handleSaveProfile = () => {
    updateProfile.mutate({
      name: editName.trim() || undefined,
      bio: editBio.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-32">
          <h2 className="text-xl font-bold text-foreground">المستخدم غير موجود</h2>
        </div>
      </div>
    );
  }

  const progressPercent = profile.nextLevelThreshold > 0
    ? Math.min((profile.totalPoints / profile.nextLevelThreshold) * 100, 100)
    : 100;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      {/* Profile Header */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="container relative">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="w-28 h-28 border-4 border-primary/30">
                <AvatarImage src={profile.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
                  {profile.name?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {/* Level Badge */}
              <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-sm border-2 border-background">
                {profile.level}
              </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-right flex-1">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{profile.name ?? "مستخدم"}</h1>
                {isOwnProfile && (
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={openEditDialog}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>تعديل الملف الشخصي</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">الاسم</label>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            maxLength={50}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">النبذة</label>
                          <textarea
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            maxLength={200}
                            rows={3}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <Button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="w-full">
                          {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {/* Follow Button */}
                {isAuthenticated && !isOwnProfile && (
                  <Button
                    size="sm"
                    variant={isFollowingUser ? "outline" : "default"}
                    className={`gap-2 ${isFollowingUser ? "border-primary/30 text-primary hover:bg-primary/10" : "bg-gradient-to-l from-primary to-accent text-white"}`}
                    onClick={() => toggleFollow.mutate({ userId })}
                    disabled={toggleFollow.isPending}
                  >
                    {toggleFollow.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowingUser ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        إلغاء المتابعة
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        متابعة
                      </>
                    )}
                  </Button>
                )}
              </div>
              {profile.bio && (
                <p className="text-muted-foreground text-sm mb-3">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
                <div className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{profile.videoCount}</span>
                  <span className="text-muted-foreground">فيديو</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{followStats?.followers ?? 0}</span>
                  <span className="text-muted-foreground">متابِع</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{followStats?.following ?? 0}</span>
                  <span className="text-muted-foreground">يتابع</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-foreground">{profile.totalPoints}</span>
                  <span className="text-muted-foreground">نقطة</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-foreground">المستوى {profile.level}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <Card className="mt-6 p-4 bg-card/50 border-border/30 max-w-lg mx-auto md:mx-0">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">المستوى {profile.level}</span>
              <span className="text-accent font-medium">{profile.totalPoints} / {profile.nextLevelThreshold} نقطة</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </Card>
        </div>
      </section>

      {/* Tabs: Videos / Followers / Following */}
      <section className="container pb-12">
        <Tabs defaultValue="videos" dir="rtl">
          <TabsList className="mb-6 bg-secondary/50">
            <TabsTrigger value="videos" className="gap-2">
              <Video className="w-4 h-4" />
              الفيديوهات ({profile.videoCount})
            </TabsTrigger>
            <TabsTrigger value="followers" className="gap-2">
              <Users className="w-4 h-4" />
              المتابِعون ({followStats?.followers ?? 0})
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-2">
              <Users className="w-4 h-4" />
              يتابع ({followStats?.following ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            {userVideos && userVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {userVideos.map((video) => (
                  <VideoCard key={video.id} {...video} createdAt={video.createdAt} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد فيديوهات بعد</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers">
            {followers && followers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {followers.map((follower) => (
                  <Link key={follower.id} href={`/profile/${follower.id}`}>
                    <Card className="p-4 bg-card/50 border-border/30 hover:border-primary/30 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={follower.avatarUrl ?? undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {(follower.name || "م")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{follower.name || "مستخدم"}</p>
                          <p className="text-xs text-muted-foreground">المستوى {follower.level}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">لا يوجد متابِعون بعد</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="following">
            {following && following.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {following.map((followedUser) => (
                  <Link key={followedUser.id} href={`/profile/${followedUser.id}`}>
                    <Card className="p-4 bg-card/50 border-border/30 hover:border-primary/30 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={followedUser.avatarUrl ?? undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {(followedUser.name || "م")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{followedUser.name || "مستخدم"}</p>
                          <p className="text-xs text-muted-foreground">المستوى {followedUser.level}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">لا يتابع أحداً بعد</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
