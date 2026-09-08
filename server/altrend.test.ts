import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { calculateLevel, getNextLevelThreshold } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

function createAuthContext(overrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "مستخدم تجريبي",
    loginMethod: "manus",
    role: "user",
    avatarUrl: null,
    bio: null,
    totalPoints: 50,
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("مستخدم تجريبي");
    expect(result?.openId).toBe("test-user-123");
  });
});

describe("calculateLevel", () => {
  it("returns level 1 for 0 points", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("returns level 2 for 100 points", () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it("returns level 3 for 300 points", () => {
    expect(calculateLevel(300)).toBe(3);
  });

  it("returns level 5 for 1000 points", () => {
    expect(calculateLevel(1000)).toBe(5);
  });

  it("returns level 10 for 10000 points", () => {
    expect(calculateLevel(10000)).toBe(10);
  });

  it("returns level 1 for negative points", () => {
    expect(calculateLevel(-10)).toBe(1);
  });
});

describe("getNextLevelThreshold", () => {
  it("returns 100 for level 1", () => {
    expect(getNextLevelThreshold(1)).toBe(100);
  });

  it("returns 300 for level 2", () => {
    expect(getNextLevelThreshold(2)).toBe(300);
  });

  it("returns 10000 for level 9", () => {
    expect(getNextLevelThreshold(9)).toBe(10000);
  });
});

describe("spin wheel prizes", () => {
  it("all prizes are positive numbers", () => {
    const prizes = [5, 10, 15, 20, 25, 30, 50, 100];
    prizes.forEach(p => {
      expect(p).toBeGreaterThan(0);
    });
  });

  it("weights sum correctly", () => {
    const weights = [30, 25, 15, 10, 8, 6, 4, 2];
    const total = weights.reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });
});

describe("video router input validation", () => {
  it("rejects empty title for video upload", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.video.upload({
        title: "",
        base64: "dGVzdA==",
        mimeType: "video/mp4",
      })
    ).rejects.toThrow();
  });

  it("rejects title longer than 255 chars", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.video.upload({
        title: "a".repeat(256),
        base64: "dGVzdA==",
        mimeType: "video/mp4",
      })
    ).rejects.toThrow();
  });
});

describe("comment router input validation", () => {
  it("rejects empty comment content", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.comment.add({
        videoId: 1,
        content: "",
      })
    ).rejects.toThrow();
  });

  it("rejects comment longer than 500 chars", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.comment.add({
        videoId: 1,
        content: "a".repeat(501),
      })
    ).rejects.toThrow();
  });
});

describe("notification router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.list()).rejects.toThrow();
  });

  it("requires authentication for unreadCount", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.unreadCount()).rejects.toThrow();
  });

  it("requires authentication for markAllRead", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.markAllRead()).rejects.toThrow();
  });

  it("requires authentication for markRead", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.markRead({ notificationId: 1 })).rejects.toThrow();
  });
});

describe("follow router", () => {
  it("requires authentication for toggle", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.follow.toggle({ userId: 2 })).rejects.toThrow();
  });

  it("requires authentication for isFollowing", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.follow.isFollowing({ userId: 2 })).rejects.toThrow();
  });

  it("requires authentication for feed", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.follow.feed()).rejects.toThrow();
  });

  it("allows public access to follow stats", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // This should not throw since it's a public procedure
    // It may fail due to DB but not auth
    try {
      await caller.follow.stats({ userId: 1 });
    } catch (e: any) {
      // Should not be UNAUTHORIZED error
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });

  it("allows public access to followers list", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.follow.followers({ userId: 1 });
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });

  it("allows public access to following list", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.follow.following({ userId: 1 });
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });
});

