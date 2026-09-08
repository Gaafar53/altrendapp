import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { Flame, Upload, Search, Trophy, User, LogOut, Dices, Home, Bell, Users, Shield, MessageCircle, Hash, Swords, Crown, Bookmark, Gift, BookOpen, FileText, Sparkles, MapPinned, BarChart3, Medal } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // استخدام hook الإشعارات الفورية - يعرض toast تلقائياً عند وصول إشعار جديد
  const { unreadCount: notifCount } = useNotifications();
  const unreadCount = notifCount;

  const { data: unreadMsgs } = trpc.message.unreadTotal.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const navLinks = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/trending", label: "الترند", icon: Flame },
    { href: "/challenges", label: "التحديات", icon: Swords },
    { href: "/hashtags", label: "هاشتاق", icon: Hash },
    { href: "/leaderboard", label: "المتصدرين", icon: Crown },
    { href: "/community-trends", label: "ترند جماعي", icon: Sparkles },
    { href: "/local-challenges", label: "محلي", icon: MapPinned },
    { href: "/content-assistant", label: "مساعد AI", icon: Sparkles },
    { href: "/competitions", label: "مسابقات", icon: Medal },
  ];

  const visibleNavLinks = navLinks;

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text hidden sm:block">الترند</span>
        </Link>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {visibleNavLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={location === link.href ? "default" : "ghost"}
                size="sm"
                className={`gap-2 ${location === link.href ? "glow-primary" : ""}`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن فيديو..."
                className="bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground w-40 sm:w-56 focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onBlur={() => {
                  if (!searchQuery) setSearchOpen(false);
                }}
              />
            </form>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
              <Search className="w-5 h-5" />
            </Button>
          )}

          {isAuthenticated && (
            <>
              {/* Messages */}
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="relative">
                  <MessageCircle className="w-5 h-5" />
                  {(unreadMsgs ?? 0) > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-green-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadMsgs! > 9 ? "9+" : unreadMsgs}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Favorites */}
              <Link href="/favorites">
                <Button variant="ghost" size="icon">
                  <Bookmark className="w-5 h-5" />
                </Button>
              </Link>

              {/* Referrals */}
              <Link href="/referrals">
                <Button variant="ghost" size="icon">
                  <Gift className="w-5 h-5" />
                </Button>
              </Link>

              {/* Notifications Bell */}
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {(unreadCount ?? 0) > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadCount! > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              <Link href="/publish?mode=story">
                <Button variant="outline" size="sm" className="gap-2 border-accent/40 text-accent hover:bg-accent/10" aria-label="نشر قصة">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden lg:inline">قصة</span>
                </Button>
              </Link>

              <Link href="/publish">
                <Button variant="outline" size="sm" className="gap-2 border-primary/40 text-primary hover:bg-primary/10" aria-label="نشر منشور عام">
                  <FileText className="w-4 h-4" />
                  <span className="hidden lg:inline">منشور</span>
                </Button>
              </Link>

              <Link href="/upload">
                <Button size="sm" className="gap-2 bg-gradient-to-l from-primary to-accent text-white hover:opacity-90">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">نشر فيديو</span>
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {user?.name?.charAt(0) ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user?.id}`} className="flex items-center gap-2 no-underline">
                      <User className="w-4 h-4" />
                      ملفي الشخصي
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="flex items-center gap-2 no-underline">
                      <MessageCircle className="w-4 h-4" />
                      الرسائل
                      {(unreadMsgs ?? 0) > 0 && (
                        <span className="mr-auto bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadMsgs}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications" className="flex items-center gap-2 no-underline">
                      <Bell className="w-4 h-4" />
                      الإشعارات
                      {(unreadCount ?? 0) > 0 && (
                        <span className="mr-auto bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/feed" className="flex items-center gap-2 no-underline">
                      <Users className="w-4 h-4" />
                      فيد المتابعين
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/creator-dashboard" className="flex items-center gap-2 no-underline">
                      <BarChart3 className="w-4 h-4" />
                      إحصاءات المحتوى
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notification-settings" className="flex items-center gap-2 no-underline">
                      <Bell className="w-4 h-4" />
                      إعدادات الإشعارات
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/challenges" className="flex items-center gap-2 no-underline">
                      <Swords className="w-4 h-4" />
                      التحديات
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/spin" className="flex items-center gap-2 no-underline">
                      <Dices className="w-4 h-4" />
                      عجلة الحظ
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user?.id}`} className="flex items-center gap-2 no-underline">
                      <Trophy className="w-4 h-4" />
                      نقاطي: {user?.totalPoints ?? 0}
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 no-underline text-accent">
                          <Shield className="w-4 h-4" />
                          لوحة التحكم
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                    <LogOut className="w-4 h-4 ml-2" />
                    تسجيل خروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!isAuthenticated && (
            <Button
              size="sm"
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-gradient-to-l from-primary to-accent text-white"
            >
              تسجيل دخول
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 flex items-center justify-around py-2 px-4">
        {visibleNavLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-0.5 h-auto py-1 px-2 ${location === link.href ? "text-primary" : "text-muted-foreground"}`}
            >
              <link.icon className="w-5 h-5" />
              <span className="text-[10px]">{link.label}</span>
            </Button>
          </Link>
        ))}
        {isAuthenticated && (
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-0.5 h-auto py-1 px-2 relative ${location === "/notifications" ? "text-primary" : "text-muted-foreground"}`}
            >
              <Bell className="w-5 h-5" />
              <span className="text-[10px]">إشعارات</span>
              {(unreadCount ?? 0) > 0 && (
                <span className="absolute top-0 right-1 bg-accent text-accent-foreground text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount! > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>
        )}
        {isAuthenticated ? (
          <Link href={`/profile/${user?.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-0.5 h-auto py-1 px-2 ${location.startsWith("/profile") ? "text-primary" : "text-muted-foreground"}`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px]">حسابي</span>
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-0.5 h-auto py-1 px-2 text-muted-foreground"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">دخول</span>
          </Button>
        )}
      </div>
    </nav>
  );
}
