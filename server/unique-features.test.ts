import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 11,
    openId: "unique-features-test-user",
    email: "unique@example.com",
    name: "Unique Features Test",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("unique trend features", () => {
  it("rejects a community trend entry without exactly one content source", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.communityTrend.join({ trendId: 1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.communityTrend.join({ trendId: 1, videoId: 2, postId: 3 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a local challenge whose end date precedes its start date", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.localChallenge.create({
      title: "تحدي اختبار",
      scope: "city",
      startsAt: new Date("2026-08-20T12:00:00Z"),
      endsAt: new Date("2026-08-19T12:00:00Z"),
      rewardPoints: 100,
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("filters local challenges accurately by city and community", async () => {
    const caller = appRouter.createCaller(createContext());
    const db = await import("./db");
    const now = new Date();
    const future = new Date(Date.now() + 86400000 * 7);
    await db.createLocalChallenge({
      title: "تحدي الإسكندرية",
      scope: "city",
      locationName: "الإسكندرية",
      rewardPoints: 100,
      startsAt: now,
      endsAt: future,
    });
    await db.createLocalChallenge({
      title: "تحدي التصوير",
      scope: "community",
      communityName: "محبو التصوير",
      rewardPoints: 150,
      startsAt: now,
      endsAt: future,
    });

    const cityChallenges = await caller.localChallenge.active({ scope: "city", locationName: "الإسكندرية" });
    expect(cityChallenges.some(c => c.title === "تحدي الإسكندرية")).toBe(true);
    expect(cityChallenges.some(c => c.title === "تحدي التصوير")).toBe(false);

    const communityChallenges = await caller.localChallenge.active({ scope: "community", communityName: "محبو التصوير" });
    expect(communityChallenges.some(c => c.title === "تحدي التصوير")).toBe(true);
    expect(communityChallenges.some(c => c.title === "تحدي الإسكندرية")).toBe(false);
  });

  it("integrates the AI assistant into video publishing", () => {
    const uploadSource = readFileSync(resolve(process.cwd(), "client/src/pages/Upload.tsx"), "utf8");
    expect(uploadSource).toContain("trpc.aiContent.suggest");
    expect(uploadSource).toContain("setTitle(data.title)");
    expect(uploadSource).toContain("setHashtags");
  });

  it("rejects a competition entry without exactly one content source", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.competition.join({ competitionId: 1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.competition.join({ competitionId: 1, videoId: 2, postId: 3 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("protects competition creation from regular users", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.competition.create({
      title: "مسابقة اختبار",
      category: "إبداع",
      prizeTitle: "شارة اختبار",
      prizePoints: 100,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 86400000),
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("stores notification preference changes and exposes creator analytics", async () => {
    const caller = appRouter.createCaller(createContext());
    const updated = await caller.notification.updatePreferences({ competitionsEnabled: false, challengesEnabled: false });
    expect(updated.success).toBe(true);
    expect(updated.preferences?.competitionsEnabled).toBe(false);
    const analytics = await caller.creatorAnalytics.mine();
    expect(analytics).toMatchObject({ videoCount: expect.any(Number), engagementRate: expect.any(Number) });
  });

  it("wires creator analytics, competition controls, and notification settings in the UI", () => {
    const creatorSource = readFileSync(resolve(process.cwd(), "client/src/pages/CreatorDashboard.tsx"), "utf8");
    const competitionSource = readFileSync(resolve(process.cwd(), "client/src/pages/CompetitionDetail.tsx"), "utf8");
    const preferenceSource = readFileSync(resolve(process.cwd(), "client/src/pages/NotificationSettings.tsx"), "utf8");
    const leaderboardSource = readFileSync(resolve(process.cwd(), "client/src/pages/Leaderboard.tsx"), "utf8");
    expect(creatorSource).toContain("trpc.creatorAnalytics.mine");
    expect(competitionSource).toContain("trpc.competition.announce");
    expect(competitionSource).toContain("trpc.competition.declareWinner");
    expect(preferenceSource).toContain("trpc.notification.updatePreferences");
    expect(leaderboardSource).toContain("trpc.competition.recentWinners");
  });

  it("awards a competition winner and exposes the prize to the leaderboard data", async () => {
    const db = await import("./db");
    const uniqueTitle = `مسابقة تكامل ${Date.now()}`;
    const competitionId = await db.createCompetition({
      title: uniqueTitle,
      category: "اختبار",
      prizeTitle: "شارة بطل الاختبار",
      prizeIcon: "trophy",
      prizePoints: 77,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 86400000),
    });
    expect(competitionId).toBeTypeOf("number");
    const entryId = await db.joinCompetition({ competitionId: competitionId!, userId: 11, videoId: 1, caption: "مشاركة اختبار" });
    await db.voteCompetitionEntry(entryId!, 21);
    const award = await db.awardCompetitionWinner(competitionId!, 11);
    expect(award).toMatchObject({ winnerUserId: 11, alreadyAwarded: false });
    const winners = await db.getRecentCompetitionWinners(20);
    expect(winners).toEqual(expect.arrayContaining([
      expect.objectContaining({ competitionTitle: uniqueTitle, title: "شارة بطل الاختبار", pointsAwarded: 77 }),
    ]));
  });

  it("exposes the three feature groups", () => {
    const caller = appRouter.createCaller(createContext());
    expect(caller.communityTrend.active).toBeTypeOf("function");
    expect(caller.localChallenge.active).toBeTypeOf("function");
    expect(caller.aiContent.suggest).toBeTypeOf("function");
  });
});
