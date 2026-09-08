import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 7,
    openId: "posts-test-user",
    email: "posts@example.com",
    name: "Posts Test User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("multi-block posts and stories", () => {
  it("rejects a text block with more than five lines", async () => {
    const caller = appRouter.createCaller(createContext());
    const sixLines = ["سطر 1", "سطر 2", "سطر 3", "سطر 4", "سطر 5", "سطر 6"].join("\n");

    await expect(caller.post.publish({
      visibility: "public",
      blocks: [{ blockType: "text", textContent: sixLines }],
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects two adjacent text blocks and enforces alternating order", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.post.publish({
      visibility: "public",
      blocks: [
        { blockType: "text", textContent: "المقطع الأول" },
        { blockType: "text", textContent: "المقطع الثاني" },
      ],
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("exposes the story and post publishing procedures", () => {
    const caller = appRouter.createCaller(createContext());
    expect(caller.post.publish).toBeTypeOf("function");
    expect(caller.story.publish).toBeTypeOf("function");
    expect(caller.media.upload).toBeTypeOf("function");
  });
});