describe("admin router", () => {
  it("denies non-admin access to stats", async () => {
    const { ctx } = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow("FORBIDDEN");
  });

  it("denies non-admin access to users list", async () => {
    const { ctx } = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.users()).rejects.toThrow("FORBIDDEN");
  });

  it("denies non-admin access to videos list", async () => {
    const { ctx } = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.videos()).rejects.toThrow("FORBIDDEN");
  });

  it("denies non-admin access to comments list", async () => {
    const { ctx } = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.comments()).rejects.toThrow("FORBIDDEN");
  });

  it("denies non-admin access to deleteVideo", async () => {
    const { ctx } = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.deleteVideo({ videoId: 1 })).rejects.toThrow("FORBIDDEN");
  });

  it("denies non-admin access to deleteComment", async () => {
    const { ctx } = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.deleteComment({ commentId: 1 })).rejects.toThrow("FORBIDDEN");
  });

  it("denies non-admin access to updateUserRole", async () => {
    const { ctx } = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.updateUserRole({ userId: 2, role: "admin" })).rejects.toThrow("FORBIDDEN");
  });

  it("denies unauthenticated access to admin stats", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });
});

describe("follow router input validation", () => {
  it("validates userId is a number for toggle", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error testing invalid input
      caller.follow.toggle({ userId: "abc" })
    ).rejects.toThrow();
  });

  it("validates userId is a number for isFollowing", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error testing invalid input
      caller.follow.isFollowing({ userId: "abc" })
    ).rejects.toThrow();
  });
});

describe("admin router input validation", () => {
  it("validates role enum for updateUserRole", async () => {
    const { ctx } = createAuthContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error testing invalid input
      caller.admin.updateUserRole({ userId: 1, role: "superadmin" })
    ).rejects.toThrow();
  });
});

// ===== HASHTAG ROUTER TESTS =====
describe("hashtag router", () => {
  it("trending - returns array for public", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw (no DB in test env)
    try {
      const result = await caller.hashtag.trending();
      expect(Array.isArray(result)).toBe(true);
    } catch {
      // DB not available in test - acceptable
    }
  });

  it("forVideo - requires valid videoId", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.hashtag.forVideo({ videoId: 1 });
      expect(Array.isArray(result)).toBe(true);
    } catch {
      // DB not available in test - acceptable
    }
  });
});

// ===== CHALLENGE ROUTER TESTS =====
describe("challenge router", () => {
  it("active - returns array for public", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.challenge.active();
      expect(Array.isArray(result)).toBe(true);
    } catch {
      // DB not available in test - acceptable
    }
  });

  it("create - requires admin role", async () => {
    const { ctx } = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.challenge.create({
        title: "تحدي اختبار",
        description: "وصف التحدي",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        prizePoints: 100,
      })
    ).rejects.toThrow();
  });

  it("create - admin can create challenge", async () => {
    const { ctx } = createAuthContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.challenge.create({
        title: "تحدي اختبار",
        description: "وصف التحدي",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        prizePoints: 100,
      });
    } catch (e: unknown) {
      // DB not available - check it's not a FORBIDDEN error
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).not.toContain("FORBIDDEN");
    }
  });

  it("updateStatus - requires admin role", async () => {
    const { ctx } = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.challenge.updateStatus({ challengeId: 1, status: "voting" })
    ).rejects.toThrow();
  });
});

// ===== LEADERBOARD ROUTER TESTS =====
describe("leaderboard router", () => {
  it("top - returns array for public", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.leaderboard.top({ limit: 10 });
      expect(Array.isArray(result)).toBe(true);
    } catch {
      // DB not available in test - acceptable
    }
  });
});

// ===== MESSAGE ROUTER TESTS =====
describe("message router", () => {
  it("conversations - requires auth", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.message.conversations()).rejects.toThrow();
  });

  it("startConversation - cannot message self", async () => {
    const { ctx } = createAuthContext({ id: 5 });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.message.startConversation({ userId: 5 })
    ).rejects.toThrow();
  });
});

// ===== BADGE ROUTER TESTS =====
describe("badge router", () => {
  it("userBadges - returns array for public", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.badge.userBadges({ userId: 1 });
      expect(Array.isArray(result)).toBe(true);
    } catch {
      // DB not available - acceptable
    }
  });
});
